"use client";

import { useState } from 'react';

type ProductStatusSelectProps = {
    productId: string;
    productName: string;
    currentStatus: boolean;
    onStatusChange: (productId: string, newStatus: boolean) => void;
};

export default function ProductStatusSelect({ 
    productId, 
    productName, 
    currentStatus, 
    onStatusChange 
}: ProductStatusSelectProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: boolean) => {
        if (isUpdating || newStatus === currentStatus) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/productos/${productId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: newStatus }),
            });

            const result = await response.json();

            if (result.success) {
                onStatusChange(productId, newStatus);
            } else {
                alert(`Error al actualizar el estado: ${result.error}`);
                console.error('Error:', result.error);
            }
        } catch (error) {
            console.error('Error updating product status:', error);
            alert('Error al actualizar el estado del producto');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <select
            value={currentStatus ? 'active' : 'inactive'}
            onChange={(e) => handleStatusChange(e.target.value === 'active')}
            disabled={isUpdating}
            className={`
                inline-flex px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:ring-offset-1
                ${currentStatus 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={`Cambiar estado de "${productName}"`}
        >
            <option value="active" className="bg-white text-green-800">
                Activo
            </option>
            <option value="inactive" className="bg-white text-red-800">
                Inactivo
            </option>
        </select>
    );
}