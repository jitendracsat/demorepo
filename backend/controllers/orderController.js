import prisma from '../config/prisma.js';

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
    // 👇 Is line ko change karo (Ab ye itemName aur name dono ko pakad lega)
    itemName: (item.itemName || item.name)?.toString() || "Unknown Item", 
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    // 👇 Isko bhi update kar do safety ke liye
    instruction: (item.instruction || item.instructions)?.toString() || "", 
  })),
},
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, message: "Order logged!", order: newOrder });
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