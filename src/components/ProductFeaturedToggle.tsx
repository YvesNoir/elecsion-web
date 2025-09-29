"use client";

import { useState } from 'react';

type ProductFeaturedToggleProps = {
    productId: string;
    productName: string;
    currentFeatured: boolean;
    onFeaturedChange: (productId: string, newFeatured: boolean) => void;
};

export default function ProductFeaturedToggle({ 
    productId, 
    productName, 
    currentFeatured, 
    onFeaturedChange 
}: ProductFeaturedToggleProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        
        try {
            const response = await fetch(`/api/productos/${productId}/featured`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ featured: !currentFeatured }),
            });

            if (response.ok) {
                onFeaturedChange(productId, !currentFeatured);
            } else {
                throw new Error('Error al actualizar producto destacado');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al actualizar el estado destacado del producto');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center">
            <input
                type="checkbox"
                checked={currentFeatured}
                onChange={handleToggle}
                disabled={isLoading}
                className="w-4 h-4 text-[#384A93] bg-gray-100 border-gray-300 rounded focus:ring-[#384A93] focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                title={`${currentFeatured ? 'Quitar' : 'Marcar'} como destacado: ${productName}`}
            />
        </div>
    );
}