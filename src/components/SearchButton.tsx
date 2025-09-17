"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Product {
    id: string;
    sku: string | null;
    name: string;
    priceBase: number;
    currency: string;
    brand: {
        name: string;
        slug: string;
    };
}

export default function SearchButton() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Cerrar búsqueda con Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsSearchOpen(false);
                setSearchTerm("");
                setSearchResults([]);
            }
        };

        if (isSearchOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isSearchOpen]);

    // Cerrar búsqueda al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
                setSearchTerm("");
                setSearchResults([]);
            }
        };

        if (isSearchOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isSearchOpen]);

    // Enfocar input cuando se abre
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Buscar productos
    const searchProducts = async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/products/search?q=${encodeURIComponent(term)}`);
            if (response.ok) {
                const products = await response.json();
                setSearchResults(products);
            }
        } catch (error) {
            console.error("Error searching products:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce para la búsqueda
    useEffect(() => {
        if (!isSearchOpen) return;
        
        const timeoutId = setTimeout(() => {
            searchProducts(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isSearchOpen]);

    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const money = (n: number, currency = "ARS") => {
        return new Intl.NumberFormat("es-AR", { style: "currency", currency })
            .format(Number(n || 0));
    };

    const handleResultClick = () => {
        setIsSearchOpen(false);
        setSearchTerm("");
        setSearchResults([]);
    };

    return (
        <div className="relative" ref={searchRef}>
            {/* Botón de búsqueda siempre visible */}
            <button
                onClick={handleSearchClick}
                className={`inline-flex items-center gap-1 px-2 py-1 text-sm transition-colors ${
                    isSearchOpen 
                        ? 'text-[#384A93] font-medium' 
                        : 'text-[#1C1C1C] hover:text-[#384A93]'
                }`}
            >
                Buscar
            </button>

            {/* Dropdown de búsqueda */}
            {isSearchOpen && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="bg-white border border-[#B5B5B5]/40 rounded-lg shadow-lg min-w-[400px]">
                        {/* Input de búsqueda */}
                        <div className="p-4 border-b border-[#B5B5B5]/20">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 text-[#646464]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                    placeholder="Buscar por marca, SKU o descripción..."
                                    className="flex-1 text-sm text-[#384A93] outline-none placeholder:text-[#646464]"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchTerm("");
                                        setSearchResults([]);
                                    }}
                                    className="text-[#646464] hover:text-[#1C1C1C] transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Resultados */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-center text-[#646464]">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#384A93] mx-auto mb-2"></div>
                                    Buscando...
                                </div>
                            ) : searchTerm.trim() && searchResults.length === 0 ? (
                                <div className="p-4 text-center text-[#384A93]">
                                    No se encontraron productos
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="py-2">
                                    {searchResults.slice(0, 8).map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/catalogo?brand=${product.brand.slug}`}
                                            onClick={handleResultClick}
                                            className="block px-4 py-3 hover:bg-[#F5F5F7] transition-colors border-b border-[#B5B5B5]/10 last:border-b-0"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-[#384A93] bg-[#384A93]/10 px-2 py-0.5 rounded">
                                                            {product.brand.name}
                                                        </span>
                                                        {product.sku && (
                                                            <span className="text-xs text-[#384A93]">
                                                                {product.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-medium text-[#1C1C1C] truncate">
                                                        {product.name}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-semibold text-[#1C1C1C] ml-4">
                                                    {money(product.priceBase, product.currency)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    {searchResults.length > 8 && (
                                        <div className="px-4 py-2 text-xs text-[#384A93] text-center border-t border-[#B5B5B5]/10">
                                            Mostrando {Math.min(8, searchResults.length)} de {searchResults.length} resultados
                                        </div>
                                    )}
                                </div>
                            ) : searchTerm.trim() === "" ? (
                                <div className="p-4 text-center text-[#384A93] text-sm">
                                    Escribe para buscar productos
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}