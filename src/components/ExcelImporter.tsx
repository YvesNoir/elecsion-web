"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

type ExcelRow = {
    codigo: string | number;
    descripcion: string;
    familia: string;
    price: number;
    stock: number;
    iva: number;
};

type ExcelImporterProps = {
    onImport: (data: ExcelRow[]) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
};

export default function ExcelImporter({ onImport, isOpen, onClose }: ExcelImporterProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processExcelFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convertir a JSON manteniendo la primera fila como encabezados
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                alert('El archivo debe tener al menos una fila de datos además de los encabezados.');
                return;
            }

            // Mapear los datos basándose en la estructura conocida
            const mappedData: ExcelRow[] = [];
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i] as any[];
                
                // Saltar filas vacías
                if (!row || row.length === 0 || !row[0]) continue;
                
                mappedData.push({
                    codigo: row[0], // Código
                    descripcion: row[1] || '', // Descripción
                    familia: row[5] || '', // Familia
                    price: parseFloat(row[4]) || 0, // Price
                    stock: parseFloat(row[9]) || 0, // Stock
                    iva: parseFloat(row[6]) || 21, // IVA (por defecto 21%)
                });
            }

            setPreviewData(mappedData);
            setShowPreview(true);
        } catch (error) {
            console.error('Error procesando archivo Excel:', error);
            alert('Error al procesar el archivo Excel. Asegúrate de que sea un archivo válido.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileSelect = (file: File) => {
        if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
            file.type !== 'application/vnd.ms-excel') {
            alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
            return;
        }
        processExcelFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleImportConfirm = async () => {
        try {
            setIsProcessing(true);
            await onImport(previewData);
            setShowPreview(false);
            setPreviewData([]);
            onClose();
        } catch (error) {
            console.error('Error importando datos:', error);
            alert('Error al importar los datos. Inténtalo nuevamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {showPreview ? 'Confirmar Importación' : 'Importar Productos desde Excel'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {!showPreview ? (
                        <div className="space-y-4">
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                                    isDragOver 
                                        ? 'border-[#384A93] bg-[#384A93]/5' 
                                        : 'border-gray-300 hover:border-[#384A93]'
                                } transition-colors`}
                                onDrop={handleDrop}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                            >
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    {isProcessing ? 'Procesando archivo...' : 'Arrastra tu archivo Excel aquí'}
                                </p>
                                <p className="text-gray-500 mb-4">o</p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white text-sm font-medium rounded-lg hover:bg-[#2e3d7a] disabled:opacity-50 transition-colors"
                                >
                                    Seleccionar archivo
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                    className="hidden"
                                />
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Mapeo de columnas:</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• <strong>Código</strong> → SKU del producto</li>
                                    <li>• <strong>Descripción</strong> → Nombre del producto</li>
                                    <li>• <strong>Familia</strong> → Marca del producto</li>
                                    <li>• <strong>Price</strong> → Precio base</li>
                                    <li>• <strong>Stock</strong> → Cantidad en stock</li>
                                    <li>• <strong>IVA</strong> → Porcentaje de IVA (21%, 10.5%, etc.)</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800">
                                    Se encontraron <strong>{previewData.length}</strong> productos para importar.
                                </p>
                            </div>

                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">SKU</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">Producto</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">Marca</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-900">Precio</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-900">Stock</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-900">IVA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 10).map((row, index) => (
                                            <tr key={index} className="border-b border-gray-100">
                                                <td className="px-4 py-3 font-mono">{row.codigo}</td>
                                                <td className="px-4 py-3">{row.descripcion}</td>
                                                <td className="px-4 py-3">{row.familia}</td>
                                                <td className="px-4 py-3 text-right font-mono">${row.price.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                                <td className="px-4 py-3 text-right font-mono">{row.stock}</td>
                                                <td className="px-4 py-3 text-center font-mono">{row.iva}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        ... y {previewData.length - 10} productos más
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Volver
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImportConfirm}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-[#384A93] text-white rounded-lg hover:bg-[#2e3d7a] disabled:opacity-50 transition-colors"
                                >
                                    {isProcessing ? 'Importando...' : 'Confirmar Importación'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}