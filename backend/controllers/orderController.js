import prisma from '../config/prisma.js';
import { sendOTP } from '../services/whatsapp.js';
import { getIO } from '../socket.js';

// 1. PUNCH ORDER
export const createOrder = async (req, res) => {
  try {
    console.log('\n############################################################');
    console.log('[ORDER CTRL] >>>  NEW ORDER REQUEST  <<<');
    console.log('[ORDER CTRL] Timestamp:', new Date().toISOString());
    console.log('############################################################');
    console.log('[ORDER CTRL] Full request body:', JSON.stringify(req.body, null, 2));

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

    // Generate unique external Order ID using timestamp to avoid collisions on restart
    const externalOrderId = `ORD${Date.now().toString(36).toUpperCase()}`;
    const currentOrderDate = new Date().toISOString();
    console.log('[ORDER CTRL DEBUG] Generated orderId:', externalOrderId);

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
        currency: "INR", // Default currency
        status: "RECEIVED",

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
            modifiers: item.modifiers || [], // JSON array of modifiers
            // Legacy fields for backward compatibility
            price: Number(item.price || 0),
            instruction: (item.instruction || item.instructions)?.toString() || "",
          })),
        },
      },
      include: { items: true },
    });

    console.log('[ORDER CTRL] Order saved to DB. ID:', newOrder.id, '| orderId:', newOrder.orderId);
    console.log('[ORDER CTRL] Items saved:', newOrder.items.length);

    // CONSTRUCT EXACT POS PAYLOAD
    const posPayload = {
      outletId: newOrder.outletId || "010",
      restaurantid: newOrder.restaurantId || "210014",
      OrderId: newOrder.orderId,
      OrderDate: newOrder.orderDate.toISOString(),
      PosCode: newOrder.posCode || "001",
      TblNo: newOrder.tableNumber,
      guest: {
        guestId: newOrder.guestId || "",
        name: newOrder.guestName || "",
        phone: newOrder.guestPhone || "",
        email: newOrder.guestEmail || "",
        dateOfBirth: newOrder.guestDob || "",
        anniversary: newOrder.guestAnniversary || ""
      },
      subtotal: newOrder.subtotal || 0,
      discountAmount: newOrder.discountAmount || 0,
      taxAmount: newOrder.taxAmount || 0,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod || "",
      currency: newOrder.currency || "INR",
      items: cartItems.map(item => ({
        itemId: item.id?.toString() || item.itemId?.toString(),
        itemName: item.name?.toString() || item.itemName?.toString() || "Unknown Item",
        category: item.category?.toString() || "Uncategorized",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.price || 0),
        totalPrice: Number((item.price || 0) * (item.quantity || 1)),
        modifiers: item.modifiers || [],
        discountApplied: Number(item.discountApplied || 0)
      }))
    };

    console.log("[ORDER CTRL] POS PAYLOAD:\n", JSON.stringify(posPayload, null, 2));

    // ============ WHATSAPP OTP STEP ============
    const customerPhone = guestPhone || '';
    console.log('\n------------------------------------------------------------');
    console.log('[ORDER CTRL] >>> WHATSAPP OTP STEP <<<');
    console.log('[ORDER CTRL] guestPhone from req.body:', guestPhone);
    console.log('[ORDER CTRL] customerPhone resolved:', customerPhone);
    console.log('[ORDER CTRL] customerPhone truthy?', !!customerPhone);
    console.log('[ORDER CTRL] customerPhone length:', customerPhone.length);
    console.log('------------------------------------------------------------');

    if (customerPhone) {
      try {
        console.log('[ORDER CTRL] Calling sendOTP() with phone:', customerPhone);
        const otpResult = await sendOTP(customerPhone);
        console.log('[ORDER CTRL] sendOTP() returned:', JSON.stringify(otpResult, null, 2));

        if (otpResult.success) {
          console.log('[ORDER CTRL] WhatsApp OTP SENT. OTP:', otpResult.otp, '| mock:', otpResult.mock || false);
        } else {
          console.log('[ORDER CTRL] WhatsApp OTP FAILED:', otpResult.error);
        }
      } catch (waError) {
        // Log but DO NOT crash the server or stop the order flow
        console.error('[ORDER CTRL] WhatsApp error (NON-BLOCKING):', waError.message);
        console.error('[ORDER CTRL] WhatsApp error stack:', waError.stack);
      }
    } else {
      console.log('[ORDER CTRL] SKIPPED WhatsApp — no guestPhone in request body');
    }

    // Emit to Kitchen Display System
    const io = getIO();
    if (io) {
      io.emit('NEW_ORDER_RECEIVED', newOrder);
      console.log('[ORDER CTRL] Socket.io emitted NEW_ORDER_RECEIVED');
    } else {
      console.log('[ORDER CTRL] WARNING: Socket.io not available, could not emit');
    }

    console.log('[ORDER CTRL] Sending 201 response to client');
    res.status(201).json({
      success: true,
      message: "Order logged!",
      order: newOrder,
      posPayload: posPayload,
      orderId: newOrder.id
    });
  } catch (error) {
    console.error('[ORDER CTRL] FATAL ERROR:', error.message);
    console.error('[ORDER CTRL] Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. GET ALL ORDERS
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
