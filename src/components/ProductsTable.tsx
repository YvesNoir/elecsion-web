"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ExcelImporter from './ExcelImporter';
import ProductStatusSelect from './ProductStatusSelect';
import ProductDeleteButton from './ProductDeleteButton';
import EditableStock from './EditableStock';

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

type ProductsTableProps = {
    products: Product[];
    onImportSuccess?: () => void;
    allBrands?: { name: string; slug: string }[];
    selectedBrandSlug?: string;
    totalCount?: number;
    searchTerm?: string;
};

export default function ProductsTable({ products, onImportSuccess, allBrands, selectedBrandSlug, totalCount, searchTerm: initialSearchTerm }: ProductsTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [showImporter, setShowImporter] = useState(false);
    const [localProducts, setLocalProducts] = useState(products);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sincronizar productos locales cuando cambien las props
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    // Sincronizar searchTerm cuando cambie el prop
    useEffect(() => {
        setSearchTerm(initialSearchTerm || '');
    }, [initialSearchTerm]);

    // Cleanup timeout al desmontar el componente
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

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
    const handleFeaturedChange = async (productId: string, isFeatured: boolean) => {
        try {
            const response = await fetch(`/api/productos/${productId}/featured`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isFeatured }),
            });

            if (response.ok) {
                setLocalProducts(prevProducts =>
                    prevProducts.map(product =>
                        product.id === productId
                            ? { ...product, isFeatured }
                            : product
                    )
                );
            } else {
                alert('Error al actualizar el estado destacado del producto');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar el estado destacado del producto');
        }
    };

    // Usar todas las marcas pasadas como props, o extraer de productos como fallback
    const uniqueBrands = useMemo(() => {
        if (allBrands && allBrands.length > 0) {
            return allBrands;
        }
        // Fallback: extraer marcas de los productos actuales
        const brands = products
            .map(product => product.brand?.name)
            .filter((brand): brand is string => Boolean(brand))
            .filter((brand, index, array) => array.indexOf(brand) === index)
            .sort()
            .map(name => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
        return brands;
    }, [allBrands, products]);

    // Función para manejar el cambio de marca
    const handleBrandChange = (brandName: string) => {
        if (!brandName) {
            // Si se selecciona "Todas las marcas", ir a la página sin filtro
            router.push('/mi-cuenta/productos');
            return;
        }

        // Encontrar el slug de la marca seleccionada
        const selectedBrandObj = uniqueBrands.find(brand => brand.name === brandName);
        if (selectedBrandObj) {
            router.push(`/mi-cuenta/productos?marca=${selectedBrandObj.slug}`);
        }
    };

    // Función para manejar la búsqueda del servidor con debounce
    const handleSearchChange = (searchValue: string) => {
        setSearchTerm(searchValue);

        // Cancelar timeout anterior si existe
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce de 500ms
        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams();

            if (searchValue.trim()) {
                params.set('buscar', searchValue.trim());
            }

            if (selectedBrandSlug) {
                params.set('marca', selectedBrandSlug);
            }

            const newUrl = `/mi-cuenta/productos${params.toString() ? '?' + params.toString() : ''}`;
            router.push(newUrl);
        }, 500);
    };

    // Establecer marca seleccionada al cargar basándose en el slug
    useEffect(() => {
        if (selectedBrandSlug && uniqueBrands.length > 0) {
            // Encontrar la marca que corresponde al slug
            const matchingBrand = uniqueBrands.find(brand =>
                brand.slug === selectedBrandSlug
            );
            if (matchingBrand) {
                setSelectedBrand(matchingBrand.name);
            }
        } else if (!selectedBrandSlug) {
            setSelectedBrand('');
        }
    }, [selectedBrandSlug, uniqueBrands]);

    // Los productos ya vienen filtrados del servidor, no necesitamos filtrado local
    const filteredProducts = localProducts;

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
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por SKU, producto o marca..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm"
                    />
                </div>
                <div className="min-w-[200px]">
                    <select
                        value={selectedBrand}
                        onChange={(e) => handleBrandChange(e.target.value)}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm bg-white"
                    >
                        <option value="">Todas las marcas</option>
                        {uniqueBrands.map((brand) => (
                            <option key={brand.slug} value={brand.name}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-sm text-[#646464] whitespace-nowrap">
                    {products.length} de {totalCount || products.length} productos
                </div>
                <button
                    onClick={() => setShowImporter(true)}
                    className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white text-sm font-medium rounded-lg hover:bg-[#2e3d7a] transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Importar Excel
                </button>
            </div>

            {/* Vista móvil - Tarjetas */}
            <div className="md:hidden space-y-3">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white border border-[#E5E5E5] rounded-lg p-4">
                        {/* Header: Destacado + SKU + Estado + Eliminar */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={product.isFeatured}
                                    onChange={(e) => handleFeaturedChange(product.id, e.target.checked)}
                                    className="w-4 h-4 text-[#384A93] bg-gray-100 border-gray-300 rounded focus:ring-[#384A93] focus:ring-2"
                                />
                                <div className="text-sm font-medium text-[#646464]">
                                    {product.sku || '—'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ProductStatusSelect
                                    productId={product.id}
                                    productName={product.name}
                                    currentStatus={product.isActive}
                                    onStatusChange={handleStatusChange}
                                />
                                <ProductDeleteButton
                                    productId={product.id}
                                    productName={product.name}
                                    onDelete={handleProductDelete}
                                />
                            </div>
                        </div>

                        {/* Nombre del producto + Marca */}
                        <div className="mb-4">
                            <div className="text-base font-medium text-[#1C1C1C] mb-1">
                                {product.name}
                            </div>
                            {product.brand && (
                                <div className="text-sm text-[#646464]">
                                    {product.brand.name}
                                </div>
                            )}
                        </div>

                        {/* Footer: Precio + Moneda + IVA + Stock */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-[#1C1C1C]">
                                    {product.currency === 'USD' ? 'U$S' : '$'}{product.priceBase.toLocaleString('es-AR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    product.currency === 'USD'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {product.currency === 'USD' ? 'USD' : 'ARS'}
                                </span>
                                {product.taxRate && (
                                    <span className="text-[#646464]">
                                        IVA: {product.taxRate}%
                                    </span>
                                )}
                            </div>
                            <div className="text-[#646464]">
                                Stock: {product.stockQty}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden md:block bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F8F9FA] border-b border-[#E5E5E5]">
                            <tr>
                                <th className="w-16"></th>
                                <th className="text-left px-4 py-3 font-medium text-[#1C1C1C]">SKU</th>
                                <th className="text-left px-4 py-3 font-medium text-[#1C1C1C]">Producto</th>
                                <th className="text-left px-4 py-3 font-medium text-[#1C1C1C]">Marca</th>
                                <th className="text-right px-4 py-3 font-medium text-[#1C1C1C]">Precio</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">Moneda</th>
                                <th className="text-right px-4 py-3 font-medium text-[#1C1C1C]">Stock</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">IVA</th>
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">Estado</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="border-b border-[#E5E5E5] hover:bg-[#F8F9FA]">
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={product.isFeatured}
                                            onChange={(e) => handleFeaturedChange(product.id, e.target.checked)}
                                            className="w-4 h-4 text-[#384A93] bg-gray-100 border-gray-300 rounded focus:ring-[#384A93] focus:ring-2"
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm">
                                        {product.sku || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-[#1C1C1C] text-sm">
                                            {product.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
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

            {/* Mensajes de estado para ambas vistas */}
            {filteredProducts.length === 0 && (searchTerm || selectedBrand) && (
                <div className="text-center py-12 text-gray-500 bg-white border border-[#E5E5E5] rounded-lg">
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
                <div className="text-center py-12 text-gray-500 bg-white border border-[#E5E5E5] rounded-lg">
                    No hay productos registrados
                </div>
            )}

            <ExcelImporter
                isOpen={showImporter}
                onClose={() => setShowImporter(false)}
                onImport={handleImport}
                onImportSuccess={onImportSuccess}
            />
        </div>
    );
}