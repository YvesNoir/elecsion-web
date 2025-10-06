"use client";

import { getProductImageUrl, sanitizeSkuForFilename } from "@/lib/utils/image";

type ProductImageProps = {
    sku: string;
    alt?: string;
    className?: string;
};

export default function ProductImage({ sku, alt, className }: ProductImageProps) {
    return (
        <img
            src={getProductImageUrl(sku)}
            alt={alt || sku}
            className={className}
            onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                const currentSrc = el.src;
                const sanitizedSku = sanitizeSkuForFilename(sku);

                // Si falló PNG, intentar JPG
                if (currentSrc.endsWith('.png') && sanitizedSku) {
                    el.src = `/product-images/${sanitizedSku}.jpg`;
                }
                // Si falló JPG o no hay SKU, usar placeholder
                else {
                    el.onerror = null;
                    el.src = "/product-images/placeholder.png";
                }
            }}
        />
    );
}