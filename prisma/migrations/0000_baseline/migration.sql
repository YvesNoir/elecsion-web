-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'CLIENT', 'VENDOR', 'SELLER');

-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('ORDER', 'QUOTE');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'ASSIGNED', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CLIENT',
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "assigned_seller_id" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Brand" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand_id" UUID,
    "category_id" UUID,
    "description" TEXT,
    "attributes" JSONB,
    "unit" TEXT,
    "price_base" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "tax_rate" DECIMAL(65,30),
    "stock_qty" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "search_vector" tsvector,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT,
    "client_user_id" UUID,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(65,30),
    "grand_total" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quote_email" TEXT,
    "quote_message" TEXT,
    "quote_name" TEXT,
    "quote_phone" TEXT,
    "seller_user_id" UUID,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "type" "public"."OrderType" NOT NULL DEFAULT 'ORDER',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT,
    "unit_price" DECIMAL(65,30),
    "tax_rate" DECIMAL(65,30),
    "subtotal" DECIMAL(65,30),
    "total" DECIMAL(65,30),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchLanding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta_description" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchLandingHit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "landing_id" UUID NOT NULL,
    "session_id" TEXT,
    "user_id" UUID,
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLandingHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchQueryLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "query" TEXT NOT NULL,
    "results_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_name" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "url" TEXT,
    "product_id" UUID,
    "order_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CatalogImport" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source" TEXT NOT NULL,
    "file_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "summary" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "CatalogImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExternalProductMap" (
    "external_id" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "ExternalProductMap_pkey" PRIMARY KEY ("external_id","source")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "public"."Brand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "public"."Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");

-- CreateIndex
CREATE INDEX "Product_brand_id_idx" ON "public"."Product"("brand_id");

-- CreateIndex
CREATE INDEX "Product_category_id_idx" ON "public"."Product"("category_id");

-- CreateIndex
CREATE INDEX "ProductImage_product_id_idx" ON "public"."ProductImage"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "public"."Order"("code");

-- CreateIndex
CREATE INDEX "Order_client_user_id_idx" ON "public"."Order"("client_user_id");

-- CreateIndex
CREATE INDEX "Order_seller_user_id_idx" ON "public"."Order"("seller_user_id");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "public"."OrderItem"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "SearchLanding_slug_key" ON "public"."SearchLanding"("slug");

-- CreateIndex
CREATE INDEX "SearchLandingHit_landing_id_idx" ON "public"."SearchLandingHit"("landing_id");

-- CreateIndex
CREATE INDEX "SearchQueryLog_created_at_idx" ON "public"."SearchQueryLog"("created_at");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_created_at_idx" ON "public"."AnalyticsEvent"("created_at");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_name_idx" ON "public"."AnalyticsEvent"("event_name");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_assigned_seller_id_fkey" FOREIGN KEY ("assigned_seller_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchLandingHit" ADD CONSTRAINT "SearchLandingHit_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "public"."SearchLanding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchLandingHit" ADD CONSTRAINT "SearchLandingHit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchQueryLog" ADD CONSTRAINT "SearchQueryLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExternalProductMap" ADD CONSTRAINT "ExternalProductMap_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

