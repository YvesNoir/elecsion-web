"use client";

import { useState } from "react";
import { getProductImageUrls, sanitizeSkuForFilename } from "@/lib/utils/image";

type ProductImageProps = {
    sku: string;
    alt?: string;
    className?: string;
};

export default function ProductImage({ sku, alt, className }: ProductImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

    const imageUrls = getProductImageUrls(sku);

    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const el = e.currentTarget as HTMLImageElement;
        const nextIndex = currentUrlIndex + 1;

        if (nextIndex < imageUrls.length) {
            // Intentar siguiente URL
            setCurrentUrlIndex(nextIndex);
            el.src = imageUrls[nextIndex];
        } else {
            // Agotamos todas las opciones
            el.onerror = null;
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
                src={imageUrls[currentUrlIndex]}
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