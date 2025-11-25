/**
 * @script send-abandoned-reminders
 * @description Send reminder emails for PENDING_PAYMENT orders older than 1 hour.
 * Run with: `cd backend && node --loader ts-node/esm scripts/send-abandoned-reminders.ts`
 */

import 'dotenv/config';
import prisma from '../src/config/database.js';
import { sendAbandonedCheckoutReminder } from '../src/services/email.service.js';

async function run() {
  if (process.env.ENABLE_ABANDONED_REMINDERS === 'false') {
    console.log('Abandoned reminders disabled by ENABLE_ABANDONED_REMINDERS.');
    return;
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      createdAt: { lt: cutoff },
    },
    include: {
      user: true,
    },
  });

  if (staleOrders.length === 0) {
    console.log('No abandoned orders to remind.');
    return;
  }

  for (const order of staleOrders) {
    const resumeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?orderId=${order.id}`;
    const name = order.user?.firstName || order.user?.email || 'there';
    const email = order.user?.email;

    if (!email) continue;

    await sendAbandonedCheckoutReminder({
      customerName: name,
      customerEmail: email,
      orderNumber: order.orderNumber,
      resumeUrl,
      createdAt: order.createdAt,
    });
  }
}

run()
  .catch((error) => {
    console.error('Failed to send abandoned reminders', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
