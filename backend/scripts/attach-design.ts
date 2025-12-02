import prisma from '../src/config/database.js';

/**
 * Attach an existing design to an order, mark it approved, and wire the order item.
 *
 * Usage:
 *   npx tsx scripts/attach-design.ts <orderId-or-number> <designId>
 */
async function run() {
  const orderTarget = process.argv[2];
  const designId = process.argv[3];

  if (!orderTarget || !designId) {
    console.error('Usage: npx tsx scripts/attach-design.ts <orderId-or-number> <designId>');
    process.exit(1);
  }

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: orderTarget }, { orderNumber: orderTarget }] },
    include: { items: true },
  });
  if (!order) {
    console.error('Order not found');
    return;
  }

  const design = await prisma.design.findUnique({ where: { id: designId } });
  if (!design) {
    console.error('Design not found');
    return;
  }

  // Attach design to order and approve it.
  await prisma.design.update({
    where: { id: designId },
    data: {
      orderId: order.id,
      approvalStatus: true,
      approvedAt: new Date(),
    },
  });

  // Wire the first order item to the design for clarity in summaries.
  const firstItem = order.items[0];
  if (firstItem) {
    await prisma.orderItem.update({
      where: { id: firstItem.id },
      data: { designId },
    });
  }

  // Reflect status/count on the order.
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'DESIGN_APPROVED',
      designsGenerated: Math.max(order.designsGenerated, 1),
    },
  });

  console.log(`Attached design ${designId} to order ${order.orderNumber} (${order.id}) and marked approved.`);
}

run()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
