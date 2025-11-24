-- AddForeignKey
ALTER TABLE "fulfillment_events" ADD CONSTRAINT "fulfillment_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
