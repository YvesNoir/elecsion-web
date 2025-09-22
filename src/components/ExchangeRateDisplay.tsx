"use client";

import { useState, useEffect } from 'react';

interface ExchangeRate {
    currency: string;
    buy: number;
    sell: number;
    lastUpdated: string;
}

export default function ExchangeRateDisplay() {
    const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchExchangeRate = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/exchange-rate');
            
            if (!response.ok) {
                throw new Error('Error al obtener la cotización');
            }
            
            const data = await response.json();
            setExchangeRate(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching exchange rate:', err);
            setError('Error al cargar cotización');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchangeRate();
        
        // Actualizar cada 5 minutos
        const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-[#646464]">
                <div className="w-3 h-3 border border-gray-300 border-t-[#384A93] rounded-full animate-spin"></div>
                <span>USD</span>
            </div>
        );
    }

    if (error || !exchangeRate) {
        return (
            <div className="flex items-center gap-2 text-sm text-[#646464]">
                <span>💱</span>
                <span>USD: --</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-[#646464]">💱</span>
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                    <span className="text-[#646464]">USD:</span>
                    <span className="font-medium text-[#1C1C1C]">
                        ${exchangeRate.sell.toLocaleString('es-AR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        })}
                    </span>
                </div>
                <div className="text-xs text-[#646464] leading-none">
                    BNA Venta
                </div>
            </div>
        </div>
    );
}