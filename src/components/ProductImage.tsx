"use client";

import { useState } from "react";
import { getProductImageUrl, sanitizeSkuForFilename } from "@/lib/utils/image";

type ProductImageProps = {
    sku: string;
    alt?: string;
    className?: string;
};

export default function ProductImage({ sku, alt, className }: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
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
            setIsLoading(false);
            setHasError(true);
        }
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Skeleton loader */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                </div>
            )}

            <img
                src={getProductImageUrl(sku)}
                alt={alt || sku}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
        </div>
    );
}