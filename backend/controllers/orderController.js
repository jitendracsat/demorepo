import prisma from '../config/prisma.js';
import { sendOTP } from '../services/whatsapp.js';
import { getIO } from '../socket.js';

// 1. PUNCH ORDER
export const createOrder = async (req, res) => {
  try {
    console.log('\n========== [ORDER CONTROLLER] NEW ORDER REQUEST ==========');
    console.log('[ORDER CTRL] Timestamp:', new Date().toISOString());
    console.log('[ORDER CTRL] Request body:', JSON.stringify(req.body, null, 2));

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

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart khali hai!" });
    }

    // Generate unique external Order ID using timestamp to avoid collisions on restart
    const externalOrderId = `ORD${Date.now().toString(36).toUpperCase()}`;
    const currentOrderDate = new Date().toISOString();

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

    // 🔥 CONSTRUCT EXACT POS PAYLOAD
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

    // 🔥 LOG FOR MENTOR - CRITICAL!
    console.log("🔥 EXACT POS PAYLOAD GENERATED:\n", JSON.stringify(posPayload, null, 2));

    // Send WhatsApp OTP to guest's phone number
    const customerPhone = guestPhone || '';

    if (customerPhone) {
      try {
        console.log('[ORDER CTRL] Sending WhatsApp OTP to:', customerPhone);
        const otpResult = await sendOTP(customerPhone);

        if (otpResult.success) {
          console.log('[ORDER CTRL] WhatsApp OTP sent successfully');
        } else {
          console.log('[ORDER CTRL] WhatsApp OTP failed:', otpResult.error);
        }
      } catch (waError) {
        // Log but DO NOT crash the server or stop the order flow
        console.error('[ORDER CTRL] WhatsApp error (non-blocking):', waError.message);
      }
    } else {
      console.log('[ORDER CTRL] No guest phone provided, skipping WhatsApp OTP');
    }

    // Emit to Kitchen Display System
    const io = getIO();
    if (io) {
      io.emit('NEW_ORDER_RECEIVED', newOrder);
    }

    res.status(201).json({
      success: true,
      message: "Order logged!",
      order: newOrder,
      posPayload: posPayload, // 🔥 INCLUDE POS PAYLOAD IN RESPONSE
      orderId: newOrder.id
    });
  } catch (error) {
    console.error("❌ Save Error:", error);
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

// 3. 🚀 NAYA FEATURE: GET SINGLE BILL BY ID (For E-Receipt)
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params; // URL se UUID nikalenge

    const orderBill = await prisma.order.findUnique({
      where: { id: id },
      include: { items: true }, // Sath mein dishes bhi bhejenge
    });

    if (!orderBill) {
      return res.status(404).json({ success: false, message: "Bill not found!" });
    }

    res.status(200).json({ success: true, bill: orderBill });
  } catch (error) {
    console.error("❌ Bill Fetch Error:", error);
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
    console.error('❌ Status Update Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};