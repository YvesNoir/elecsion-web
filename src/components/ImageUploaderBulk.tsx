"use client";

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function ImageUploaderBulk() {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
    const [lastImportCount, setLastImportCount] = useState<number>(0);
    const [showImportSummary, setShowImportSummary] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast, showSuccess, showError, hideToast } = useToast();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const validateFile = (file: File): string | null => {
        // Validar tipo de archivo
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return 'Solo se permiten archivos PNG y JPG';
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return 'El archivo no puede superar los 5MB';
        }

        // Validar nombre del archivo (debe ser SKU válido)
        const fileName = file.name.replace(/\.(png|jpg|jpeg)$/i, '');
        if (!fileName || fileName.length < 1) {
            return 'El nombre del archivo debe ser un SKU válido';
        }

        return null;
    };

    const uploadFileToS3 = async (file: File): Promise<boolean> => {
        try {
            const fileName = file.name.replace(/\.(png|jpg|jpeg)$/i, '');

            // Paso 1: Obtener URL pre-firmada del servidor
            const response = await fetch('/api/upload-image-s3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sku: fileName,
                    contentType: file.type
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error obteniendo URL de upload');
            }

            const { uploadUrl } = await response.json();

            // Paso 2: Upload directo a S3 usando XMLHttpRequest para progreso
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: progress
                        }));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        resolve();
                    } else {
                        reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Error de red durante el upload'));
                });

                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });

            return true;
        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            showError(`Error subiendo ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            return false;
        } finally {
            // Limpiar progreso
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[file.name];
                return newProgress;
            });
        }
    };

    const handleFiles = async (files: FileList) => {
        const fileArray = Array.from(files);

        // Validar todos los archivos primero
        for (const file of fileArray) {
            const error = validateFile(file);
            if (error) {
                showError(`Error en ${file.name}: ${error}`);
                return;
            }
        }

        setUploading(true);
        const successfulUploads: string[] = [];

        try {
            // Subir archivos de forma secuencial para mejor control
            for (const file of fileArray) {
                const success = await uploadFileToS3(file);
                if (success) {
                    successfulUploads.push(file.name);
                }
            }

            if (successfulUploads.length > 0) {
                setUploadedFiles(prev => [...prev, ...successfulUploads]);
                setLastImportCount(successfulUploads.length);
                setShowImportSummary(true);
                showSuccess(`${successfulUploads.length} imagen(es) subida(s) exitosamente a S3`);

                // Limpiar input
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            showError('Error al subir las imágenes');
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            {/* Zona de carga */}
            <div className="space-y-4">
                <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                            ? 'border-[#384A93] bg-blue-50'
                            : 'border-[#B5B5B5] hover:border-[#384A93]'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleChange}
                        className="hidden"
                    />

                    <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-[#384A93]/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#384A93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-[#1C1C1C] mb-2">
                                Arrastra imágenes aquí o haz clic para seleccionar
                            </h3>
                            <p className="text-sm text-[#646464] mb-4">
                                Formatos soportados: PNG, JPG. Máximo 5MB por archivo.
                            </p>
                            <button
                                type="button"
                                onClick={onButtonClick}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#384A93] bg-white border border-[#384A93] rounded-md hover:bg-[#384A93] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Seleccionar archivos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress de archivos individuales */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-[#1C1C1C]">Subiendo archivos:</h4>
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#646464]">{fileName}</span>
                                <span className="text-[#646464]">{progress}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-[#384A93] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Resumen de importación */}
            {showImportSummary && lastImportCount > 0 && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-900">¡Importación Completada!</h3>
                            <p className="text-green-700">Se importaron exitosamente las imágenes</p>
                        </div>
                        <button
                            onClick={() => setShowImportSummary(false)}
                            className="ml-auto text-green-600 hover:text-green-800 transition-colors"
                            title="Cerrar resumen"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="bg-green-100 rounded-lg p-4 mb-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-800 mb-1">
                                {lastImportCount}
                            </div>
                            <div className="text-sm text-green-700">
                                {lastImportCount === 1 ? 'imagen importada' : 'imágenes importadas'}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-green-700 text-center">
                        Las imágenes están ahora disponibles en el catálogo y aparecerán automáticamente en los productos correspondientes.
                    </div>
                </div>
            )}

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Instrucciones importantes:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Nombre de archivo:</strong> Debe coincidir exactamente con el SKU del producto</li>
                    <li>• <strong>Ejemplos:</strong> <code>200002.png</code>, <code>IM0102010.jpg</code>, <code>ctbla.png</code></li>
                    <li>• <strong>Formatos:</strong> PNG (recomendado) o JPG</li>
                    <li>• <strong>Tamaño:</strong> Máximo 5MB por imagen</li>
                    <li>• <strong>S3 Storage:</strong> Las imágenes se suben a AWS S3 y aparecerán inmediatamente en el catálogo</li>
                </ul>
            </div>

            {/* Lista de archivos subidos */}
            {uploadedFiles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">✅ Imágenes subidas correctamente a S3:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {uploadedFiles.map((fileName, index) => (
                            <div key={index} className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                                {fileName}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Toast de notificaciones */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </div>
    );
}