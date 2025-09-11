// src/components/catalog/ProductImage.tsx
"use client";

import { useState } from "react";

type Props = {
    sku?: string | null;
    alt?: string;
    className?: string;
};

/**
 * Muestra /product-images/[SKU].jpeg, si falla intenta .jpg
 * y finalmente cae en /product-images/_placeholder.jpeg
 */
export default function ProductImage({ sku, alt, className }: Props) {
    const safeSku = (sku ?? "").trim();
    const [src, setSrc] = useState(
        safeSku ? `/product-images/${encodeURIComponent(safeSku)}.jpeg` : `/product-images/_placeholder.jpeg`
    );
    const [triedJpg, setTriedJpg] = useState(false);

    return (
        <img
            src={src}
            alt={alt || safeSku || "Producto"}
            className={className}
            onError={() => {
                if (safeSku && !triedJpg) {
                    setTriedJpg(true);
                    setSrc(`/product-images/${encodeURIComponent(safeSku)}.jpg`);
                } else {
                    setSrc(`/product-images/_placeholder.jpeg`);
                }
            }}
            loading="lazy"
        />
    );
}