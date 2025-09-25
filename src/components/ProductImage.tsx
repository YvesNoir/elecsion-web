"use client";

import { getProductImageUrl } from "@/lib/utils/image";

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
                el.onerror = null;
                el.src = "/product-images/placeholder.png";
            }}
        />
    );
}