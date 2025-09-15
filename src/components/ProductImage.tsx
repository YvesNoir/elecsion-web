"use client";

type ProductImageProps = {
    sku: string;
    alt?: string;
    className?: string;
};

export default function ProductImage({ sku, alt, className }: ProductImageProps) {
    return (
        <img
            src={`/product-images/${sku}.png`}
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