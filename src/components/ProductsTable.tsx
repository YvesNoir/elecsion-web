"use client";

import { useState, useMemo, useEffect } from 'react';
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm"
                    />
                </div>
                <div className="min-w-[200px]">
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
                <div className="text-sm text-[#646464] whitespace-nowrap">
                    {filteredProducts.length} de {products.length} productos
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

            {/* Tabla */}
            <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
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
                                <th className="text-center px-4 py-3 font-medium text-[#1C1C1C]">Estado</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="border-b border-[#E5E5E5] hover:bg-[#F8F9FA]">
                                    <td className="px-4 py-3 font-mono text-sm">
                                        {product.sku || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-[#1C1C1C]">
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

                {filteredProducts.length === 0 && (searchTerm || selectedBrand) && (
                    <div className="text-center py-12 text-gray-500">
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
                    <div className="text-center py-12 text-gray-500">
                        No hay productos registrados
                    </div>
                )}
            </div>

            <ExcelImporter
                isOpen={showImporter}
                onClose={() => setShowImporter(false)}
                onImport={handleImport}
            />
        </div>
    );
}