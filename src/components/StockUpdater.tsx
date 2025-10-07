"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

type StockRow = {
    codigo: string | number;
    descripcion: string;
    stock: number;
};

type UpdateResult = {
    sku: string;
    descripcion: string;
    oldStock: number;
    newStock: number;
    status: 'updated' | 'not_found' | 'error';
    error?: string;
};

type StockUpdaterProps = {
    onClose: () => void;
    onUpdateSuccess?: () => void;
};

export default function StockUpdater({ onClose, onUpdateSuccess }: StockUpdaterProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState<StockRow[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
    const [showResults, setShowResults] = useState(false);
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

            // Mapear los datos basándose en la estructura: Código, Descripción, Stock
            const mappedData: StockRow[] = [];

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i] as any[];

                // Saltar filas vacías
                if (!row || row.length === 0 || !row[0]) continue;

                const codigo = String(row[0]).trim();
                const descripcion = String(row[1] || '').trim();
                const stock = parseFloat(row[2]) || 0;

                if (codigo) {
                    mappedData.push({
                        codigo: codigo,
                        descripcion: descripcion,
                        stock: stock
                    });
                }
            }

            if (mappedData.length === 0) {
                alert('No se encontraron datos válidos en el archivo.');
                return;
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

    const handleUpdateConfirm = async () => {
        try {
            setIsProcessing(true);
            setIsUpdating(true);
            setUpdateProgress({ current: 0, total: previewData.length });

            // Procesar productos en lotes con progreso
            const batchSize = 50; // Mayor batch para stock ya que es más simple
            let allResults: UpdateResult[] = [];

            for (let i = 0; i < previewData.length; i += batchSize) {
                const batch = previewData.slice(i, i + batchSize);

                try {
                    const response = await fetch('/api/productos/update-stock', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ products: batch }),
                    });

                    const result = await response.json();

                    if (result.success && result.results.details) {
                        allResults = [...allResults, ...result.results.details];
                    } else {
                        // Si hay error, marcar todo el lote como error
                        batch.forEach(item => {
                            allResults.push({
                                sku: String(item.codigo),
                                descripcion: item.descripcion,
                                oldStock: 0,
                                newStock: item.stock,
                                status: 'error',
                                error: result.error || 'Error desconocido'
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error en lote:', error);
                    // Si hay error, marcar todo el lote como error
                    batch.forEach(item => {
                        allResults.push({
                            sku: String(item.codigo),
                            descripcion: item.descripcion,
                            oldStock: 0,
                            newStock: item.stock,
                            status: 'error',
                            error: 'Error de conexión'
                        });
                    });
                }

                // Actualizar progreso después de procesar el lote
                const processedCount = Math.min(i + batchSize, previewData.length);
                setUpdateProgress({ current: processedCount, total: previewData.length });

                // Pequeña pausa para que se vea el progreso
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Progreso final
            setUpdateProgress({ current: previewData.length, total: previewData.length });

            // Guardar resultados y mostrar resumen
            setUpdateResults(allResults);
            const updated = allResults.filter(r => r.status === 'updated').length;
            const notFound = allResults.filter(r => r.status === 'not_found').length;
            const errors = allResults.filter(r => r.status === 'error').length;

            setShowPreview(false);
            setShowResults(true);

            if (onUpdateSuccess) {
                onUpdateSuccess();
            }

        } catch (error) {
            console.error('Error actualizando stock:', error);
            alert('Error al actualizar el stock. Inténtalo nuevamente.');
        } finally {
            setIsProcessing(false);
            setIsUpdating(false);
        }
    };

    const resetComponent = () => {
        setShowPreview(false);
        setShowResults(false);
        setPreviewData([]);
        setUpdateResults([]);
        setUpdateProgress({ current: 0, total: 0 });
    };

    const handleClose = () => {
        resetComponent();
        onClose();
    };

    return (
        <div className="p-6">
                    {showResults ? (
                        <div className="space-y-4">
                            {/* Resumen de resultados */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {updateResults.filter(r => r.status === 'updated').length}
                                    </div>
                                    <div className="text-sm text-green-700">Actualizados</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {updateResults.filter(r => r.status === 'not_found').length}
                                    </div>
                                    <div className="text-sm text-yellow-700">No encontrados</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                        {updateResults.filter(r => r.status === 'error').length}
                                    </div>
                                    <div className="text-sm text-red-700">Errores</div>
                                </div>
                            </div>

                            {/* Tabla de resultados detallados */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">Estado</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">SKU</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">Producto</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-900">Stock Anterior</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-900">Stock Nuevo</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {updateResults.map((result, index) => (
                                            <tr key={index} className="border-b border-gray-100">
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                                        result.status === 'updated' ? 'bg-green-100 text-green-800' :
                                                        result.status === 'not_found' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {result.status === 'updated' ? 'Actualizado' :
                                                         result.status === 'not_found' ? 'No encontrado' :
                                                         'Error'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono">{result.sku}</td>
                                                <td className="px-4 py-3">{result.descripcion}</td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    {result.status === 'updated' ? result.oldStock : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">{result.newStock}</td>
                                                <td className="px-4 py-3 text-gray-600">{result.error || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-[#384A93] text-white rounded-lg hover:bg-[#2e3d7a] transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    ) : !showPreview ? (
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
                                    {isProcessing ? 'Procesando archivo...' : 'Arrastra tu archivo Excel de stock aquí'}
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
                                <h3 className="font-medium text-blue-900 mb-2">Formato del archivo Excel:</h3>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• <strong>Columna A:</strong> Código (SKU del producto)</li>
                                    <li>• <strong>Columna B:</strong> Descripción (nombre del producto)</li>
                                    <li>• <strong>Columna C:</strong> Stock (cantidad nueva de stock)</li>
                                </ul>
                                <p className="text-xs text-blue-600 mt-2">
                                    ⚠️ Solo se actualizará el stock de productos existentes. Los productos no encontrados serán reportados.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800">
                                    Se encontraron <strong>{previewData.length}</strong> productos para actualizar stock.
                                </p>
                            </div>

                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">SKU</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-900">Descripción</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-900">Nuevo Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 20).map((row, index) => (
                                            <tr key={index} className="border-b border-gray-100">
                                                <td className="px-4 py-3 font-mono">{row.codigo}</td>
                                                <td className="px-4 py-3">{row.descripcion}</td>
                                                <td className="px-4 py-3 text-right font-mono">{row.stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 20 && (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        ... y {previewData.length - 20} productos más
                                    </div>
                                )}
                            </div>

                            {/* Barra de progreso durante la actualización */}
                            {isUpdating && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-900">
                                            Actualizando stock...
                                        </span>
                                        <span className="text-sm text-blue-700">
                                            {updateProgress.current} de {updateProgress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                            style={{
                                                width: `${updateProgress.total > 0 ? (updateProgress.current / updateProgress.total) * 100 : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    disabled={isUpdating}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                >
                                    Volver
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateConfirm}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-[#384A93] text-white rounded-lg hover:bg-[#2e3d7a] disabled:opacity-50 transition-colors"
                                >
                                    {isUpdating
                                        ? `Procesando ${updateProgress.current} de ${updateProgress.total}...`
                                        : isProcessing
                                            ? 'Actualizando...'
                                            : 'Confirmar Actualización'
                                    }
                                </button>
                            </div>
                        </div>
                    )}
        </div>
    );
}