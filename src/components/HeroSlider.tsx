"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Slide = {
    id: number;
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    backgroundImage: string;
    brandSlug?: string;
};

const slides: Slide[] = [
    {
        id: 1,
        title: "Calidad, variedad y listas para instalar",
        description: "Descubre nuestra amplia gama de productos eléctricos de primera calidad",
        buttonText: "Conocer",
        buttonLink: "/catalogo",
        backgroundImage: "/hero-banner/hero-banner-1.jpg"
    },
    {
        id: 2,
        title: "SICA - Innovación en instalaciones eléctricas",
        description: "Productos confiables y duraderos para todos tus proyectos",
        buttonText: "Ver productos",
        buttonLink: "/catalogo?brand=sica",
        backgroundImage: "/hero-banner/hero-banner-1.jpg",
        brandSlug: "sica"
    },
    {
        id: 3,
        title: "Soluciones eléctricas profesionales",
        description: "Todo lo que necesitas para instalaciones residenciales y comerciales",
        buttonText: "Explorar",
        buttonLink: "/catalogo",
        backgroundImage: "/hero-banner/hero-banner-1.jpg"
    },
    {
        id: 4,
        title: "Tecnología y calidad garantizada",
        description: "Los mejores productos para electricistas profesionales",
        buttonText: "Ver catálogo",
        buttonLink: "/catalogo",
        backgroundImage: "/hero-banner/hero-banner-1.jpg"
    }
];

export default function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg shadow-lg">
            {/* Slides */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                >
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-gray-800"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage})`,
                        }}
                    >
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/50"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center h-full px-14 md:px-30">
                        <div className="w-full md:w-[50%] text-white">
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                                {slide.title}
                            </h2>
                            <p className="text-lg md:text-xl mb-6 opacity-90">
                                {slide.description}
                            </p>
                            <Link
                                href={slide.buttonLink}
                                className="inline-block bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
                            >
                                {slide.buttonText}
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                aria-label="Slide anterior"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                aria-label="Slide siguiente"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentSlide ? "bg-white" : "bg-white/50"
                        }`}
                        aria-label={`Ir al slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}