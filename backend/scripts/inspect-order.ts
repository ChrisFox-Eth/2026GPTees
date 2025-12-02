import prisma from '../src/config/database.js';

/**
 * Debug helper: print order, designs, and fulfillment events.
 *
 * Usage:
 *   npx tsx scripts/inspect-order.ts <orderId-or-number>
 */
async function run() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: npx tsx scripts/inspect-order.ts <orderId-or-number>');
    process.exit(1);
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: target }, { orderNumber: target }],
    },
    include: {
      designs: true,
      items: { include: { product: true } },
      address: true,
      promoCode: true,
    },
  });

  if (!order) {
    console.error('Order not found');
    return;
  }

  const events = await prisma.fulfillmentEvent.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'desc' },
  });

  console.log('ORDER:');
  console.log(JSON.stringify(order, null, 2));
  console.log('\nFULFILLMENT EVENTS:');
  console.log(JSON.stringify(events, null, 2));
}

run()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
