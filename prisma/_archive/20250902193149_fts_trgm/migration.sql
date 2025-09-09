-- Extensiones para búsqueda
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Campo full-text en español
ALTER TABLE "Product"
    ADD COLUMN IF NOT EXISTS "search_vector" tsvector
    GENERATED ALWAYS AS (
    to_tsvector(
    'spanish',
    coalesce("name",'') || ' ' ||
    coalesce("sku",'')  || ' ' ||
    coalesce("description",'')
    )
    ) STORED;

-- Índices para el buscador
CREATE INDEX IF NOT EXISTS "idx_product_search" ON "Product" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_product_name_trgm" ON "Product" USING GIN ("name" gin_trgm_ops);
