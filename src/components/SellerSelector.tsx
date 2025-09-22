"use client";

import { useState, useEffect } from "react";

interface Seller {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface SellerSelectorProps {
    userId: string;
    currentSeller?: {
        name: string;
        email: string;
    } | null;
    onSellerAssigned: () => void;
}

export default function SellerSelector({ userId, currentSeller, onSellerAssigned }: SellerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    const fetchSellers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users/sellers');
            if (response.ok) {
                const data = await response.json();
                setSellers(data);
            }
        } catch (error) {
            console.error('Error fetching sellers:', error);
        } finally {
            setLoading(false);
        }
    };

    const assignSeller = async (sellerId: string | null) => {
        setUpdating(true);
        try {
            const response = await fetch(`/api/users/${userId}/assign-seller`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assignedSellerId: sellerId
                })
            });

            if (response.ok) {
                onSellerAssigned();
                setIsOpen(false);
            } else {
                const error = await response.json();
                alert(error.error || 'Error al asignar vendedor');
            }
        } catch (error) {
            console.error('Error assigning seller:', error);
            alert('Error al asignar vendedor');
        } finally {
            setUpdating(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchSellers();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.seller-dropdown')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative seller-dropdown">
            <button
                onClick={handleOpen}
                className="text-sm hover:bg-gray-50 rounded px-2 py-1 transition-colors text-left w-full flex items-center justify-between"
                disabled={updating}
            >
                {currentSeller ? (
                    <div className="flex-1">
                        <div className="font-medium text-[#1C1C1C]">
                            {currentSeller.name}
                        </div>
                        <div className="text-xs text-[#646464]">
                            {currentSeller.email}
                        </div>
                    </div>
                ) : (
                    <span className="text-[#646464] flex-1">Asignar vendedor</span>
                )}
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-120 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{width: '120%'}}>
                    {loading ? (
                        <div className="p-3 text-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#384A93] mx-auto"></div>
                            <p className="text-xs text-gray-500 mt-1">Cargando...</p>
                        </div>
                    ) : (
                        <>
                            {/* Opción para remover vendedor */}
                            {currentSeller && (
                                <button
                                    onClick={() => assignSeller(null)}
                                    disabled={updating}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 disabled:opacity-50"
                                >
                                    <div className="text-xs text-red-600 font-medium">Sin vendedor asignado</div>
                                </button>
                            )}

                            {/* Lista de vendedores */}
                            {sellers.map((seller) => (
                                <button
                                    key={seller.id}
                                    onClick={() => assignSeller(seller.id)}
                                    disabled={updating}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900">
                                                {seller.name || 'Sin nombre'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {seller.email}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-1.5 py-0.5 rounded text-xs font-medium ${
                                            seller.role === 'ADMIN' 
                                                ? 'bg-red-100 text-red-800' 
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {seller.role === 'ADMIN' ? 'Admin' : 'Vendedor'}
                                        </span>
                                    </div>
                                </button>
                            ))}

                            {sellers.length === 0 && !loading && (
                                <div className="p-3 text-center text-gray-500 text-xs">
                                    No hay vendedores disponibles
                                </div>
                            )}
                        </>
                    )}

                    {updating && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#384A93]"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}