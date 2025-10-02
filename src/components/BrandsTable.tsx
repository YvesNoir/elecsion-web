"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import BrandStatusSelect from './BrandStatusSelect';

type Brand = {
    id: string;
    name: string;
    slug: string;
    code: number | null;
    createdAt: string;
    productCount: number;
    isActive: boolean;
};

type BrandsTableProps = {
    brands: Brand[];
};

export default function BrandsTable({ brands }: BrandsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'productCount' | 'createdAt'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [localBrands, setLocalBrands] = useState(brands);
    const [showInactive, setShowInactive] = useState(false);

    const handleStatusChange = (brandId: string, newStatus: boolean) => {
        setLocalBrands(prevBrands =>
            prevBrands.map(brand =>
                brand.id === brandId
                    ? { ...brand, isActive: newStatus }
                    : brand
            )
        );
    };

    const filteredAndSortedBrands = useMemo(() => {
        let filtered = localBrands.filter(brand => {
            // Filtro por texto
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = (
                brand.name.toLowerCase().includes(term) ||
                brand.slug.toLowerCase().includes(term) ||
                (brand.code?.toString().includes(term))
            );

            // Filtro por estado (solo mostrar inactivas si el toggle está activado)
            const matchesStatus = showInactive ? !brand.isActive : brand.isActive;

            return matchesSearch && matchesStatus;
        });

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'productCount':
                    aValue = a.productCount;
                    bValue = b.productCount;
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [localBrands, searchTerm, sortBy, sortOrder, showInactive]);

    const handleSort = (column: 'name' | 'productCount' | 'createdAt') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (column: 'name' | 'productCount' | 'createdAt') => {
        if (sortBy !== column) return '↕️';
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    // Calcular estadísticas basadas en el filtro actual
    const activeBrands = localBrands.filter(brand => brand.isActive);
    const inactiveBrands = localBrands.filter(brand => !brand.isActive);
    const currentFilteredBrands = showInactive ? inactiveBrands : activeBrands;
    const totalProducts = currentFilteredBrands.reduce((sum, brand) => sum + brand.productCount, 0);

    return (
        <div className="space-y-4">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#384A93]">{currentFilteredBrands.length}</div>
                    <div className="text-sm text-[#646464]">
                        {showInactive ? 'Marcas inactivas' : 'Marcas activas'}
                    </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{totalProducts}</div>
                    <div className="text-sm text-[#646464]">Total de productos</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                        {currentFilteredBrands.length > 0 ? Math.round(totalProducts / currentFilteredBrands.length) : 0}
                    </div>
                    <div className="text-sm text-[#646464]">Promedio por marca</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-4 items-center flex-1">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar marcas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#384A93] focus:border-[#384A93]"
                        />
                    </div>
                    <label className="flex items-center space-x-2 text-sm text-gray-700 whitespace-nowrap">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 text-[#384A93] border-gray-300 rounded focus:ring-[#384A93]"
                        />
                        <span>Mostrar inactivas</span>
                    </label>
                </div>
                <div className="text-sm text-[#646464]">
                    Mostrando {filteredAndSortedBrands.length} de {currentFilteredBrands.length} marcas {showInactive ? '(inactivas)' : '(activas)'}
                </div>
            </div>

            {/* Vista móvil - Tarjetas */}
            <div className="md:hidden space-y-3">
                {filteredAndSortedBrands.map((brand) => (
                    <div key={brand.id} className="bg-white border border-[#E5E5E5] rounded-lg p-4">
                        {/* Header: Código + Estado */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm font-medium text-[#646464]">
                                {brand.code || '—'}
                            </div>
                            <BrandStatusSelect
                                brandId={brand.id}
                                brandName={brand.name}
                                currentStatus={brand.isActive}
                                onStatusChange={handleStatusChange}
                            />
                        </div>

                        {/* Nombre de la marca + Slug */}
                        <div className="mb-4">
                            <div className="text-lg font-medium text-[#1C1C1C] mb-1">
                                {brand.name}
                            </div>
                            <div className="text-sm text-[#646464]">
                                /{brand.slug}
                            </div>
                        </div>

                        {/* Footer: Productos + Fecha creación + Acciones */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    brand.productCount === 0
                                        ? 'bg-red-100 text-red-800'
                                        : brand.productCount < 10
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {brand.productCount} productos
                                </span>
                                <span className="text-[#646464]">
                                    {new Date(brand.createdAt).toLocaleDateString('es-AR')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {brand.productCount > 0 && (
                                    <Link
                                        href={`/mi-cuenta/productos?marca=${brand.slug}`}
                                        className="text-xs text-[#384A93] hover:underline"
                                    >
                                        Ver productos
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredAndSortedBrands.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron marcas que coincidan con la búsqueda.
                    </div>
                )}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                                <button
                                    onClick={() => handleSort('name')}
                                    className="flex items-center space-x-1 hover:text-[#384A93]"
                                >
                                    <span>Marca</span>
                                    <span className="text-gray-400">{getSortIcon('name')}</span>
                                </button>
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                                Código
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                                <button
                                    onClick={() => handleSort('productCount')}
                                    className="flex items-center space-x-1 hover:text-[#384A93]"
                                >
                                    <span>Productos</span>
                                    <span className="text-gray-400">{getSortIcon('productCount')}</span>
                                </button>
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                                <button
                                    onClick={() => handleSort('createdAt')}
                                    className="flex items-center space-x-1 hover:text-[#384A93]"
                                >
                                    <span>Creada</span>
                                    <span className="text-gray-400">{getSortIcon('createdAt')}</span>
                                </button>
                            </th>
                            <th className="text-center py-3 px-2 font-medium text-gray-700">
                                Estado
                            </th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedBrands.map((brand, index) => (
                            <tr
                                key={brand.id}
                                className={`border-b border-gray-100 hover:bg-gray-50 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                            >
                                <td className="py-3 px-2">
                                    <div>
                                        <div className="font-medium text-gray-900">{brand.name}</div>
                                        <div className="text-sm text-gray-500">/{brand.slug}</div>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-gray-700">
                                    {brand.code || '-'}
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            brand.productCount === 0
                                                ? 'bg-red-100 text-red-800'
                                                : brand.productCount < 10
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {brand.productCount}
                                        </span>
                                        {brand.productCount > 0 && (
                                            <Link
                                                href={`/mi-cuenta/productos?marca=${brand.slug}`}
                                                className="text-xs text-[#384A93] hover:underline"
                                            >
                                                Ver productos
                                            </Link>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-gray-700 text-sm">
                                    {new Date(brand.createdAt).toLocaleDateString('es-AR')}
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <BrandStatusSelect
                                        brandId={brand.id}
                                        brandName={brand.name}
                                        currentStatus={brand.isActive}
                                        onStatusChange={handleStatusChange}
                                    />
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex items-center space-x-2">
                                        <Link
                                            href={`/catalogo?brand=${brand.slug}`}
                                            className="text-xs text-[#384A93] hover:underline"
                                        >
                                            Ver catálogo
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredAndSortedBrands.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron marcas que coincidan con la búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
}