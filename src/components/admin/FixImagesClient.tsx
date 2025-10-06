"use client";

import React, { useState, useEffect } from "react";
import ImageUploader from "@/components/ImageUploader";

type Product = {
    id: string;
    sku: string | null;
    name: string;
    brand?: {
        name: string;
    } | null;
};

type MissingImagesData = {
    success: boolean;
    totalProducts: number;
    productsWithImages: number;
    productsWithoutImages: number;
    products: Product[];
};

export default function FixImagesClient() {
    const [data, setData] = useState<MissingImagesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showUploader, setShowUploader] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/products/missing-images");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error cargando datos");
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUploadSuccess = () => {
        setShowUploader(false);
        setSelectedProduct(null);
        // Recargar datos para actualizar el conteo
        fetchData();
    };

    const openUploader = (product: Product) => {
        setSelectedProduct(product);
        setShowUploader(true);
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#384A93] mx-auto"></div>
                <p className="text-[#646464] mt-2">Cargando productos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">❌ {error}</div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center text-[#646464]">
                No se pudieron cargar los datos
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estadísticas */}
            <div className="bg-white border border-[#E5E5E5] p-6">
                <h2 className="text-lg font-medium text-[#1C1C1C] mb-4">
                    Estadísticas de Imágenes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50">
                        <div className="text-2xl font-bold text-blue-600">
                            {data.totalProducts}
                        </div>
                        <div className="text-sm text-blue-600">
                            Total Productos
                        </div>
                    </div>
                    <div className="text-center p-4 bg-green-50">
                        <div className="text-2xl font-bold text-green-600">
                            {data.productsWithImages}
                        </div>
                        <div className="text-sm text-green-600">
                            Con Imágenes
                        </div>
                    </div>
                    <div className="text-center p-4 bg-red-50">
                        <div className="text-2xl font-bold text-red-600">
                            {data.productsWithoutImages}
                        </div>
                        <div className="text-sm text-red-600">
                            Sin Imágenes
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de productos sin imágenes */}
            <div className="bg-white border border-[#E5E5E5] overflow-hidden">
                <div className="p-4 border-b border-[#E5E5E5]">
                    <h2 className="text-lg font-medium text-[#1C1C1C]">
                        Productos sin Imágenes ({data.productsWithoutImages})
                    </h2>
                </div>

                {data.products.length === 0 ? (
                    <div className="p-8 text-center text-green-600">
                        🎉 ¡Excelente! Todos los productos tienen imágenes.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                        Marca
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-[#646464] uppercase tracking-wider">
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E5]">
                                {data.products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">
                                            {product.sku || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#1C1C1C]">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#646464]">
                                            {product.brand?.name || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => openUploader(product)}
                                                disabled={!product.sku}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded bg-[#384A93] text-white hover:bg-[#2e3d7a] disabled:bg-[#B5B5B5] disabled:cursor-not-allowed transition-colors"
                                            >
                                                Subir Imagen
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal del uploader */}
            {showUploader && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E5E5E5]">
                        <div className="p-4 border-b border-[#E5E5E5]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-[#1C1C1C]">
                                    Subir Imagen
                                </h3>
                                <button
                                    onClick={() => setShowUploader(false)}
                                    className="text-[#646464] hover:text-[#1C1C1C] transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="mt-2 text-sm text-[#646464]">
                                <div><strong>SKU:</strong> {selectedProduct.sku}</div>
                                <div><strong>Producto:</strong> {selectedProduct.name}</div>
                                {selectedProduct.brand && (
                                    <div><strong>Marca:</strong> {selectedProduct.brand.name}</div>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <ImageUploader
                                productSku={selectedProduct.sku!}
                                onUploadSuccess={handleUploadSuccess}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}