-- AddForeignKey
-- Ensure table exists (idempotent for shadow)
CREATE TABLE IF NOT EXISTS "fulfillment_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "printfulOrderId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_events_pkey" PRIMARY KEY ("id")
);

-- Indexes (created if missing)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS "fulfillment_events_orderId_idx" ON "fulfillment_events"("orderId");
  CREATE INDEX IF NOT EXISTS "fulfillment_events_printfulOrderId_idx" ON "fulfillment_events"("printfulOrderId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Foreign key
ALTER TABLE "fulfillment_events" ADD CONSTRAINT "fulfillment_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
