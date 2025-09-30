"use client";

import { useState } from 'react';

type BrandStatusSelectProps = {
    brandId: string;
    brandName: string;
    currentStatus: boolean;
    onStatusChange: (brandId: string, newStatus: boolean) => void;
};

export default function BrandStatusSelect({
    brandId,
    brandName,
    currentStatus,
    onStatusChange
}: BrandStatusSelectProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusChange = async (newStatus: boolean) => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/marcas/${brandId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: newStatus }),
            });

            const result = await response.json();

            if (result.success) {
                onStatusChange(brandId, newStatus);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error actualizando estado de marca:', error);
            alert('Error actualizando el estado de la marca');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <select
            value={currentStatus ? 'active' : 'inactive'}
            onChange={(e) => handleStatusChange(e.target.value === 'active')}
            disabled={isLoading}
            className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:outline-none focus:ring-2 focus:ring-[#384A93] ${
                currentStatus
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={`${brandName} - Cambiar estado`}
        >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
        </select>
    );
}