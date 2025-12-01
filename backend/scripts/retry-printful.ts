import prisma from '../src/config/database.js';
import { createPrintfulOrder } from '../src/services/printful.service.js';

async function run() {
  const target = process.argv[2]; // optional: orderId or orderNumber
  const where: any = {
    printfulOrderId: null,
    status: { in: ['PAID', 'DESIGN_APPROVED'] },
  };

  if (target) {
    where.OR = [{ id: target }, { orderNumber: target }];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      designs: true,
      items: { include: { product: true } },
      address: true,
    },
  });

  console.log(`Found ${orders.length} candidate orders`);

  if (!orders.length) {
    console.log(
      target
        ? `No matching order found for "${target}" (or it already has a Printful ID).`
        : 'Nothing to retry.'
    );
    return;
  }

  for (const order of orders) {
    const approvedDesign = order.designs.find((d) => d.approvalStatus);
    if (!approvedDesign) {
      console.log(`Skipping ${order.orderNumber} (no approved design)`);
      continue;
    }

    console.log(`Submitting ${order.orderNumber} (${order.id})...`);
    const result = await createPrintfulOrder(order.id, approvedDesign.id);
    console.log({ order: order.orderNumber, result });
  }
}

run()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
