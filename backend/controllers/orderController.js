import prisma from '../config/prisma.js';
import { sendWhatsAppReceipt } from '../services/whatsapp.js';

// Mock order counter for generating sequential test IDs
let orderCounter = 12345;

// 1. PUNCH ORDER
export const createOrder = async (req, res) => {
  try {
    const { cartItems, billDetails, tableNumber, paymentMethod, outletId, restaurantId, posCode } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart khali hai!" });
    }

    const newOrder = await prisma.order.create({
      data: {
        restaurantId: restaurantId?.toString(),
        outletId: outletId?.toString(),
        posCode: posCode?.toString(),
        tableNumber: tableNumber?.toString() || "Takeaway",
        totalAmount: Number(billDetails?.total || 0),
        paymentMethod: paymentMethod?.toString() || "PENDING",
        status: "RECEIVED",
        items: {
  create: cartItems.map((item) => ({
    itemId: item.id?.toString() || item.itemId?.toString(), 
    // 👇 This line has been updated to handle both itemName and name properties
    itemName: (item.itemName || item.name)?.toString() || "Unknown Item", 
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    // 👇 This line has been updated for safety to handle both instruction and instructions properties
    instruction: (item.instruction || item.instructions)?.toString() || "", 
  })),
},
      },
      include: { items: true },
    });

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

    res.status(201).json({ 
      success: true, 
      message: "Order logged!", 
      order: newOrder,
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