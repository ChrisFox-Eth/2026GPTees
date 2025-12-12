from pathlib import Path
path = Path("backend/src/services/stripe.service.ts")
text = path.read_text()
start = text.find("export async function handleSuccessfulPayment")
end = text.find("/**\n * Manually confirm a checkout session", start)
if start == -1 or end == -1:
    raise SystemExit('could not locate function boundaries')
new_fn = """export async function handleSuccessfulPayment(sessionId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const orderId = session.metadata?.orderId;
  if (!orderId) {
    throw new Error('Order ID not found in session metadata');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true, address: true, promoCode: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'PAID') {
    console.log(`Order ${orderId} already marked as PAID; skipping duplicate webhook.`);
    return;
  }

  if (session.client_reference_id && session.client_reference_id !== order.id) {
    throw new Error('Stripe session client_reference_id does not match order');
  }
  if (session.metadata?.userId && session.metadata.userId !== order.userId) {
    throw new Error('Stripe session user does not match order owner');
  }

  const sessionTotal = (session.amount_total || 0) / 100;
  const orderTotal = Number(order.totalAmount);
  const currency = (session.currency || '').toLowerCase();
  if (currency && currency !== 'usd') {
    throw new Error(`Unexpected currency: ${currency}`);
  }
  if (Math.abs(sessionTotal - orderTotal) > 0.01) {
    throw new Error(`Payment amount mismatch. Expected ${orderTotal}, got ${sessionTotal}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      payment: {
        create: {
          stripePaymentId: session.payment_intent as string,
          amount: sessionTotal,
          currency: session.currency || 'usd',
          status: 'COMPLETED',
          paymentMethod: session.payment_method_types?.[0] || 'card',
        },
      },
    },
    include: {
      user: true,
      items: true,
      address: true,
    },
  });

  console.log(`? Order ${orderId} marked as PAID`);

  if (updatedOrder.promoCodeId) {
    await incrementPromoUsage(updatedOrder.promoCodeId);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  sendOrderConfirmation({
    customerName: updatedOrder.user.firstName || updatedOrder.user.email,
    customerEmail: updatedOrder.user.email,
    orderNumber: updatedOrder.orderNumber,
    orderTotal: updatedOrder.totalAmount.toString(),
    tier: updatedOrder.designTier,
    itemCount: updatedOrder.items.length,
    orderUrl: `${frontendUrl}/design?orderId=${updatedOrder.id}`,
  }).catch((error) => {
    console.error('Failed to send order confirmation email:', error);
  });

  sendPromptGuide({
    customerName: updatedOrder.user.firstName || updatedOrder.user.email,
    customerEmail: updatedOrder.user.email,
    orderNumber: updatedOrder.orderNumber,
    orderUrl: `${frontendUrl}/design?orderId=${updatedOrder.id}`,
  }).catch((error) => {
    console.error('Failed to send prompt guide email:', error);
  });

  sendAnalyticsEvent({
    event: 'order.paid',
    properties: {
      order_id: updatedOrder.id,
      order_number: updatedOrder.orderNumber,
      amount: updatedOrder.totalAmount,
      tier: updatedOrder.designTier,
      item_count: updatedOrder.items.length,
      country: updatedOrder.address?.country || 'US',
    },
  });
}
"""
path.write_text(text[:start] + new_fn + "\n\n" + text[end:])
