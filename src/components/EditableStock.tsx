"use client";

import { useState, useRef, useEffect } from 'react';

type EditableStockProps = {
    productId: string;
    productName: string;
    currentStock: number;
    onStockChange: (productId: string, newStock: number) => void;
};

export default function EditableStock({ 
    productId, 
    productName, 
    currentStock, 
    onStockChange 
}: EditableStockProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [stockValue, setStockValue] = useState(currentStock.toString());
    const [isUpdating, setIsUpdating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Actualizar valor cuando cambie el stock desde afuera
    useEffect(() => {
        setStockValue(currentStock.toString());
    }, [currentStock]);

    // Enfocar input cuando se activa la edición
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleClick = () => {
        if (!isEditing && !isUpdating) {
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setStockValue(currentStock.toString());
        setIsEditing(false);
    };

    const handleSave = async () => {
        const newStock = parseFloat(stockValue);
        
        // Validar que sea un número válido
        if (isNaN(newStock) || newStock < 0) {
            alert('Por favor ingresa un número válido mayor o igual a 0');
            setStockValue(currentStock.toString());
            return;
        }

        // Si no cambió el valor, cancelar
        if (newStock === currentStock) {
            setIsEditing(false);
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch(`/api/productos/${productId}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stockQty: newStock }),
            });

            const result = await response.json();

            if (result.success) {
                onStockChange(productId, newStock);
                setIsEditing(false);
            } else {
                alert(`Error al actualizar el stock: ${result.error}`);
                setStockValue(currentStock.toString());
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Error al actualizar el stock');
            setStockValue(currentStock.toString());
        } finally {
            setIsUpdating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        // No cerrar si el focus se mueve a uno de nuestros botones
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget && relatedTarget.dataset.editButton) {
            return;
        }
        // Solo guardar si no se está actualizando ya
        if (!isUpdating) {
            handleSave();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 flex-wrap">
                <input
                    ref={inputRef}
                    type="number"
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    disabled={isUpdating}
                    min="0"
                    step="1"
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#384A93] focus:border-[#384A93] text-center font-mono"
                />
                
                {/* Botones para mobile */}
                <div className="flex gap-1">
                    <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        data-edit-button="true"
                        className="inline-flex items-center p-1 text-xs text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        title="Guardar"
                    >
                        {isUpdating ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                    
                    <button
                        onClick={handleCancel}
                        disabled={isUpdating}
                        data-edit-button="true"
                        className="inline-flex items-center p-1 text-xs text-white bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        title="Cancelar"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="font-mono hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer text-right w-full"
            title={`Click para editar stock de "${productName}"`}
        >
            {currentStock.toLocaleString('es-AR')}
        </button>
    );
}