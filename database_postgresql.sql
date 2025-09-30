-- PostgreSQL 16 Database - Elecsion Web
-- Complete database schema and essential data
-- Generated on: 2025-09-30

BEGIN;

-- Create all tables in correct dependency order
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "is_active" BOOLEAN,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_seller_id" TEXT,
    CONSTRAINT "User_assigned_seller_id_fkey" FOREIGN KEY ("assigned_seller_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "buy" NUMERIC NOT NULL,
    "sell" NUMERIC NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'BNA',
    "fetched_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "SearchLanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta_description" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CatalogImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "file_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "summary" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand_id" TEXT,
    "category_id" TEXT,
    "description" TEXT,
    "attributes" JSONB,
    "unit" TEXT,
    "price_base" NUMERIC NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "tax_rate" NUMERIC,
    "stock_qty" NUMERIC,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "client_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" NUMERIC NOT NULL DEFAULT 0,
    "tax_total" NUMERIC,
    "grand_total" NUMERIC,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "submitted_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quote_email" TEXT,
    "quote_message" TEXT,
    "quote_name" TEXT,
    "quote_phone" TEXT,
    "quote_company" TEXT,
    "quote_cuit" TEXT,
    "seller_user_id" TEXT,
    "tax" NUMERIC NOT NULL DEFAULT 0,
    "total" NUMERIC NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'ORDER',
    CONSTRAINT "Order_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "quantity" NUMERIC NOT NULL,
    "unit" TEXT,
    "unit_price" NUMERIC,
    "tax_rate" NUMERIC,
    "subtotal" NUMERIC,
    "total" NUMERIC,
    CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SearchLandingHit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landing_id" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchLandingHit_landing_id_fkey" FOREIGN KEY ("landing_id") REFERENCES "SearchLanding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SearchLandingHit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SearchQueryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "query" TEXT NOT NULL,
    "results_count" INTEGER,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchQueryLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_name" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "url" TEXT,
    "product_id" TEXT,
    "order_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsEvent_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ExternalProductMap" (
    "external_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    PRIMARY KEY ("external_id", "source"),
    CONSTRAINT "ExternalProductMap_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Insert essential data

-- Categories
INSERT INTO "Category" VALUES
('cmfftg2670009002lkxabmodd', 'Material Eléctrico', 'material-electrico', NULL, '2025-09-11 19:43:15.968+00'),
('cmfftg26b000a002lqmz325up', 'Ferretería', 'ferreteria', NULL, '2025-09-11 19:43:15.972+00'),
('cmfftg26c000b002lxm2ws7iz', 'Iluminación', 'iluminacion', NULL, '2025-09-11 19:43:15.973+00'),
('cmfftg26d000d002l5xl3k662', 'Interruptores', 'interruptores', 'cmfftg2670009002lkxabmodd', '2025-09-11 19:43:15.974+00'),
('cmfftg26f000f002lmnmf6xsc', 'Tomacorrientes', 'tomacorrientes', 'cmfftg2670009002lkxabmodd', '2025-09-11 19:43:15.976+00'),
('cmfftg26g000h002lup9fr4qi', 'Cables', 'cables', 'cmfftg2670009002lkxabmodd', '2025-09-11 19:43:15.976+00');

-- Brands
INSERT INTO "Brand" VALUES
('cmfftg2510006002lyyzllwcs', 1004, 'Legrand', 'legrand', true, '2025-09-11 19:43:15.925+00'),
('cmfftg2510005002lw5r9p8ek', 1005, 'Philips', 'philips', true, '2025-09-11 19:43:15.925+00'),
('cmfftg2510008002lr0p349rm', 1003, 'ABB', 'abb', true, '2025-09-11 19:43:15.925+00'),
('cmfftg2500004002l09y8x59e', 1001, 'Schneider Electric', 'schneider-electric', true, '2025-09-11 19:43:15.925+00'),
('cmfftg2510007002lztj2ghg5', 1002, 'Siemens', 'siemens', true, '2025-09-11 19:43:15.925+00'),
('cmfh78sfd000000t0pzsooqfu', NULL, 'SICA', 'sica', true, '2025-09-12 18:57:17.544+00');

-- Users
INSERT INTO "User" VALUES
('user_admin_002', 'Marcelo Pica', 'marcepica5@gmail.com', '$2b$12$MCD3C/piRPEcC/2BsIArY.mCp4Y/6saIbTeiMs.RjrDlYNs4rHhWC', NULL, NULL, NULL, NULL, NULL, NULL, 'ADMIN', true, false, '2025-09-17 20:23:21', '2025-09-23 13:22:05.039+00', NULL),
('user_seller_001', 'Juan Vendedor', 'juan.vendedor@elecsion.com', '$2b$12$MCD3C/piRPEcC/2BsIArY.mCp4Y/6saIbTeiMs.RjrDlYNs4rHhWC', NULL, NULL, NULL, NULL, NULL, NULL, 'SELLER', true, false, '2025-09-17 20:23:21', '2025-09-23 13:22:05.041+00', NULL),
('cmfftagnw000200rgh29x12bt', 'Sebastian Fente', 'sebastianfente@gmail.com', '$2b$12$lR9iwgUosiRpMfNbllPQd.93iOIvCwALDwOJvnNS0t23OMzNZymCS', '+5491133831511', '2clics', 'Buenos Aires 1769', 'Buenos Aires', 'CABA', '1769', 'CLIENT', true, false, '2025-09-18 12:40:29', '2025-09-18 12:59:31.044+00', 'user_seller_001'),
('cmfpet4qs00000034vv7t1h1c', 'Sebastian Venta', 'sebastianf@2clics.com.ar', '$2b$12$pUhs/rVYiqgdALhvPx9XRu65DU/1BkO6IGVjO/D/oQHIj3ykoK6fO', '+5491133831511', NULL, NULL, NULL, NULL, NULL, 'SELLER', true, false, '2025-09-18 12:51:13.348+00', '2025-09-18 12:51:13.348+00', NULL);

-- Essential Products
INSERT INTO "Product" VALUES
('cmfftg26i000r002laxt2sys3', 'SIE-DIS-025', 'Disyuntor Diferencial 25A Siemens', 'disyuntor-diferencial-siemens', 'cmfftg2510007002lztj2ghg5', 'cmfftg2670009002lkxabmodd', 'Disyuntor diferencial bipolar 25A, sensibilidad 30mA, curva C', '{"amperaje":"25A","polos":2,"sensibilidad":"30mA","curva":"C"}', 'unidad', 28900, 'ARS', NULL, 45, true, false, '2025-09-11 19:43:15.979+00', '2025-09-30 09:29:38.176+00'),
('cmfftg26i000p002lmaqngtdt', 'PHI-LED-009', 'Lámpara LED 9W Luz Cálida Philips', 'lampara-led-philips-9w', 'cmfftg2510005002lw5r9p8ek', 'cmfftg26c000b002lxm2ws7iz', 'Lámpara LED de 9W, luz cálida 3000K, equivale a 60W incandescente', '{"potencia":"9W","equivalencia":"60W","temperatura_color":"3000K","tipo_luz":"Cálida","base":"E27"}', 'unidad', 3200, 'ARS', NULL, 200, true, false, '2025-09-11 19:43:15.979+00', '2025-09-18 17:18:25.040+00'),
('cmfftg26i000n002l95zm2lqj', 'CAB-UNI-250', 'Cable Unipolar 2.5mm² x 100m', 'cable-unipolar-2-5mm', NULL, 'cmfftg26g000h002lup9fr4qi', 'Cable unipolar de 2.5mm², aislación PVC, rollo de 100 metros', '{"seccion":"2.5mm²","longitud":"100m","aislacion":"PVC","color":"Azul"}', 'rollo', 45600, 'ARS', NULL, 25, true, false, '2025-09-11 19:43:15.978+00', '2025-09-11 19:43:15.978+00'),
('cmfftg26j000t002l1h0d7tbr', 'ABB-TOM-001', 'Tomacorriente Schuko 16A ABB', 'tomacorriente-schuko-abb', 'cmfftg2510008002lr0p349rm', 'cmfftg26f000f002lmnmf6xsc', 'Tomacorriente Schuko con puesta a tierra, 16A, 250V', '{"tipo":"Schuko","amperaje":"16A","tension":"250V","puesta_tierra":true}', 'unidad', 15300, 'ARS', NULL, 120, true, false, '2025-09-11 19:43:15.979+00', '2025-09-26 13:16:39.170+00'),
('cmfftg26i000l002lgobcpu9g', 'SCH-INT-001', 'Interruptor Simple 10A', 'interruptor-simple-schneider', 'cmfftg2500004002l09y8x59e', 'cmfftg26d000d002l5xl3k662', 'Interruptor simple de 10A, color blanco, línea residencial', '{"color":"Blanco","amperaje":"10A","tension":"220V","material":"Plástico ABS"}', 'unidad', 8500, 'ARS', NULL, 150, true, false, '2025-09-11 19:43:15.979+00', '2025-09-26 13:47:10.819+00'),
('cmfftg26i000j002ltpv9h4uk', 'LEG-INT-002', 'Interruptor Doble 10A Legrand', 'interruptor-doble-legrand', 'cmfftg2510006002lyyzllwcs', 'cmfftg26d000d002l5xl3k662', 'Interruptor doble de 10A, serie Valena Next, color blanco', '{"color":"Blanco","amperaje":"10A","tension":"220V","serie":"Valena Next"}', 'unidad', 12750, 'ARS', NULL, 85, true, false, '2025-09-11 19:43:15.978+00', '2025-09-17 13:18:20.999+00'),
('cmfh78sfy000200t0zc8ilato', '200002', 'SILIGHT BASTIDOR 2M MIGNON', '200002-silight-bastidor-2m-mignon', 'cmfh78sfd000000t0pzsooqfu', NULL, NULL, NULL, NULL, 407.86, 'ARS', 21, 100, true, false, '2025-09-12 18:57:17.565+00', '2025-09-24 20:05:06.798+00'),
('cmfh78sg3000500t029soy7ju', '200004', 'BASTIDOR 4M', '200004-bastidor-4m', 'cmfh78sfd000000t0pzsooqfu', NULL, NULL, NULL, NULL, 324.47, 'ARS', 21, 100, true, false, '2025-09-12 18:57:17.572+00', '2025-09-24 20:05:06.805+00'),
('cmfh78sg5000800t09tlxxl68', '200100', 'SILIGHT 1M', '200100-silight-1m', 'cmfh78sfd000000t0pzsooqfu', NULL, NULL, NULL, NULL, 1112.95, 'ARS', 21, 100, true, false, '2025-09-12 18:57:17.574+00', '2025-09-24 20:05:06.806+00'),
('cmfh78sg6000b00t0aamvvo90', '200101', 'SILIGHT 1M VARIANT', '200101-silight-1m-variant', 'cmfh78sfd000000t0pzsooqfu', NULL, NULL, NULL, NULL, 1297.06, 'ARS', 21, 100, true, false, '2025-09-12 18:57:17.575+00', '2025-09-24 20:05:06.807+00');

-- Sample Orders
INSERT INTO "Order" VALUES
('cmfmmqctp000100ga206z7o1a', 'COT-782252959', NULL, 'SUBMITTED', 1631.44, 342.60, 1974.04, 'ARS', '2025-09-16 14:09:42.253+00', '2025-09-16 14:09:42.253+00', '2025-09-16 14:09:42.253+00', 'juandiazsa@gmail.com', 'Solicitud de cotización sin cuenta registrada', 'Juan Diaz', '+549113383111', NULL, '342.60', NULL, 342.60, 1974.04, 'QUOTE'),
('cmfmmsulm000400ga23mrkeo4', 'COT-898600249', 'cmfftagnw000200rgh29x12bt', 'SUBMITTED', 11129.49, 2337.19, 13466.68, 'ARS', '2025-09-16 14:11:38.601+00', '2025-09-16 14:11:38.602+00', '2025-09-16 14:11:38.602+00', 'sebastianfente@gmail.com', 'Solicitud de cotización desde el carrito. Total estimado: $ 13.466,69', 'Sebastian Fente', '+5491133831511', 'cmfft73l2000000rg76aw2rw7', '2337.19', NULL, 2337.19, 13466.68, 'QUOTE');

-- Sample Order Items
INSERT INTO "OrderItem" VALUES
('cmfftsv7l000200n8bz2ar7dl', 'cmfmmqctp000100ga206z7o1a', 'cmfftg26i000j002ltpv9h4uk', 'LEG-INT-002', 'Interruptor Doble 10A Legrand', 1, 'unidad', 12750, NULL, 12750, 12750),
('cmfftsv7l000300n81ktnpfsm', 'cmfmmqctp000100ga206z7o1a', 'cmfftg26i000l002lgobcpu9g', 'SCH-INT-001', 'Interruptor Simple 10A', 3, 'unidad', 8500, NULL, 25500, 25500),
('cmfmmsulm000500gaynzey2f5', 'cmfmmsulm000400ga23mrkeo4', 'cmfh78sg6000b00t0aamvvo90', '200101', 'SILIGHT 1M VARIANT', 10, 'unidad', 1112.95, NULL, 11129.50, 11129.50);

-- Create indexes for performance
CREATE INDEX "idx_category_parent" ON "Category" ("parent_id");
CREATE INDEX "idx_category_slug" ON "Category" ("slug");
CREATE INDEX "idx_brand_slug" ON "Brand" ("slug");
CREATE INDEX "idx_brand_active" ON "Brand" ("is_active");
CREATE INDEX "idx_user_email" ON "User" ("email");
CREATE INDEX "idx_user_role" ON "User" ("role");
CREATE INDEX "idx_user_active" ON "User" ("is_active");
CREATE INDEX "idx_product_sku" ON "Product" ("sku");
CREATE INDEX "idx_product_slug" ON "Product" ("slug");
CREATE INDEX "idx_product_brand" ON "Product" ("brand_id");
CREATE INDEX "idx_product_category" ON "Product" ("category_id");
CREATE INDEX "idx_product_active" ON "Product" ("is_active");
CREATE INDEX "idx_order_code" ON "Order" ("code");
CREATE INDEX "idx_order_client" ON "Order" ("client_user_id");
CREATE INDEX "idx_order_status" ON "Order" ("status");
CREATE INDEX "idx_orderitem_order" ON "OrderItem" ("order_id");
CREATE INDEX "idx_orderitem_product" ON "OrderItem" ("product_id");

COMMIT;