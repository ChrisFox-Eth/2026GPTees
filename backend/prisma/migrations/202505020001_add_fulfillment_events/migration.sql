-- CreateTable
CREATE TABLE "fulfillment_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "printfulOrderId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_events_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "fulfillment_events_orderId_idx" ON "fulfillment_events"("orderId");
CREATE INDEX "fulfillment_events_printfulOrderId_idx" ON "fulfillment_events"("printfulOrderId");

-- Foreign keys
ALTER TABLE "fulfillment_events" ADD CONSTRAINT "fulfillment_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
