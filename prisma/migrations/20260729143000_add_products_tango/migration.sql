-- CreateTable
CREATE TABLE "public"."products_tango" (
    "id" TEXT NOT NULL,
    "article_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "additional_description" TEXT,
    "price_list_code" TEXT NOT NULL,
    "price_list_description" TEXT,
    "price" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "includes_vat" BOOLEAN,
    "includes_taxes" BOOLEAN,
    "raw_data" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_tango_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_tango_article_code_price_list_code_key"
    ON "public"."products_tango"("article_code", "price_list_code");

-- CreateIndex
CREATE INDEX "products_tango_article_code_idx"
    ON "public"."products_tango"("article_code");

-- CreateIndex
CREATE INDEX "products_tango_price_list_code_idx"
    ON "public"."products_tango"("price_list_code");
