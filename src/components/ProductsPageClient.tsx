"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import ProductsTable from './ProductsTable';
import Link from 'next/link';

type Product = {
    id: string;
    sku: string | null;
    name: string;
    priceBase: number;
    currency: string;
    stockQty: number;
    taxRate: number | null;
    isActive: boolean;
    isFeatured: boolean;
    brand: {
        name: string;
    } | null;
};

type ProductsPageClientProps = {
    products: Product[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    allBrands: { name: string; slug: string }[];
    selectedBrandSlug?: string;
    searchTerm?: string;
};

export default function ProductsPageClient({
    products,
    currentPage,
    totalPages,
    totalCount,
    allBrands,
    selectedBrandSlug,
    searchTerm
}: ProductsPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleImportSuccess = () => {
        // Recargar la página para obtener los datos actualizados
        router.refresh();
    };

    const createPageUrl = (pageNum: number) => {
        const params = new URLSearchParams(searchParams);
        if (pageNum <= 1) {
            params.delete('page');
        } else {
            params.set('page', pageNum.toString());
        }
        return `/mi-cuenta/productos${params.toString() ? '?' + params.toString() : ''}`;
    };

    // Calcular rango de páginas a mostrar
    const getVisiblePages = () => {
        const delta = 2; // Mostrar 2 páginas antes y después de la actual
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta);
             i <= Math.min(totalPages - 1, currentPage + delta);
             i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, -1); // -1 representa "..."
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push(-2, totalPages); // -2 representa "..."
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <>
            <ProductsTable
                products={products}
                onImportSuccess={handleImportSuccess}
                allBrands={allBrands}
                selectedBrandSlug={selectedBrandSlug}
                totalCount={totalCount}
                searchTerm={searchTerm}
            />

            {/* Controles de paginación */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-[#646464]">
                        Mostrando {(currentPage - 1) * 30 + 1} a {Math.min(currentPage * 30, totalCount)} de {totalCount} productos
                    </div>

                    <div className="flex items-center space-x-1">
                        {/* Botón anterior */}
                        <Link
                            href={createPageUrl(currentPage - 1)}
                            className={`px-3 py-2 text-sm border rounded ${
                                currentPage <= 1
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-[#384A93] border-[#384A93] hover:bg-[#384A93] hover:text-white'
                            }`}
                            aria-disabled={currentPage <= 1}
                        >
                            Anterior
                        </Link>

                        {/* Números de página */}
                        {getVisiblePages().map((pageNum, index) => (
                            pageNum === -1 || pageNum === -2 ? (
                                <span key={`dots-${index}`} className="px-3 py-2 text-gray-400">
                                    ...
                                </span>
                            ) : (
                                <Link
                                    key={pageNum}
                                    href={createPageUrl(pageNum)}
                                    className={`px-3 py-2 text-sm border rounded ${
                                        pageNum === currentPage
                                            ? 'bg-[#384A93] text-white border-[#384A93]'
                                            : 'text-[#384A93] border-gray-300 hover:bg-[#384A93] hover:text-white'
                                    }`}
                                >
                                    {pageNum}
                                </Link>
                            )
                        ))}

                        {/* Botón siguiente */}
                        <Link
                            href={createPageUrl(currentPage + 1)}
                            className={`px-3 py-2 text-sm border rounded ${
                                currentPage >= totalPages
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-[#384A93] border-[#384A93] hover:bg-[#384A93] hover:text-white'
                            }`}
                            aria-disabled={currentPage >= totalPages}
                        >
                            Siguiente
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}