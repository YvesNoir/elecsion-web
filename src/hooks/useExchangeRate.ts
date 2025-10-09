'use client';

import { useState, useEffect } from 'react';

interface ExchangeRate {
    currency: string;
    buy: number;
    sell: number;
    lastUpdated: string;
}

export function useExchangeRate() {
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/exchange-rate');
                const data: ExchangeRate = await response.json();
                setExchangeRate(data.sell); // Usar precio de venta
            } catch (error) {
                console.error('Error fetching exchange rate:', error);
                // Usar cotización de respaldo
                setExchangeRate(1474.50);
            } finally {
                setLoading(false);
            }
        };

        fetchExchangeRate();
    }, []);

    // Función para convertir precio a ARS
    const convertToARS = (price: number, currency: string): number => {
        if (currency?.toUpperCase() === 'USD') {
            // Si no tenemos el tipo de cambio aún, usar la cotización de respaldo
            const rate = exchangeRate || 1474.50;
            return price * rate;
        }
        return price;
    };

    // Función para obtener el precio y moneda en ARS para el carrito
    const getCartPrice = (price: number, currency: string): { price: number; currency: string } => {
        return {
            price: convertToARS(price, currency),
            currency: 'ARS'
        };
    };

    return {
        exchangeRate,
        loading,
        convertToARS,
        getCartPrice
    };
}