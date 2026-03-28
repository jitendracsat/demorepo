import prisma from '../config/prisma.js';
import { sendOTP } from '../services/whatsapp.js';
import { getIO } from '../socket.js';

// 1. PUNCH ORDER
export const createOrder = async (req, res) => {
  try {
    console.log('\n############################################################');
    console.log('--- [STAGE 1] BACKEND: Order Request Received from Frontend ---');
    console.log('[STAGE 1] Timestamp:', new Date().toISOString());
    console.log('############################################################');
    console.log('[STAGE 1] req.body:', JSON.stringify(req.body, null, 2));

    const {
      cartItems,
      billDetails,
      tableNumber,
      paymentMethod,
      outletId,
      restaurantId,
      posCode,
      // New guest information fields
      guestId,
      guestName,
      guestPhone,
      guestEmail,
      guestDob,
      guestAnniversary
    } = req.body;

    // --- DEBUG: Log every destructured field ---
    console.log('[ORDER CTRL DEBUG] Destructured fields:');
    console.log('  cartItems:', cartItems?.length, 'items');
    console.log('  billDetails:', JSON.stringify(billDetails));
    console.log('  tableNumber:', tableNumber);
    console.log('  guestPhone:', guestPhone, '| type:', typeof guestPhone);
    console.log('  guestName:', guestName);
    console.log('  guestId:', guestId);

    if (!cartItems || cartItems.length === 0) {
      console.log('[ORDER CTRL] REJECTED — cart is empty');
      return res.status(400).json({ success: false, message: "Cart khali hai!" });
    }

    // Generate unique 8-char Order ID: B + 7 hex chars from timestamp (matches partner format e.g. B0644259)
    const externalOrderId = `B${Date.now().toString(16).slice(-7).toUpperCase()}`;
    const currentOrderDate = new Date().toISOString();
    console.log('[ORDER CTRL DEBUG] Generated orderId:', externalOrderId);

    // ============ STEP 1: Save order with isVerified: false ============
    const newOrder = await prisma.order.create({
      data: {
        // POS System Required Fields
        restaurantId: restaurantId?.toString(),
        outletId: outletId?.toString(),
        posCode: posCode?.toString(),
        orderId: externalOrderId,
        orderDate: new Date(currentOrderDate),

        // Guest Information (flattened from guest object)
        guestId: guestId?.toString(),
        guestName: guestName?.toString(),
        guestPhone: guestPhone?.toString(),
        guestEmail: guestEmail?.toString(),
        guestDob: guestDob?.toString(),
        guestAnniversary: guestAnniversary?.toString(),

        // Order Financial Details
        subtotal: Number(billDetails?.subtotal || 0),
        discountAmount: Number(billDetails?.discount || 0),
        taxAmount: Number(billDetails?.taxAmount || billDetails?.taxes || 0),
        totalAmount: Number(billDetails?.total || 0),

        // Order Details
        tableNumber: tableNumber?.toString() || "Takeaway",
        paymentMethod: paymentMethod?.toString() || "PENDING",
        currency: "INR",
        status: "RECEIVED",
        isVerified: false, // Unverified until OTP confirmed

        // Items with new POS fields
        items: {
          create: cartItems.map((item) => ({
            itemId: item.id?.toString() || item.itemId?.toString(),
            itemName: (item.itemName || item.name)?.toString() || "Unknown Item",
            category: item.category?.toString() || "Uncategorized",
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.price || 0),
            totalPrice: Number((item.price || 0) * (item.quantity || 1)),
            discountApplied: Number(item.discountApplied || 0),
            modifiers: item.modifiers || [],
            price: Number(item.price || 0),
            instruction: (item.instruction || item.instructions)?.toString() || "",
          })),
        },
      },
      include: { items: true },
    });

    console.log('[ORDER CTRL] Order saved to DB. ID:', newOrder.id, '| orderId:', newOrder.orderId);
    console.log('[ORDER CTRL] Items saved:', newOrder.items.length);
    console.log('[ORDER CTRL] isVerified:', newOrder.isVerified);

    // ============ STEP 2: Generate OTP & store in DB ============
    const otpCode = String(Math.floor(1000 + Math.random() * 9000));
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log('\n------------------------------------------------------------');
    console.log('[ORDER CTRL] >>> OTP GENERATED <<<');
    console.log('[ORDER CTRL] OTP Code:', otpCode);
    console.log('[ORDER CTRL] OTP Expiry:', otpExpiry.toISOString());
    console.log('[ORDER CTRL] Order DB ID:', newOrder.id);
    console.log('------------------------------------------------------------');

    await prisma.order.update({
      where: { id: newOrder.id },
      data: { otpCode, otpExpiry },
    });

    // ============ STEP 3: WhatsApp OTP (non-blocking) ============
    const customerPhone = guestPhone || '';
    console.log('[ORDER CTRL] guestPhone:', guestPhone, '| customerPhone:', customerPhone);

    if (customerPhone) {
      try {
        console.log('[ORDER CTRL] Calling sendOTP() with phone:', customerPhone, '| OTP:', otpCode);
        const otpResult = await sendOTP(customerPhone, otpCode);
        console.log('[ORDER CTRL] sendOTP() returned:', JSON.stringify(otpResult, null, 2));

        if (otpResult.success) {
          console.log('[ORDER CTRL] WhatsApp OTP SENT. OTP:', otpResult.otp, '| mock:', otpResult.mock || false);
        } else {
          console.log('[ORDER CTRL] WhatsApp OTP FAILED:', otpResult.error);
        }
      } catch (waError) {
        // Log but DO NOT crash — OTP is stored in DB, user can use fallback "0000"
        console.error('[ORDER CTRL] WhatsApp error (NON-BLOCKING):', waError.message);
      }
    } else {
      console.log('[ORDER CTRL] SKIPPED WhatsApp — no guestPhone in request body');
    }

    // 🚨 NO POS SYNC here — moved to verifyOTP
    // 🚨 NO Socket.io emission here — moved to verifyOTP

    console.log('[ORDER CTRL] Sending 201 response — awaiting OTP verification');
    res.status(201).json({
      success: true,
      message: "Order created — OTP verification required",
      orderId: newOrder.id,
      externalOrderId: newOrder.orderId,
    });
  } catch (error) {
    console.error('[ORDER CTRL] FATAL ERROR:', error.message);
    console.error('[ORDER CTRL] Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. VERIFY OTP (Step 2 of order flow)
export const verifyOTP = async (req, res) => {
  try {
    const { orderId, userOtp } = req.body;

    console.log('\n############################################################');
    console.log('[VERIFY OTP] >>> OTP VERIFICATION REQUEST <<<');
    console.log('[VERIFY OTP] Timestamp:', new Date().toISOString());
    console.log('[VERIFY OTP] orderId:', orderId, '| userOtp:', userOtp);
    console.log('############################################################');

    if (!orderId || !userOtp) {
      return res.status(400).json({ success: false, message: 'orderId and userOtp are required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: { items: true },
    });

    if (!order) {
      console.log('[VERIFY OTP] Order NOT FOUND:', orderId);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.isVerified) {
      console.log('[VERIFY OTP] Order already verified:', orderId);
      return res.status(400).json({ success: false, message: 'Order already verified' });
    }

    // ── Type-safe normalization (fixes Number vs String / whitespace mismatches) ──
    const cleanUserOtp = String(userOtp).trim();
    const cleanDbOtp   = String(order.otpCode ?? '').trim();
    const now           = new Date();
    const expiryDate    = order.otpExpiry ? new Date(order.otpExpiry) : null;

    console.log('[VERIFY OTP] Comparing -> User:', cleanUserOtp, '(Type:', typeof cleanUserOtp, ') | DB:', cleanDbOtp, '(Type:', typeof cleanDbOtp, ')');
    console.log('[VERIFY OTP] Server time:', now.toISOString(), '| OTP expiry:', expiryDate ? expiryDate.toISOString() : 'null');

    const isMasterOtp = cleanUserOtp === '0000';
    const isOtpMatch  = cleanUserOtp === cleanDbOtp;

    console.log('[VERIFY OTP] isMasterOtp:', isMasterOtp, '| isOtpMatch:', isOtpMatch);

    // Check match first
    if (!isMasterOtp && !isOtpMatch) {
      console.log('[VERIFY OTP] REJECTED — OTP mismatch. User sent:', cleanUserOtp, '| DB has:', cleanDbOtp);
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // Check expiry only for real OTPs (not master)
    if (!isMasterOtp && expiryDate && now > expiryDate) {
      console.log('[VERIFY OTP] REJECTED — OTP expired at:', expiryDate.toISOString(), '| Current time:', now.toISOString());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // ============ OTP VALID — Mark as verified & clear OTP fields ============
    const verifiedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
      include: { items: true },
    });

    console.log('[VERIFY OTP] Order VERIFIED:', verifiedOrder.id, '| isVerified:', verifiedOrder.isVerified);

    // ============ POS PROXY SYNC (moved from createOrder) ============
    const safe = (val, maxLen) => val ? String(val).substring(0, maxLen) : "";
    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:5000';

    const posPayload = {
      outletId: safe(verifiedOrder.outletId, 10) || "020",
      restaurantid: safe(verifiedOrder.restaurantId, 10) || "240018",
      OrderId: verifiedOrder.orderId,
      OrderDate: verifiedOrder.orderDate.toISOString(),
      PosCode: safe(verifiedOrder.posCode, 10) || "rest",
      TblNo: safe(verifiedOrder.tableNumber, 10),
      callbackUrl: `${backendBaseUrl}/api/orders/status-update`,
      statusCallbackUrl: `${backendBaseUrl}/api/order/status`,
      guest: {
        guestId: safe(verifiedOrder.guestId, 20),
        name: safe(verifiedOrder.guestName, 50),
        phone: safe(verifiedOrder.guestPhone, 15),
        email: safe(verifiedOrder.guestEmail, 50),
        dateOfBirth: safe(verifiedOrder.guestDob, 20),
        anniversary: safe(verifiedOrder.guestAnniversary, 20)
      },
      subtotal: round2(verifiedOrder.subtotal),
      discountAmount: round2(verifiedOrder.discountAmount),
      taxAmount: round2(verifiedOrder.taxAmount),
      totalAmount: round2(verifiedOrder.totalAmount),
      paymentMethod: safe(verifiedOrder.paymentMethod, 20),
      currency: safe(verifiedOrder.currency, 5) || "INR",
      items: verifiedOrder.items.map(item => ({
        itemId: safe(item.itemId, 10),
        itemName: safe(item.itemName, 50),
        category: safe(item.category, 10) || "General",
        quantity: Number(item.quantity || 1),
        unitPrice: round2(item.unitPrice),
        totalPrice: round2(item.totalPrice),
        modifiers: item.modifiers || [],
        discountApplied: round2(item.discountApplied)
      }))
    };

    console.log("[VERIFY OTP] POS PAYLOAD:\n", JSON.stringify(posPayload, null, 2));

    try {
      const proxySecret = process.env.PROXY_SECRET;
      const proxyUrl = process.env.CSAT_PROXY_URL;

      if (!proxyUrl) {
        console.warn('[PROXY SYNC] SKIPPED — CSAT_PROXY_URL not set in .env');
      } else {
        console.log('[PROXY SYNC] >>> SENDING VERIFIED ORDER TO CSAT PROXY <<<');
        console.log('[PROXY SYNC] URL:', proxyUrl);

        const proxyStartTime = Date.now();
        const proxyRes = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Proxy-Secret': proxySecret || '',
            'outletId': safe(verifiedOrder.outletId, 10),
            'restaurantid': safe(verifiedOrder.restaurantId, 10),
            'poscode': safe(verifiedOrder.posCode, 10),
          },
          body: JSON.stringify(posPayload),
        });

        const proxyElapsed = Date.now() - proxyStartTime;
        const proxyData = await proxyRes.json().catch(() => null);

        console.log('[PROXY SYNC] Response in', proxyElapsed, 'ms | HTTP:', proxyRes.status);
        console.log('[PROXY SYNC] Body:', JSON.stringify(proxyData, null, 2));

        if (proxyRes.ok) {
          console.log('[PROXY SYNC] Order synced to CSAT proxy successfully');
        } else {
          console.error('[PROXY SYNC] CSAT proxy rejected — status:', proxyRes.status);
        }
      }
    } catch (proxyError) {
      console.error('[PROXY SYNC] FAILED (NON-BLOCKING):', proxyError.message);
    }

    // ============ SOCKET.IO KDS EMISSION (moved from createOrder) ============
    const io = getIO();
    if (io) {
      io.emit('NEW_ORDER_RECEIVED', verifiedOrder);
      console.log('[VERIFY OTP] Socket.io emitted NEW_ORDER_RECEIVED');
    } else {
      console.log('[VERIFY OTP] WARNING: Socket.io not available');
    }

    console.log('[VERIFY OTP] Sending 200 OK');
    res.status(200).json({
      success: true,
      message: 'Order verified successfully',
      order: verifiedOrder,
      posPayload,
    });
  } catch (error) {
    console.error('[VERIFY OTP] FATAL ERROR:', error.message);
    console.error('[VERIFY OTP] Stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const allOrders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(allOrders);
  } catch (error) {
    res.status(500).json({ error: "Fetch error" });
  }
};

// 3. GET SINGLE BILL BY ID (For E-Receipt)
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderBill = await prisma.order.findUnique({
      where: { id: id },
      include: { items: true },
    });

    if (!orderBill) {
      return res.status(404).json({ success: false, message: "Bill not found!" });
    }

    res.status(200).json({ success: true, bill: orderBill });
  } catch (error) {
    console.error("[ORDER CTRL] Bill Fetch Error:", error);
    res.status(500).json({ success: false, error: "Error fetching bill details" });
  }
};

