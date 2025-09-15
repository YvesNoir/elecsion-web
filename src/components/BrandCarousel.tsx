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

// Mapeo de logos disponibles
const brandLogos: Record<string, { logo: string; logoGrey: string }> = {
    sica: {
        logo: "/brand-logos/sica.jpg",
        logoGrey: "/brand-logos/sica-grey.png"
    },
    exult: {
        logo: "/brand-logos/exultt.jpg",
        logoGrey: "/brand-logos/exult-grey.png"
    },
    flexivolt: {
        logo: "/brand-logos/flexivolt.jpg",
        logoGrey: "/brand-logos/flexivolt-grey.png"
    },
    jeluz: {
        logo: "/brand-logos/jeluz.jpg",
        logoGrey: "/brand-logos/jeluz-grey.png"
    },
    kalop: {
        logo: "/brand-logos/kalop.jpg",
        logoGrey: "/brand-logos/kalop-grey.png"
    },
    richi: {
        logo: "/brand-logos/richi.jpg",
        logoGrey: "/brand-logos/richi-grey.png"
    },
    rio: {
        logo: "/brand-logos/rio.jpg",
        logoGrey: "/brand-logos/rioflex-grey.png"
    },
    rioflex: {
        logo: "/brand-logos/rioflex-grey.png", // Using grey as fallback since no color version
        logoGrey: "/brand-logos/rioflex-grey.png"
    },
    sixelectric: {
        logo: "/brand-logos/sixelectric.jpg",
        logoGrey: "/brand-logos/sixelectric-grey.png"
    },
    starbox: {
        logo: "/brand-logos/starbox.jpg",
        logoGrey: "/brand-logos/starbox-grey.png"
    },
    tacsa: {
        logo: "/brand-logos/tacsa.jpg",
        logoGrey: "/brand-logos/tacsa-grey.png"
    },
    tecnocom: {
        logo: "/brand-logos/tecnocom.jpg",
        logoGrey: "/brand-logos/tecnocom-grey.png"
    },
    trefilcon: {
        logo: "/brand-logos/trefilcon.jpg",
        logoGrey: "/brand-logos/trefilcon-grey.png"
    },
    trefilight: {
        logo: "/brand-logos/trefilight.jpg",
        logoGrey: "/brand-logos/trefilight-grey.png"
    },
    yarlux: {
        logo: "/brand-logos/yarlux.jpg",
        logoGrey: "/brand-logos/yarlux-grey.png"
    }
};

export default function BrandCarousel({ brands }: BrandCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Filtrar solo las marcas que tienen logos disponibles
    const brandsWithLogos = brands.filter(brand => brandLogos[brand.slug]);

    // Marcas adicionales que aún no están en la base de datos
    const additionalBrands = [
        { id: "rioflex", name: "RIOFLEX", slug: "rioflex" },
        { id: "sixelectric", name: "SIXELECTRIC", slug: "sixelectric" },
        { id: "starbox", name: "STARBOX", slug: "starbox" },
        { id: "tacsa", name: "TACSA", slug: "tacsa" },
        { id: "tecnocom", name: "TECNOCOM", slug: "tecnocom" },
        { id: "trefilcon", name: "TREFILCON", slug: "trefilcon" },
        { id: "jeluz", name: "JELUZ", slug: "jeluz" },
        { id: "kalop", name: "KALOP", slug: "kalop" },
        { id: "yarlux", name: "YARLUX", slug: "yarlux" }
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
                                                    src={logos?.logoGrey || "/brand-logos/sica-grey.png"}
                                                    alt={brand.name}
                                                    className="max-h-12 max-w-full object-contain opacity-60 group-hover:opacity-0 transition-opacity duration-300"
                                                />
                                                
                                                {/* Color Logo (Hover) */}
                                                <img
                                                    src={logos?.logo || "/brand-logos/sica.jpg"}
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