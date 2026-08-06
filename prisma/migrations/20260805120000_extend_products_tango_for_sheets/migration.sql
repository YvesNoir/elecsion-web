-- Extend products_tango with the fields maintained in Google Sheets.
ALTER TABLE "public"."products_tango"
    ADD COLUMN IF NOT EXISTS "synonym" TEXT,
    ADD COLUMN IF NOT EXISTS "stock_qty" DECIMAL(18,4),
    ADD COLUMN IF NOT EXISTS "tax_rate" DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS "brand_name" TEXT;
