/*
  Warnings:

  - You are about to drop the column `approved_at` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `billing_address` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `fulfilled_at` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_address` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_user_id` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ClientProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InventoryMovement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductPrice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorClient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorProfile` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `title` on table `SearchLanding` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('ORDER', 'QUOTE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderStatus" ADD VALUE 'REJECTED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'SELLER';

-- DropForeignKey
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientProfile" DROP CONSTRAINT "ClientProfile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryMovement" DROP CONSTRAINT "InventoryMovement_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_client_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_vendor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderAssignment" DROP CONSTRAINT "OrderAssignment_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderAssignment" DROP CONSTRAINT "OrderAssignment_vendor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderEvent" DROP CONSTRAINT "OrderEvent_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductImage" DROP CONSTRAINT "ProductImage_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPrice" DROP CONSTRAINT "ProductPrice_price_list_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPrice" DROP CONSTRAINT "ProductPrice_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."SearchLandingHit" DROP CONSTRAINT "SearchLandingHit_landing_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."VendorClient" DROP CONSTRAINT "VendorClient_client_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."VendorClient" DROP CONSTRAINT "VendorClient_vendor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."VendorProfile" DROP CONSTRAINT "VendorProfile_user_id_fkey";

-- DropIndex
DROP INDEX "public"."Order_status_idx";

-- DropIndex
DROP INDEX "public"."Order_vendor_user_id_idx";

-- DropIndex
DROP INDEX "public"."Product_sku_key";

-- DropIndex
DROP INDEX "public"."idx_product_name_trgm";

-- DropIndex
DROP INDEX "public"."idx_product_search";

-- DropIndex
DROP INDEX "public"."ProductImage_product_id_position_idx";

-- AlterTable
ALTER TABLE "public"."Category" ALTER COLUMN "parent_id" SET DATA TYPE UUID;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "approved_at",
DROP COLUMN "billing_address",
DROP COLUMN "fulfilled_at",
DROP COLUMN "notes",
DROP COLUMN "shipping_address",
DROP COLUMN "vendor_user_id",
ADD COLUMN     "quote_email" TEXT,
ADD COLUMN     "quote_message" TEXT,
ADD COLUMN     "quote_name" TEXT,
ADD COLUMN     "quote_phone" TEXT,
ADD COLUMN     "seller_user_id" UUID,
ADD COLUMN     "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "type" "public"."OrderType" NOT NULL DEFAULT 'ORDER',
ALTER COLUMN "client_user_id" DROP NOT NULL,
ALTER COLUMN "client_user_id" SET DATA TYPE UUID,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "tax_total" DROP NOT NULL,
ALTER COLUMN "tax_total" DROP DEFAULT,
ALTER COLUMN "tax_total" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "grand_total" DROP NOT NULL,
ALTER COLUMN "grand_total" DROP DEFAULT,
ALTER COLUMN "grand_total" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "currency" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."OrderItem" ALTER COLUMN "order_id" SET DATA TYPE UUID,
ALTER COLUMN "product_id" DROP NOT NULL,
ALTER COLUMN "product_id" SET DATA TYPE UUID,
ALTER COLUMN "sku" DROP NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "unit" DROP NOT NULL,
ALTER COLUMN "unit" DROP DEFAULT,
ALTER COLUMN "unit_price" DROP NOT NULL,
ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "tax_rate" DROP NOT NULL,
ALTER COLUMN "tax_rate" DROP DEFAULT,
ALTER COLUMN "tax_rate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "subtotal" DROP NOT NULL,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "total" DROP NOT NULL,
ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "sku" DROP NOT NULL,
ALTER COLUMN "brand_id" SET DATA TYPE UUID,
ALTER COLUMN "category_id" SET DATA TYPE UUID,
ALTER COLUMN "unit" DROP DEFAULT,
ALTER COLUMN "price_base" DROP DEFAULT,
ALTER COLUMN "price_base" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "currency" SET DATA TYPE TEXT,
ALTER COLUMN "tax_rate" DROP NOT NULL,
ALTER COLUMN "tax_rate" DROP DEFAULT,
ALTER COLUMN "tax_rate" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "stock_qty" DROP NOT NULL,
ALTER COLUMN "stock_qty" DROP DEFAULT,
ALTER COLUMN "stock_qty" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."ProductImage" ALTER COLUMN "product_id" SET DATA TYPE UUID;

-- AlterTable
ALTER TABLE "public"."SearchLanding" ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."SearchLandingHit" ALTER COLUMN "landing_id" SET DATA TYPE UUID;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "phone",
ADD COLUMN     "assigned_seller_id" UUID,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "password_hash" DROP NOT NULL,
ALTER COLUMN "is_active" DROP NOT NULL,
ALTER COLUMN "is_active" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."ClientProfile";

-- DropTable
DROP TABLE "public"."InventoryMovement";

-- DropTable
DROP TABLE "public"."OrderAssignment";

-- DropTable
DROP TABLE "public"."OrderEvent";

-- DropTable
DROP TABLE "public"."PriceList";

-- DropTable
DROP TABLE "public"."ProductPrice";

-- DropTable
DROP TABLE "public"."VendorClient";

-- DropTable
DROP TABLE "public"."VendorProfile";

-- CreateIndex
CREATE INDEX "Order_seller_user_id_idx" ON "public"."Order"("seller_user_id");

-- CreateIndex
CREATE INDEX "Product_brand_id_idx" ON "public"."Product"("brand_id");

-- CreateIndex
CREATE INDEX "Product_category_id_idx" ON "public"."Product"("category_id");

-- CreateIndex
CREATE INDEX "ProductImage_product_id_idx" ON "public"."ProductImage"("product_id");

-- CreateIndex
CREATE INDEX "SearchLandingHit_landing_id_idx" ON "public"."SearchLandingHit"("landing_id");

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
