-- Add disabled flag to promo_codes for soft disabling (idempotent for existing DBs)
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "disabled" BOOLEAN NOT NULL DEFAULT false;
