"use client";

import { useState, useMemo, useEffect } from 'react';
import ExcelImporter from './ExcelImporter';
import ProductStatusSelect from './ProductStatusSelect';
import ProductDeleteButton from './ProductDeleteButton';
import EditableStock from './EditableStock';
import ProductFeaturedToggle from './ProductFeaturedToggle';

type Product = {
    id: string;
    sku: string | null;
    name: string;
    priceBase: number;
    currency: string;
    stockQty: number;
    taxRate: number | null;
    isActive: boolean;
    featured: boolean;
    brand: {
        name: string;
    } | null;
};

type ProductsTableProps = {
    products: Product[];
    onImportSuccess?: () => void;
};

export default function ProductsTable({ products, onImportSuccess }: ProductsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [showImporter, setShowImporter] = useState(false);
    const [localProducts, setLocalProducts] = useState(products);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 50;

    // Sincronizar productos locales cuando cambien las props
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    // Función para manejar el cambio de estado del producto
    const handleStatusChange = (productId: string, newStatus: boolean) => {
        setLocalProducts(prevProducts => 
            prevProducts.map(product => 
                product.id === productId 
                    ? { ...product, isActive: newStatus }
                    : product
            )
        );
    };

    // Función para manejar la eliminación del producto
    const handleProductDelete = (productId: string) => {
        setLocalProducts(prevProducts => 
            prevProducts.filter(product => product.id !== productId)
        );
    };

    // Función para manejar el cambio de stock del producto
    const handleStockChange = (productId: string, newStock: number) => {
        setLocalProducts(prevProducts => 
            prevProducts.map(product => 
                product.id === productId 
                    ? { ...product, stockQty: newStock }
                    : product
            )
        );
    };

    // Función para manejar el cambio de estado destacado del producto
    const handleFeaturedChange = (productId: string, newFeatured: boolean) => {
        setLocalProducts(prevProducts => 
            prevProducts.map(product => 
                product.id === productId 
                    ? { ...product, featured: newFeatured }
                    : product
            )
        );
    };

    // Extraer marcas únicas
    const uniqueBrands = useMemo(() => {
        const brands = products
            .map(product => product.brand?.name)
            .filter((brand): brand is string => Boolean(brand))
            .filter((brand, index, array) => array.indexOf(brand) === index)
            .sort();
        return brands;
    }, [products]);

    const filteredProducts = useMemo(() => {
        return localProducts.filter(product => {
            // Filtro por texto
            const matchesSearch = !searchTerm.trim() || (() => {
                const term = searchTerm.toLowerCase().trim();
                const sku = (product.sku || '').toLowerCase();
                const name = product.name.toLowerCase();
                const brand = (product.brand?.name || '').toLowerCase();
                return sku.includes(term) || name.includes(term) || brand.includes(term);
            })();

            // Filtro por marca
            const matchesBrand = !selectedBrand || product.brand?.name === selectedBrand;

            return matchesSearch && matchesBrand;
        });
    }, [localProducts, searchTerm, selectedBrand]);

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBrand]);

    // Calcular productos paginados
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return filteredProducts.slice(startIndex, startIndex + productsPerPage);
    }, [filteredProducts, currentPage, productsPerPage]);

    // Calcular número total de páginas
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handleImport = async (importData: any[]) => {
        try {
            const response = await fetch('/api/productos/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ products: importData }),
            });

            const result = await response.json();

            if (result.success) {
                alert(`Importación completada:\n• Creados: ${result.results.created}\n• Actualizados: ${result.results.updated}\n• Errores: ${result.results.errors}`);
                if (onImportSuccess) {
                    onImportSuccess();
                }
            } else {
                alert(`Error en la importación: ${result.error}`);
            }
        } catch (error) {
            console.error('Error importando:', error);
            alert('Error al importar los productos');
        }
    };

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por SKU, producto o marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm"
                    />
                </div>
                
                <div className="flex gap-2 md:gap-4">
                    <div className="flex-1 md:min-w-[200px]">
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm bg-white"
                        >
                            <option value="">Todas las marcas</option>
                            {uniqueBrands.map((brand) => (
                                <option key={brand} value={brand}>
                                    {brand}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <button
                        onClick={() => setShowImporter(true)}
                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white text-sm font-medium rounded-lg hover:bg-[#2e3d7a] transition-colors whitespace-nowrap"
                    >
                        <svg className="w-4 h-4 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="hidden md:inline">Importar Excel</span>
                    </button>
                </div>
                
                <div className="text-sm text-[#646464] text-center md:text-left md:whitespace-nowrap">
                    {filteredProducts.length} de {products.length} productos
                    {totalPages > 1 && (
                        <span className="ml-2">
                            • Página {currentPage} de {totalPages}
                        </span>
                    )}
                </div>
            </div>

            {/* Vista Desktop - Tabla */}
            <div className="hidden md:block bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F8F9FA] border-b border-[#E5E5E5]">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-[#1C1C1C]">SKU</th>
                                <th className="text-left px-4 py-3 font-medium text-[#1C1C1C]">Producto</th>
                                <th className="text-left px-4 py-3 font-medium text-[#1C1C1C]">Marca</th>
                                <th className="text-right px-4 py-3 font-medium text-[#1C1C1C]">Precio</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">Moneda</th>
                                <th className="text-right px-4 py-3 font-medium text-[#1C1C1C]">Stock</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">IVA</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">Destacado</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">Estado</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((product) => (
                                <tr key={product.id} className="border-b border-[#E5E5E5] hover:bg-[#F8F9FA]">
                                    <td className="px-4 py-3 font-mono text-sm">
                                        {product.sku || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-[#1C1C1C] text-xs">
                                            {product.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {product.brand?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        {product.currency === 'USD' ? 'U$S' : '$'}{product.priceBase.toLocaleString('es-AR', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2 
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                                            product.currency === 'USD' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {product.currency === 'USD' ? 'USD' : 'ARS'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <EditableStock
                                            productId={product.id}
                                            productName={product.name}
                                            currentStock={product.stockQty}
                                            onStockChange={handleStockChange}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">
                                        {product.taxRate ? `${product.taxRate}%` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <ProductFeaturedToggle
                                            productId={product.id}
                                            productName={product.name}
                                            currentFeatured={product.featured}
                                            onFeaturedChange={handleFeaturedChange}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <ProductStatusSelect
                                            productId={product.id}
                                            productName={product.name}
                                            currentStatus={product.isActive}
                                            onStatusChange={handleStatusChange}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <ProductDeleteButton
                                            productId={product.id}
                                            productName={product.name}
                                            onDelete={handleProductDelete}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vista Mobile - Tarjetas */}
            <div className="md:hidden space-y-4">
                {paginatedProducts.map((product) => (
                    <div key={product.id} className="bg-white border border-[#E5E5E5] rounded-lg p-4 shadow-sm">
                        {/* Primera fila: SKU, descripción y marca */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <img
                                    src={product.sku ? `/product-images/${product.sku}.png` : `/product-images/placeholder.png`}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded"
                                    onError={(e) => {
                                        const el = e.currentTarget as HTMLImageElement;
                                        el.onerror = null;
                                        el.src = "/product-images/placeholder.png";
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-mono text-sm text-[#646464]">
                                        {product.sku || 'Sin SKU'}
                                    </span>
                                    <span className="text-[#646464] text-xs">•</span>
                                    <span className="text-xs text-[#646464]">
                                        {product.brand?.name || 'Sin marca'}
                                    </span>
                                </div>
                                <h3 className="font-medium text-[#1C1C1C] text-sm line-clamp-2">
                                    {product.name}
                                </h3>
                            </div>
                        </div>

                        {/* Segunda fila: Precio, moneda, IVA y stock */}
                        <div className="grid grid-cols-4 gap-3 mb-3">
                            <div>
                                <div className="text-xs text-[#646464] uppercase tracking-wide mb-1">Precio</div>
                                <div className="text-sm font-mono font-medium text-[#1C1C1C]">
                                    {product.currency === 'USD' ? 'U$S' : '$'}{product.priceBase.toLocaleString('es-AR', { 
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2 
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-[#646464] uppercase tracking-wide mb-1">Moneda</div>
                                <span className={`inline-flex px-1.5 py-0.5 text-xs rounded-full font-medium ${
                                    product.currency === 'USD' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {product.currency === 'USD' ? 'USD' : 'ARS'}
                                </span>
                            </div>
                            <div>
                                <div className="text-xs text-[#646464] uppercase tracking-wide mb-1">IVA</div>
                                <div className="text-sm font-mono text-[#1C1C1C]">
                                    {product.taxRate ? `${product.taxRate}%` : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-[#646464] uppercase tracking-wide mb-1">Stock</div>
                                <EditableStock
                                    productId={product.id}
                                    productName={product.name}
                                    currentStock={product.stockQty}
                                    onStockChange={handleStockChange}
                                />
                            </div>
                        </div>

                        {/* Controles de gestión */}
                        <div className="border-t border-[#E5E5E5] pt-3">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <ProductStatusSelect
                                        productId={product.id}
                                        productName={product.name}
                                        currentStatus={product.isActive}
                                        onStatusChange={handleStatusChange}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <ProductDeleteButton
                                        productId={product.id}
                                        productName={product.name}
                                        onDelete={handleProductDelete}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {/* Botón anterior */}
                    {currentPage > 1 && (
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            className="flex items-center px-3 py-2 text-sm border border-[#E5E5E5] bg-[#F8F9FA] text-[#384A93] rounded hover:bg-[#E5E5E5] transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                            Anterior
                        </button>
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
                                    <button
                                        key={1}
                                        onClick={() => setCurrentPage(1)}
                                        className="flex items-center justify-center w-10 h-10 text-sm border border-[#E5E5E5] bg-[#F8F9FA] text-[#384A93] rounded hover:bg-[#E5E5E5] transition-colors"
                                    >
                                        1
                                    </button>
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
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`flex items-center justify-center w-10 h-10 text-sm rounded transition-colors ${
                                            i === currentPage
                                                ? 'bg-[#384A93] text-white'
                                                : 'border border-[#E5E5E5] bg-[#F8F9FA] text-[#384A93] hover:bg-[#E5E5E5]'
                                        }`}
                                    >
                                        {i}
                                    </button>
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
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="flex items-center justify-center w-10 h-10 text-sm border border-[#E5E5E5] bg-[#F8F9FA] text-[#384A93] rounded hover:bg-[#E5E5E5] transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()
                        }
                    </div>

                    {/* Botón siguiente */}
                    {currentPage < totalPages && (
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="flex items-center px-3 py-2 text-sm border border-[#E5E5E5] bg-[#F8F9FA] text-[#384A93] rounded hover:bg-[#E5E5E5] transition-colors"
                        >
                            Siguiente
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Mensajes de estado para ambas vistas */}
            {filteredProducts.length === 0 && (searchTerm || selectedBrand) && (
                <div className="bg-white border border-[#E5E5E5] rounded-lg p-12 text-center text-gray-500">
                    No se encontraron productos con los filtros aplicados
                    {searchTerm && (
                        <div className="text-xs mt-1">Búsqueda: "{searchTerm}"</div>
                    )}
                    {selectedBrand && (
                        <div className="text-xs mt-1">Marca: {selectedBrand}</div>
                    )}
                </div>
            )}

            {products.length === 0 && (
                <div className="bg-white border border-[#E5E5E5] rounded-lg p-12 text-center text-gray-500">
                    No hay productos registrados
                </div>
            )}

            <ExcelImporter
                isOpen={showImporter}
                onClose={() => setShowImporter(false)}
                onImport={handleImport}
            />
        </div>
    );
}