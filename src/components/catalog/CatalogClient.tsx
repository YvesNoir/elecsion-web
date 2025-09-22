"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCardRow from "./ProductCardRow";
import ProductCardGrid from "./ProductCardGrid";

type Brand = {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
};

type Product = {
    id: string;
    sku: string | null;
    name: string;
    unit: string | null;
    priceBase: number;
    currency: string;
    taxRate: number | null;
    brand: {
        name: string;
        slug: string;
    } | null;
};

type CatalogClientProps = {
    brands: Brand[];
    products: Product[];
    selectedBrand: Brand | null;
    currentSlug: string;
    searchTerm: string;
    totalProducts: number;
    currentPage: number;
    totalPages: number;
    productsPerPage: number;
    isLoggedIn: boolean;
};

export default function CatalogClient({ 
    brands, 
    products, 
    selectedBrand, 
    currentSlug,
    searchTerm,
    totalProducts,
    currentPage,
    totalPages,
    productsPerPage,
    isLoggedIn
}: CatalogClientProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [brandsCollapsed, setBrandsCollapsed] = useState(false);
    const [searchInput, setSearchInput] = useState(searchTerm);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        
        if (currentSlug) {
            params.set('brand', currentSlug);
        }
        if (searchInput.trim()) {
            params.set('search', searchInput.trim());
        }
        
        const queryString = params.toString();
        const url = queryString ? `/catalogo?${queryString}` : '/catalogo';
        router.push(url);
    };

    const clearSearch = () => {
        setSearchInput('');
        const params = new URLSearchParams();
        
        if (currentSlug) {
            params.set('brand', currentSlug);
        }
        
        const queryString = params.toString();
        const url = queryString ? `/catalogo?${queryString}` : '/catalogo';
        router.push(url);
    };

    // Helper function to build URLs with brand and search parameters
    const buildUrl = (brandSlug?: string, pageNum?: number, searchQuery?: string) => {
        const params = new URLSearchParams();
        
        if (brandSlug) {
            params.set('brand', brandSlug);
        }
        if (searchQuery) {
            params.set('search', searchQuery);
        }
        if (pageNum && pageNum > 1) {
            params.set('page', pageNum.toString());
        }
        
        const queryString = params.toString();
        return queryString ? `/catalogo?${queryString}` : '/catalogo';
    };

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-[1500px] py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar filtros */}
                    <aside className="col-span-12 md:col-span-3">
                        <div className="space-y-4">
                            {/* Header de filtros */}
                            <div className="bg-white rounded-lg border border-[#B5B5B5]/20">
                                <div className="px-4 py-4">
                                    <h2 className="text-lg font-medium text-[#1C1C1C]">Filtros</h2>
                                    <p className="text-sm text-[#646464] mt-1">
                                        {totalProducts} {totalProducts === 1 ? 'PRODUCTO' : 'PRODUCTOS'}
                                        {selectedBrand && ` - ${selectedBrand.name.toUpperCase()}`}
                                        {searchTerm && ` - Búsqueda: "${searchTerm}"`}
                                    </p>
                                </div>
                            </div>

                            {/* Buscador */}
                            <div className="bg-white rounded-lg border border-[#B5B5B5]/20">
                                <div className="px-4 py-4">
                                    <h3 className="font-medium text-[#1C1C1C] mb-3">Buscar productos</h3>
                                    <form onSubmit={handleSearch} className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                placeholder="SKU, nombre o descripción..."
                                                className="w-full px-3 py-2 pr-10 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            />
                                            <button
                                                type="submit"
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[#646464] hover:text-[#384A93] transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="w-full px-3 py-1.5 text-xs text-[#646464] hover:text-[#384A93] border border-[#E5E5E5] rounded-md hover:border-[#384A93] transition-colors"
                                            >
                                                Limpiar búsqueda
                                            </button>
                                        )}
                                    </form>
                                </div>
                            </div>

                            {/* Filtro de marcas */}
                            <div className="bg-white rounded-lg border border-[#B5B5B5]/20">
                                <button
                                    onClick={() => setBrandsCollapsed(!brandsCollapsed)}
                                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-[#1C1C1C]">Marcas</span>
                                    <svg 
                                        className={`w-5 h-5 text-[#646464] transition-transform ${brandsCollapsed ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {!brandsCollapsed && (
                                    <div className="border-t border-[#B5B5B5]/20">
                                        {/* Opción "Todas las marcas" */}
                                        <Link
                                            href={buildUrl(undefined, 1, searchTerm)}
                                            className={`flex items-center justify-between px-4 py-3 text-sm border-b border-[#B5B5B5]/10 last:border-b-0 transition-colors ${
                                                !currentSlug 
                                                    ? "bg-[#384A93]/5 text-[#384A93] font-medium border-l-4 border-l-[#384A93]" 
                                                    : "text-[#646464] hover:bg-gray-50 hover:text-[#1C1C1C]"
                                            }`}
                                        >
                                            <span>Todas las marcas</span>
                                            <span className="text-xs">
                                                {brands.reduce((total, b) => total + b._count.products, 0)}
                                            </span>
                                        </Link>

                                        {/* Lista de marcas */}
                                        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                                            {brands.map((b) => {
                                                const active = b.slug === currentSlug;
                                                return (
                                                    <Link
                                                        key={b.id}
                                                        href={buildUrl(b.slug, 1, searchTerm)}
                                                        className={`flex items-center justify-between px-4 py-3 text-sm border-b border-[#B5B5B5]/10 last:border-b-0 transition-colors ${
                                                            active 
                                                                ? "bg-[#384A93]/5 text-[#384A93] font-medium border-l-4 border-l-[#384A93]" 
                                                                : "text-[#646464] hover:bg-gray-50 hover:text-[#1C1C1C]"
                                                        }`}
                                                    >
                                                        <span>{b.name}</span>
                                                        <span className="text-xs">{b._count.products}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Contenido principal */}
                    <main className="col-span-12 md:col-span-9">
                        <div className="bg-white">
                            {/* Header con toggle de vista */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    {!selectedBrand ? (
                                        <>
                                            <h1 className="text-xl sm:text-2xl font-semibold text-[#1C1C1C]">Catálogo</h1>
                                            <p className="mt-2 text-sm text-[#646464]">
                                                Mostrando {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, totalProducts)} de {totalProducts} productos. 
                                                Elegí una marca a la izquierda para filtrar.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="text-xl sm:text-2xl font-semibold text-[#1C1C1C]">Productos {selectedBrand.name}</h1>
                                            <p className="mt-2 text-sm text-[#646464]">
                                                Mostrando {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, totalProducts)} de {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Toggle de vista */}
                                {products.length > 0 && (
                                    <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                                                viewMode === 'list' 
                                                    ? 'bg-white text-[#384A93] shadow-sm' 
                                                    : 'text-[#646464] hover:text-[#1C1C1C]'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                            </svg>
                                            Lista
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                                                viewMode === 'grid' 
                                                    ? 'bg-white text-[#384A93] shadow-sm' 
                                                    : 'text-[#646464] hover:text-[#1C1C1C]'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            Tarjetas
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Contenido de productos */}
                            {products.length === 0 ? (
                                <div className="mt-6 rounded-md border border-dashed p-6 text-sm text-[#7a7a7a]">
                                    {!selectedBrand 
                                        ? "No hay productos disponibles en el catálogo."
                                        : "No hay productos para esta marca."
                                    }
                                </div>
                            ) : (
                                <>
                                    {/* Vista en lista */}
                                    {viewMode === 'list' && (
                                        <ul className="space-y-3">
                                            {products.map((p) => (
                                                <ProductCardRow
                                                    key={p.id}
                                                    sku={p.sku}
                                                    name={p.name}
                                                    unit={p.unit}
                                                    priceBase={p.priceBase}
                                                    currency={p.currency}
                                                    taxRate={p.taxRate}
                                                                    brand={p.brand}
                                                    isLoggedIn={isLoggedIn}
                                                />
                                            ))}
                                        </ul>
                                    )}

                                    {/* Vista en grid */}
                                    {viewMode === 'grid' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {products.map((p) => (
                                                <ProductCardGrid
                                                    key={p.id}
                                                    sku={p.sku}
                                                    name={p.name}
                                                    unit={p.unit}
                                                    priceBase={p.priceBase}
                                                    currency={p.currency}
                                                    taxRate={p.taxRate}
                                                                    isLoggedIn={isLoggedIn}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex items-center justify-center">
                                    <div className="flex items-center gap-2">
                                        {/* Botón anterior */}
                                        {currentPage > 1 && (
                                            <Link
                                                href={buildUrl(selectedBrand?.slug, currentPage - 1, searchTerm)}
                                                className="flex items-center px-3 py-2 text-sm border border-[#e1e8f4] bg-[#e1e8f4] text-[#384A93] rounded-full hover:bg-[#d1d8e4] transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Anterior
                                            </Link>
                                        )}

                                        {/* Números de página */}
                                        <div className="flex items-center gap-1">
                                            {(() => {
                                                const startPage = Math.max(1, currentPage - 2);
                                                const endPage = Math.min(totalPages, currentPage + 2);
                                                const pages = [];

                                                // Primera página si no está en el rango
                                                if (startPage > 1) {
                                                    pages.push(
                                                        <Link
                                                            key={1}
                                                            href={buildUrl(selectedBrand?.slug, 1, searchTerm)}
                                                            className="flex items-center justify-center w-10 h-10 text-sm border border-[#e1e8f4] bg-[#e1e8f4] text-[#384A93] rounded-full hover:bg-[#d1d8e4] transition-colors"
                                                        >
                                                            1
                                                        </Link>
                                                    );
                                                    if (startPage > 2) {
                                                        pages.push(
                                                            <span key="start-ellipsis" className="flex items-center justify-center w-10 h-10 text-sm text-[#646464]">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                }

                                                // Páginas en el rango
                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(
                                                        <Link
                                                            key={i}
                                                            href={buildUrl(selectedBrand?.slug, i, searchTerm)}
                                                            className={`flex items-center justify-center w-10 h-10 text-sm rounded-full transition-colors ${
                                                                i === currentPage
                                                                    ? 'bg-[#384A93] text-white'
                                                                    : 'border border-[#e1e8f4] bg-[#e1e8f4] text-[#384A93] hover:bg-[#d1d8e4]'
                                                            }`}
                                                        >
                                                            {i}
                                                        </Link>
                                                    );
                                                }

                                                // Última página si no está en el rango
                                                if (endPage < totalPages) {
                                                    if (endPage < totalPages - 1) {
                                                        pages.push(
                                                            <span key="end-ellipsis" className="flex items-center justify-center w-10 h-10 text-sm text-[#646464]">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    pages.push(
                                                        <Link
                                                            key={totalPages}
                                                            href={buildUrl(selectedBrand?.slug, totalPages, searchTerm)}
                                                            className="flex items-center justify-center w-10 h-10 text-sm border border-[#e1e8f4] bg-[#e1e8f4] text-[#384A93] rounded-full hover:bg-[#d1d8e4] transition-colors"
                                                        >
                                                            {totalPages}
                                                        </Link>
                                                    );
                                                }

                                                return pages;
                                            })()}
                                        </div>

                                        {/* Botón siguiente */}
                                        {currentPage < totalPages && (
                                            <Link
                                                href={buildUrl(selectedBrand?.slug, currentPage + 1, searchTerm)}
                                                className="flex items-center px-3 py-2 text-sm border border-[#e1e8f4] bg-[#e1e8f4] text-[#384A93] rounded-full hover:bg-[#d1d8e4] transition-colors"
                                            >
                                                Siguiente
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}