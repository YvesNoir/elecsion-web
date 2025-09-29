"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
    id: string;
    sku: string;
    name: string;
    priceBase: number;
    stockQty: number;
    unit: string;
    brand?: {
        name: string;
    };
};

type Client = {
    id: string;
    name: string;
    email: string;
    company: string;
};

type CartItem = {
    productId: string;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    stock: number;
};

export default function PedidoRapidoPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Estados principales
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 50;

    // Cargar datos iniciales
    useEffect(() => {
        const loadData = async () => {
            try {
                const [productsRes, clientsRes] = await Promise.all([
                    fetch("/api/productos/all", {
                        credentials: 'include'
                    }),
                    fetch("/api/users/all?role=CLIENT&active=true", {
                        credentials: 'include'
                    })
                ]);

                const productsData = await productsRes.json();
                const clientsData = await clientsRes.json();

                setProducts(productsData.productos || []);
                setClients(clientsData.users || []);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Filtrar productos por búsqueda
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        
        const term = searchTerm.toLowerCase();
        return products.filter(product => 
            product.sku?.toLowerCase().includes(term) ||
            product.name.toLowerCase().includes(term)
        );
    }, [products, searchTerm]);

    // Resetear página cuando cambia la búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Calcular productos paginados
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return filteredProducts.slice(startIndex, startIndex + productsPerPage);
    }, [filteredProducts, currentPage, productsPerPage]);

    // Calcular número total de páginas
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    // Funciones del carrito
    const addToCart = (product: Product, quantity: number) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.productId === product.id);
            
            if (existingItem) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...prev, {
                productId: product.id,
                sku: product.sku || "",
                name: product.name,
                price: Number(product.priceBase),
                quantity: quantity,
                unit: product.unit || "",
                stock: Number(product.stockQty || 0)
            }];
        });
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prev => prev.filter(item => item.productId !== productId));
        } else {
            setCart(prev => prev.map(item =>
                item.productId === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const clearCart = () => {
        setCart([]);
    };

    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Por ahora sin impuestos

    // Enviar pedido
    const submitOrder = async () => {
        if (!selectedClient || cart.length === 0) {
            alert("Debe seleccionar un cliente y agregar productos al pedido");
            return;
        }

        setSubmitting(true);
        try {
            const orderData = {
                clientUserId: selectedClient,
                type: "ORDER",
                items: cart.map(item => ({
                    productId: item.productId,
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.price,
                    subtotal: item.price * item.quantity,
                    total: item.price * item.quantity
                })),
                subtotal: subtotal,
                total: total
            };

            const response = await fetch("/api/orders/quick", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Pedido creado exitosamente. Código: ${result.order.code}`);
                clearCart();
                setSelectedClient("");
            } else {
                throw new Error("Error al crear el pedido");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error al crear el pedido. Intente nuevamente.");
        } finally {
            setSubmitting(false);
        }
    };

    // Verificar autenticación y permisos después de todos los hooks
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4"></div>
                    <p className="text-[#646464]">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role as string)) {
        router.push("/");
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4"></div>
                    <p className="text-[#646464]">Cargando productos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1C1C1C]">Pedido Rápido</h1>
                        <p className="text-[#646464] mt-1">Crear pedidos para clientes de forma rápida</p>
                    </div>
                    <Link
                        href="/"
                        className="text-[#384A93] hover:underline text-sm self-start sm:self-auto"
                    >
                        ← Volver al inicio
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Panel principal - Lista de productos */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        {/* Header de productos */}
                        <div className="px-4 md:px-6 py-4 border-b border-[#B5B5B5]/40 bg-[#F5F5F7]">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <h2 className="text-lg font-semibold text-[#1C1C1C]">Productos</h2>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Buscar por SKU o descripción..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#B5B5B5]/40 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm"
                                    />
                                </div>
                                <div className="text-sm text-[#646464] whitespace-nowrap">
                                    {filteredProducts.length} productos
                                    {totalPages > 1 && (
                                        <span className="ml-2">
                                            • Página {currentPage} de {totalPages}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabla de productos - Desktop/Tablet */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FA] text-xs md:text-sm">
                                    <tr>
                                        <th className="px-3 md:px-4 py-3 text-left font-medium text-[#646464]">SKU</th>
                                        <th className="px-3 md:px-4 py-3 text-left font-medium text-[#646464]">Descripción</th>
                                        <th className="px-3 md:px-4 py-3 text-center font-medium text-[#646464]">Stock</th>
                                        <th className="px-3 md:px-4 py-3 text-right font-medium text-[#646464]">Precio</th>
                                        <th className="px-3 md:px-4 py-3 text-center font-medium text-[#646464]">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs md:text-sm">
                                    {paginatedProducts.map((product) => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            onAddToCart={addToCart}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards de productos - Mobile */}
                        <div className="md:hidden space-y-3">
                            {paginatedProducts.map((product) => (
                                <ProductRowMobile
                                    key={product.id}
                                    product={product}
                                    onAddToCart={addToCart}
                                />
                            ))}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 p-4 border-t border-[#B5B5B5]/40">
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

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-[#646464]">
                                    {searchTerm ? "No se encontraron productos" : "No hay productos disponibles"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel lateral - Cliente y carrito */}
                <div className="xl:col-span-1">
                    <div className="space-y-6">
                        {/* Selector de cliente */}
                        <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-4 md:p-6">
                            <h3 className="text-lg font-semibold text-[#1C1C1C] mb-4">Cliente</h3>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full px-3 py-2 border border-[#B5B5B5]/40 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent text-sm"
                            >
                                <option value="">Seleccionar cliente...</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.company} - {client.name} ({client.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Resumen del carrito */}
                        <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#1C1C1C]">
                                    Carrito ({cart.length})
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <p className="text-[#646464] text-sm">No hay productos en el carrito</p>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                        {cart.map((item) => (
                                            <div key={item.productId} className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded text-xs">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.sku}</p>
                                                    <p className="text-[#646464] text-xs truncate">{item.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-[#E5E5E5] hover:bg-[#D5D5D5] rounded text-xs"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-xs">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-[#E5E5E5] hover:bg-[#D5D5D5] rounded text-xs"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">${(item.price * item.quantity).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                                    {item.quantity > item.stock && (
                                                        <p className="text-orange-600 text-xs">Sin stock</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold">Subtotal:</span>
                                            <span className="font-semibold">${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-bold text-lg">Total:</span>
                                            <span className="font-bold text-lg">${total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>

                                        <button
                                            onClick={submitOrder}
                                            disabled={!selectedClient || cart.length === 0 || submitting}
                                            className="w-full bg-[#384A93] text-white py-2 px-4 rounded-md hover:bg-[#2A3A7A] disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            {submitting ? "Creando..." : "Crear Pedido"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente para cada fila de producto
function ProductRow({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product, quantity: number) => void }) {
    const [quantity, setQuantity] = useState(1);
    const stock = Number(product.stockQty || 0);
    const hasStock = stock > 0;

    const handleAdd = () => {
        if (quantity > 0) {
            onAddToCart(product, quantity);
            setQuantity(1);
        }
    };

    return (
        <tr className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
            <td className="px-3 md:px-4 py-3">
                <span className="font-medium text-[#1C1C1C]">{product.sku}</span>
            </td>
            <td className="px-3 md:px-4 py-3">
                <div>
                    <p className="font-medium text-[#1C1C1C] text-xs md:text-sm">{product.name}</p>
                    {product.brand && (
                        <p className="text-[#646464] text-xs">{product.brand.name}</p>
                    )}
                </div>
            </td>
            <td className="px-3 md:px-4 py-3 text-center">
                <span className={`text-xs md:text-sm ${hasStock ? "text-green-600" : "text-orange-600"}`}>
                    {stock} {product.unit}
                </span>
                {!hasStock && (
                    <p className="text-orange-600 text-xs">Sin stock</p>
                )}
            </td>
            <td className="px-3 md:px-4 py-3 text-right">
                <span className="font-medium text-[#1C1C1C]">
                    ${Number(product.priceBase).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
            </td>
            <td className="px-3 md:px-4 py-3">
                <div className="flex items-center gap-1 md:gap-2 justify-center">
                    <div className="inline-flex items-center rounded-full border border-[#e1e8f4] bg-[#e1e8f4] overflow-hidden">
                        <button 
                            type="button" 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                            className="h-7 w-7 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors" 
                            aria-label="Restar"
                        >
                            –
                        </button>
                        <div className="h-7 min-w-[2.25rem] px-1 text-center text-sm leading-7 text-[#384A93] font-medium">
                            {quantity}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setQuantity(quantity + 1)} 
                            className="h-7 w-7 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors" 
                            aria-label="Sumar"
                        >
                            +
                        </button>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="ml-1 bg-[#384A93] text-white px-2 md:px-3 py-1 rounded-md text-xs font-medium hover:bg-[#2e3d7a] transition-colors"
                    >
                        +
                    </button>
                </div>
            </td>
        </tr>
    );
}

// Componente optimizado para mobile
function ProductRowMobile({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product, quantity: number) => void }) {
    const [quantity, setQuantity] = useState(1);
    const stock = Number(product.stockQty || 0);
    const hasStock = stock > 0;

    const handleAdd = () => {
        if (quantity > 0) {
            onAddToCart(product, quantity);
            setQuantity(1);
        }
    };

    return (
        <div className="bg-white border border-[#E5E5E5] rounded-lg p-4 shadow-sm">
            {/* Header con info del producto y stock */}
            <div className="flex justify-between items-start mb-3">
                {/* Info del producto en una línea */}
                <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1C1C1C] text-sm">{product.sku}</span>
                        <span className="text-[#646464] text-xs">•</span>
                        <h3 className="font-medium text-[#1C1C1C] text-sm truncate">{product.name}</h3>
                        {product.brand && (
                            <>
                                <span className="text-[#646464] text-xs">•</span>
                                <span className="text-[#646464] text-xs">{product.brand.name}</span>
                            </>
                        )}
                    </div>
                </div>
                {/* Stock */}
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${hasStock ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {stock} {product.unit}
                </span>
            </div>

            {/* Precio y Cantidad */}
            <div className="flex justify-between items-end">
                {/* Precio */}
                <div>
                    <span className="text-[#646464] text-xs">Precio:</span>
                    <div className="font-semibold text-[#1C1C1C]">
                        ${Number(product.priceBase).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-[#e1e8f4] bg-[#e1e8f4] overflow-hidden">
                        <button 
                            type="button" 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                            className="h-8 w-8 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors" 
                            aria-label="Restar"
                        >
                            –
                        </button>
                        <div className="h-8 min-w-[2.5rem] px-2 text-center text-sm leading-8 text-[#384A93] font-medium">
                            {quantity}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setQuantity(quantity + 1)} 
                            className="h-8 w-8 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors" 
                            aria-label="Sumar"
                        >
                            +
                        </button>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="bg-[#384A93] text-white h-8 w-8 rounded-full text-sm font-medium hover:bg-[#2e3d7a] transition-colors flex items-center justify-center"
                        aria-label="Agregar al carrito"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}