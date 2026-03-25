import prisma from '../config/prisma.js';
import { getIO } from '../socket.js';

/**
 * POST /api/syncorder
 * Webhook handler for incoming POS sync from https://proxy.csatspl.com/api/syncorder
 *
 * Standard POS logic: Duplicate items (e.g., 'CINZANO ROSE BY BOTTLE' appearing twice)
 * are inserted as SEPARATE rows. Each line item in the POS payload represents a distinct
 * transaction line — they may differ in modifiers, time of addition, or discount context.
 */
export const syncOrder = async (req, res) => {
  try {
    const payload = req.body;

    // --- Validate required fields ---
    if (!payload.OrderId) {
      return res.status(400).json({ success: false, message: 'Missing required field: OrderId' });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing or empty items array' });
    }

    // --- Idempotency: Reject duplicate OrderId ---
    const existingOrder = await prisma.order.findUnique({
      where: { orderId: String(payload.OrderId) },
    });
    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: `Order ${payload.OrderId} already synced`,
        orderId: existingOrder.id,
      });
    }

    // --- Upsert Guest (unique by phone) ---
    const guestData = payload.guest || {};
    let guestRecord = null;

    if (guestData.phone) {
      guestRecord = await prisma.guest.upsert({
        where: { phone: String(guestData.phone) },
        update: {
          guestId: guestData.guestId ? String(guestData.guestId) : undefined,
          name: guestData.name || undefined,
          email: guestData.email || undefined,
          dateOfBirth: guestData.dateOfBirth || undefined,
          anniversary: guestData.anniversary || undefined,
        },
        create: {
          guestId: guestData.guestId ? String(guestData.guestId) : null,
          name: guestData.name || null,
          phone: String(guestData.phone),
          email: guestData.email || null,
          dateOfBirth: guestData.dateOfBirth || null,
          anniversary: guestData.anniversary || null,
        },
      });
    }

    // --- Build order items (each line item = separate row, standard POS logic) ---
    const orderItems = payload.items.map((item) => {
      const gstDetails = item.gst_details || {};
      const cgstRate = gstDetails.cgst != null ? Number(gstDetails.cgst) : null;
      const sgstRate = gstDetails.sgst != null ? Number(gstDetails.sgst) : null;
      const itemTotal = Number(item.totalPrice || 0);

      return {
        itemId: String(item.itemId),
        itemName: String(item.itemName || 'Unknown Item'),
        category: item.category ? String(item.category) : null,
        quantity: Number(item.quantity || 1),
        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
        totalPrice: itemTotal,
        discountApplied: item.discountApplied != null ? Number(item.discountApplied) : null,
        cgstRate,
        sgstRate,
        cgstAmount: cgstRate != null ? (itemTotal * cgstRate) / 100 : null,
        sgstAmount: sgstRate != null ? (itemTotal * sgstRate) / 100 : null,
        modifiers: item.modifiers || [],
        price: item.unitPrice != null ? Number(item.unitPrice) : null,
        instruction: item.instruction ? String(item.instruction) : null,
      };
    });

    // --- Create Order with nested items ---
    const newOrder = await prisma.order.create({
      data: {
        // POS fields
        restaurantId: payload.restaurantid ? String(payload.restaurantid) : null,
        outletId: payload.outletId ? String(payload.outletId) : null,
        posCode: payload.PosCode ? String(payload.PosCode) : null,
        orderId: String(payload.OrderId),
        orderDate: payload.OrderDate ? new Date(payload.OrderDate) : new Date(),

        // Guest FK link
        guestDbId: guestRecord ? guestRecord.id : null,

        // Guest flattened (backward compat)
        guestId: guestData.guestId ? String(guestData.guestId) : null,
        guestName: guestData.name || null,
        guestPhone: guestData.phone ? String(guestData.phone) : null,
        guestEmail: guestData.email || null,
        guestDob: guestData.dateOfBirth || null,
        guestAnniversary: guestData.anniversary || null,

        // Financials
        subtotal: payload.subtotal != null ? Number(payload.subtotal) : null,
        discountAmount: payload.discountAmount != null ? Number(payload.discountAmount) : null,
        taxAmount: payload.taxAmount != null ? Number(payload.taxAmount) : null,
        totalAmount: payload.totalAmount != null ? Number(payload.totalAmount) : null,

        // Order meta
        tableNumber: payload.TblNo ? String(payload.TblNo) : null,
        paymentMethod: payload.paymentMethod || null,
        currency: payload.currency || 'INR',
        status: 'RECEIVED',
        csatSyncStatus: true,

        // Nested items (each duplicate = separate row)
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    console.log(`✅ Synced order ${payload.OrderId} → DB id: ${newOrder.id} (${newOrder.items.length} items)`);

    // --- Emit to KDS via Socket.io ---
    const io = getIO();
    if (io) {
      io.emit('NEW_ORDER_RECEIVED', newOrder);
    }

    return res.status(201).json({
      success: true,
      message: 'Order synced successfully',
      order: newOrder,
    });
  } catch (error) {
    console.error('❌ Sync Order Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
