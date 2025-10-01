"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "@/store/cart";
import ProductSearchTable from "./ProductSearchTable";
import ClientSelector from "./ClientSelector";
import CartSummary from "./CartSummary";

type Client = {
    id: string;
    name: string | null;
    email: string;
    company: string | null;
};

type Brand = {
    id: string;
    name: string;
    slug: string;
    _count: {
        products: number;
    };
};

type Product = {
    id: string;
    sku: string | null;
    name: string;
    priceBase: number;
    currency: string;
    stockQty: number | null;
    unit: string | null;
    brand?: {
        name: string;
    } | null;
};

type PedidoRapidoClientProps = {
    userRole: string;
    userId: string;
};

export default function PedidoRapidoClient({ userRole, userId }: PedidoRapidoClientProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [products, setProducts] = useState<Product[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const cart = useCart();

    // Obtener clientes según rol
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch("/api/clients");
                const data = await response.json();

                if (data.clients) {
                    setClients(data.clients);

                    // Si es CLIENT, preseleccionar automáticamente
                    if (userRole === "CLIENT" && data.clients.length > 0) {
                        setSelectedClientId(data.clients[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };

        fetchClients();
    }, [userRole]);

    // Obtener marcas
    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await fetch("/api/brands");
                const data = await response.json();

                if (data.brands) {
                    setBrands(data.brands);
                }
            } catch (error) {
                console.error("Error fetching brands:", error);
            }
        };

        fetchBrands();
    }, []);

    // Obtener productos con búsqueda
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Construir la URL con los parámetros
                const params = new URLSearchParams();
                params.set('limit', '50');

                if (searchTerm) {
                    params.set('q', searchTerm);
                }

                if (selectedBrandId) {
                    params.set('brand', selectedBrandId);
                }

                const url = searchTerm
                    ? `/api/products/search?${params.toString()}`
                    : `/api/products?${params.toString()}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.products) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedBrandId]);

    const selectedClient = useMemo(() => {
        return clients.find(client => client.id === selectedClientId) || null;
    }, [clients, selectedClientId]);


    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Columna izquierda: Productos */}
            <div className="col-span-12 lg:col-span-8">
                <div className="bg-white md:rounded-lg md:border md:border-[#E5E5E5] overflow-hidden">
                    <div className="md:p-4 md:border-b md:border-[#E5E5E5]">
                        <h2 className="text-lg font-medium text-[#1C1C1C] mb-3">Productos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Campo de búsqueda */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por SKU o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                />
                                <svg
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#646464]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Selector de marca */}
                            <div>
                                <select
                                    value={selectedBrandId}
                                    onChange={(e) => setSelectedBrandId(e.target.value)}
                                    className="w-full px-4 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent bg-white"
                                >
                                    <option value="">Todas las marcas</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name} ({brand._count.products})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <ProductSearchTable
                        products={products}
                        loading={loading}
                        selectedClientId={selectedClientId}
                    />
                </div>
            </div>

            {/* Columna derecha: Cliente y Carrito */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* Selector de cliente */}
                <ClientSelector
                    clients={clients}
                    selectedClientId={selectedClientId}
                    onClientChange={setSelectedClientId}
                    userRole={userRole}
                />

                {/* Carrito */}
                <CartSummary selectedClientId={selectedClientId} />
            </div>
        </div>
    );
}