// 4. UPDATE ORDER STATUS (Kitchen Display System)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['RECEIVED', 'PREPARING', 'SERVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Accepted values: ${validStatuses.join(', ')}`,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    // Push status change to all connected clients (bill page + KDS)
    const io = getIO();
    if (io) {
      io.emit('ORDER_STATUS_UPDATED', { id: updatedOrder.id, status: updatedOrder.status });
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('[ORDER CTRL] Status Update Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. INBOUND POS STATUS WEBHOOK
// POST /api/orders/status-update
// Called by partner POS system to push status changes
// Status codes: 1 = Accepted, 2 = Rejected, 3 = Food Ready, 4 = Served
const POS_STATUS_MAP = {
  1: 'ACCEPTED',
  2: 'REJECTED',
  3: 'FOOD_READY',
  4: 'SERVED',
};

export const posStatusWebhook = async (req, res) => {
  try {
    console.log('\n############################################################');
    console.log('--- [STAGE 3] WEBHOOK: Received Update from POS (POST body) ---');
    console.log('[STAGE 3] Timestamp:', new Date().toISOString());
    console.log('[STAGE 3] req.body:', JSON.stringify(req.body, null, 2));
    console.log('############################################################');

    const { OrderId, Status } = req.body;

    console.log('[POS WEBHOOK] OrderId:', OrderId, '| Status code:', Status);

    if (!OrderId || Status == null) {
      console.log('[POS WEBHOOK] REJECTED — missing OrderId or Status');
      return res.status(400).json({ success: false, message: 'Missing required fields: OrderId and Status' });
    }

    const mappedStatus = POS_STATUS_MAP[Number(Status)];
    if (!mappedStatus) {
      console.log('[POS WEBHOOK] REJECTED — unknown status code:', Status);
      return res.status(400).json({ success: false, message: `Unknown status code: ${Status}. Accepted: 1 (Accepted), 2 (Rejected), 3 (Food Ready), 4 (Served)` });
    }

    console.log('[POS WEBHOOK] Mapped status:', Status, '→', mappedStatus);

    // Find order by external OrderId
    const order = await prisma.order.findUnique({
      where: { orderId: String(OrderId) },
    });

    if (!order) {
      console.log('[POS WEBHOOK] Order NOT FOUND in DB for OrderId:', OrderId);
      return res.status(404).json({ success: false, message: `Order ${OrderId} not found` });
    }

    console.log('[POS WEBHOOK] Order found — DB id:', order.id, '| current status:', order.status);

    // Update status in DB
    const updatedOrder = await prisma.order.update({
      where: { orderId: String(OrderId) },
      data: { status: mappedStatus },
    });

    console.log('[POS WEBHOOK] DB updated — new status:', updatedOrder.status);

    // Emit real-time event to frontend
    const io = getIO();
    if (io) {
      io.emit('ORDER_STATUS_CHANGED', { orderId: String(OrderId), status: mappedStatus });
      console.log('[POS WEBHOOK] Socket.io emitted ORDER_STATUS_CHANGED:', { orderId: String(OrderId), status: mappedStatus });
    } else {
      console.log('[POS WEBHOOK] WARNING: Socket.io not available');
    }

    console.log('[POS WEBHOOK] Responding 200 OK to POS');
    return res.status(200).json({
      success: true,
      message: `Order ${OrderId} status updated to ${mappedStatus}`,
      orderId: updatedOrder.id,
      status: mappedStatus,
    });
  } catch (error) {
    console.error('[POS INBOUND] ERROR:', error.message);
    console.error('[POS INBOUND] Stack:', error.stack);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 6. INBOUND POS STATUS VIA QUERY PARAMS
// GET/POST /api/order/status?restaurantId=X&outletId=X&orderId=X&status=X
// Called by partner POS: http://orderstatus.csatcloud.com/api/order/status?...
// Status: 1=Accepted, 2=Rejected, 3=Food Ready, 4=Served
const INBOUND_STATUS_MAP = {
  '1': 'ACCEPTED',
  '2': 'REJECTED',
  '3': 'FOOD_READY',
  '4': 'SERVED',
};

export const inboundOrderStatus = async (req, res) => {
  try {
    const { restaurantId, outletId, orderId, status } = req.query;

    console.log('\n############################################################');
    console.log('--- [STAGE 3] WEBHOOK: Received Update from POS (query params) ---');
    console.log('[STAGE 3] Timestamp:', new Date().toISOString());
    console.log('[STAGE 3] Method:', req.method);
    console.log('[STAGE 3] Query params:', JSON.stringify(req.query));
    console.log('[STAGE 3] restaurantId:', restaurantId);
    console.log('[STAGE 3] outletId:', outletId);
    console.log('[STAGE 3] orderId:', orderId);
    console.log('[STAGE 3] status:', status);
    console.log('############################################################');

    if (!orderId || status == null) {
      console.log('[POS INBOUND] REJECTED — missing orderId or status');
      return res.status(400).json({ success: false, message: 'Missing required query params: orderId and status' });
    }

    const mappedStatus = INBOUND_STATUS_MAP[String(status)];
    if (!mappedStatus) {
      console.log('[POS INBOUND] REJECTED — unknown status:', status);
      return res.status(400).json({ success: false, message: `Unknown status: ${status}. Expected: 1=Accepted, 2=Rejected, 3=Food Ready, 4=Served` });
    }

    console.log('[POS INBOUND] Mapped:', status, '→', mappedStatus);

    // Find order by external orderId
    const order = await prisma.order.findUnique({
      where: { orderId: String(orderId) },
    });

    if (!order) {
      console.log('[POS INBOUND] Order NOT FOUND for orderId:', orderId);
      return res.status(404).json({ success: false, message: `Order ${orderId} not found` });
    }

    console.log('[POS INBOUND] Found — DB id:', order.id, '| current status:', order.status);

    // Update status in DB
    const updatedOrder = await prisma.order.update({
      where: { orderId: String(orderId) },
      data: { status: mappedStatus },
    });

    console.log('[POS INBOUND] DB updated — new status:', updatedOrder.status);

    // Emit real-time event to frontend
    const io = getIO();
    if (io) {
      io.emit('ORDER_STATUS_CHANGED', { orderId: String(orderId), status: mappedStatus });
      console.log('[POS INBOUND] Socket.io emitted ORDER_STATUS_CHANGED:', { orderId: String(orderId), status: mappedStatus });
    } else {
      console.log('[POS INBOUND] WARNING: Socket.io not available');
    }

    console.log('[POS INBOUND] Responding 200 OK');
    return res.status(200).json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('[POS INBOUND] ERROR:', error.message);
    console.error('[POS INBOUND] Stack:', error.stack);
    return res.status(500).json({ success: false, error: error.message });
  }
};
