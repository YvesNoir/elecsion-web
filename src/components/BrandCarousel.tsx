"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Brand = {
    id: string;
    name: string;
    slug: string;
    logo: string;
    logoGrey: string;
};

type BrandCarouselProps = {
    brands: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
};

// Mapeo de logos disponibles con URLs de CloudFront
const CLOUDFRONT_URL = "https://d3o6yucoo1tpxm.cloudfront.net";

const brandLogos: Record<string, { logo: string; logoGrey: string }> = {
    sica: {
        logo: `${CLOUDFRONT_URL}/brand-logos/sica.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/sica-grey.png`
    },
    exult: {
        logo: `${CLOUDFRONT_URL}/brand-logos/exultt.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/exult-grey.png`
    },
    flexivolt: {
        logo: `${CLOUDFRONT_URL}/brand-logos/flexivolt.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/flexivolt-grey.png`
    },
    huferjo: {
        logo: `${CLOUDFRONT_URL}/brand-logos/huferjo.png`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/huferjo-grey.png`
    },
    jeluz: {
        logo: `${CLOUDFRONT_URL}/brand-logos/jeluz.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/jeluz-grey.png`
    },
    kalop: {
        logo: `${CLOUDFRONT_URL}/brand-logos/kalop.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/kalop-grey.png`
    },
    macroled: {
        logo: `${CLOUDFRONT_URL}/brand-logos/macroled.png`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/macroled-grey.png`
    },
    mota: {
        logo: `${CLOUDFRONT_URL}/brand-logos/mota.png`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/mota-grey.png`
    },
    richi: {
        logo: `${CLOUDFRONT_URL}/brand-logos/richi.png`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/richi-grey.png`
    },
    rottweiler: {
        logo: `${CLOUDFRONT_URL}/brand-logos/rottweiler.png`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/rottweiler-grey.png`
    },
    rio: {
        logo: `${CLOUDFRONT_URL}/brand-logos/rio.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/rioflex-grey.png`
    },
    rioflex: {
        logo: `${CLOUDFRONT_URL}/brand-logos/rioflex-grey.png`, // Using grey as fallback since no color version
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/rioflex-grey.png`
    },
    sixelectric: {
        logo: `${CLOUDFRONT_URL}/brand-logos/sixelectric.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/sixelectric-grey.png`
    },
    starbox: {
        logo: `${CLOUDFRONT_URL}/brand-logos/starbox.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/starbox-grey.png`
    },
    taad: {
        logo: `${CLOUDFRONT_URL}/brand-logos/taad.png`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/taad-grey.png`
    },
    tacsa: {
        logo: `${CLOUDFRONT_URL}/brand-logos/tacsa.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/tacsa-grey.png`
    },
    tecnocom: {
        logo: `${CLOUDFRONT_URL}/brand-logos/tecnocom.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/tecnocom-grey.png`
    },
    trefilcon: {
        logo: `${CLOUDFRONT_URL}/brand-logos/trefilcon.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/trefilcon-grey.png`
    },
    trefilight: {
        logo: `${CLOUDFRONT_URL}/brand-logos/trefilight.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/trefilight-grey.png`
    },
    yarlux: {
        logo: `${CLOUDFRONT_URL}/brand-logos/yarlux.jpg`,
        logoGrey: `${CLOUDFRONT_URL}/brand-logos/yarlux-grey.png`
    }
};

export default function BrandCarousel({ brands }: BrandCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Filtrar solo las marcas que tienen logos disponibles
    const brandsWithLogos = brands.filter(brand => brandLogos[brand.slug]);

    // Marcas adicionales que aún no están en la base de datos
    const additionalBrands = [
        { id: "tacsa", name: "TACSA", slug: "tacsa" },
        { id: "trefilcon", name: "TREFILCON", slug: "trefilcon" },
        { id: "jeluz", name: "JELUZ", slug: "jeluz" },
        { id: "kalop", name: "KALOP", slug: "kalop" },
        { id: "huferjo", name: "HUFERJO", slug: "huferjo" },
        { id: "macroled", name: "MACROLED", slug: "macroled" },
        { id: "mota", name: "MOTA", slug: "mota" },
        { id: "rottweiler", name: "ROTTWEILER", slug: "rottweiler" },
        { id: "taad", name: "TAAD", slug: "taad" }
        // Removidas del carrusel: rioflex, sixelectric, starbox, tecnocom, yarlux
    ];

    // Combinar marcas existentes con las adicionales
    const allBrands = [...brandsWithLogos, ...additionalBrands];
    
    // Si no hay marcas, mostrar solo SICA como fallback
    const displayBrands = allBrands.length > 0 ? allBrands : [
        { id: "sica", name: "SICA", slug: "sica" }
    ];

    const itemsToShow = Math.min(6, displayBrands.length);
    const maxIndex = Math.max(0, displayBrands.length - itemsToShow);

    useEffect(() => {
        if (!isAutoPlaying || displayBrands.length <= itemsToShow) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 3000);

        return () => clearInterval(timer);
    }, [isAutoPlaying, maxIndex, displayBrands.length, itemsToShow]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };

    if (displayBrands.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            <div 
                className="relative"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
            >
                {/* Carousel Container */}
                <div className="overflow-hidden">
                    <div 
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
                        }}
                    >
                        {displayBrands.map((brand) => {
                            const logos = brandLogos[brand.slug];
                            return (
                                <div
                                    key={brand.id}
                                    className="flex-none"
                                    style={{ width: `${100 / itemsToShow}%` }}
                                >
                                    <div className="px-4">
                                        <Link
                                            href={`/catalogo?brand=${brand.slug}`}
                                            className="group block"
                                        >
                                            <div className="relative bg-white rounded-lg p-6 h-24 flex items-center justify-center transition-all duration-300">
                                                {/* Grey Logo (Default) */}
                                                <img
                                                    src={logos?.logoGrey || `${CLOUDFRONT_URL}/brand-logos/sica-grey.png`}
                                                    alt={brand.name}
                                                    className="max-h-12 max-w-full object-contain opacity-60 group-hover:opacity-0 transition-opacity duration-300"
                                                />
                                                
                                                {/* Color Logo (Hover) */}
                                                <img
                                                    src={logos?.logo || `${CLOUDFRONT_URL}/brand-logos/sica.jpg`}
                                                    alt={brand.name}
                                                    className="absolute max-h-12 max-w-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                />
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}