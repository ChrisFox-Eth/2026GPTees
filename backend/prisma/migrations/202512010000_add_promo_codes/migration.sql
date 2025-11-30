-- Create Enum for promo codes
CREATE TYPE "PromoCodeType" AS ENUM ('FREE_PRODUCT', 'PERCENT_OFF');

-- Create promo_codes table
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "type" "PromoCodeType" NOT NULL,
    "productTier" "DesignTier",
    "percentOff" INTEGER,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- Unique code for quick lookup
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- Add foreign key to users (creator), nullable
ALTER TABLE "promo_codes"
ADD CONSTRAINT "promo_codes_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add promoCode linkage to orders (one code per order)
ALTER TABLE "orders" ADD COLUMN "promoCodeId" UUID;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_promoCodeId_fkey"
FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
