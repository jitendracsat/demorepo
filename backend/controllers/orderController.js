import prisma from '../config/prisma.js';
import { sendWhatsAppReceipt } from '../services/whatsapp.js';
import { getIO } from '../socket.js';

// Mock order counter for generating sequential test IDs
let orderCounter = 12345;

// 1. PUNCH ORDER
export const createOrder = async (req, res) => {
  try {
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

    // Generate external Order ID for POS system
    const externalOrderId = `ORD${String(orderCounter++).padStart(6, '0')}`;
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
        discountAmount: Number(billDetails?.discountAmount || 0),
        taxAmount: Number(billDetails?.taxAmount || 0),
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

    // Generate receipt URL and send WhatsApp message
    const receiptUrl = `http://localhost:3000/bill/${newOrder.id}`;
    const dummyPhoneNumber = '+91-98765-43210';
    
    // Send WhatsApp receipt with fallback logic
    console.log('📱 Sending WhatsApp receipt...');
    const whatsappResult = await sendWhatsAppReceipt(dummyPhoneNumber, receiptUrl);
    
    if (whatsappResult.success) {
      console.log('✅ WhatsApp message sent successfully');
    } else {
      console.log('⚠️ WhatsApp message failed:', whatsappResult.error);
    }
    
    // Simulate SMS gateway trigger (keeping for backward compatibility)
    console.log('📱 Simulating SMS Gateway Trigger:');
    console.log(`   To: ${dummyPhoneNumber}`);
    console.log(`   Message: Your digital receipt is ready! View your order details: ${receiptUrl}`);
    console.log(`   Order ID: ${newOrder.id}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('✅ SMS sent successfully (simulated)');

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
      orderId: newOrder.id,
      receiptUrl: receiptUrl
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