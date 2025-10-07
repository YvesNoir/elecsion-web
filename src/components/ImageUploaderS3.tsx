"use client";

import React, { useState, useRef } from "react";

type ImageUploaderS3Props = {
    productSku: string;
    onUploadSuccess?: () => void;
};

export default function ImageUploaderS3({ productSku, onUploadSuccess }: ImageUploaderS3Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Validar tipo de archivo
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return "Solo se permiten archivos PNG y JPG";
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return "El archivo no debe superar los 5MB";
        }

        return null;
    };

    const uploadToS3 = async (file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);
            setMessage({ type: 'info', text: 'Obteniendo URL de upload...' });

            // Paso 1: Obtener URL pre-firmada del servidor
            const response = await fetch('/api/upload-image-s3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sku: productSku,
                    contentType: file.type
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error obteniendo URL de upload');
            }

            const { uploadUrl, key } = await response.json();

            setMessage({ type: 'info', text: 'Subiendo imagen a S3...' });

            // Paso 2: Upload directo a S3 usando XMLHttpRequest para progreso
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(progress);
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

            setMessage({
                type: 'success',
                text: `✅ Imagen subida exitosamente para ${productSku}`
            });

            // Llamar callback de éxito
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error('Error uploading to S3:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Error desconocido'
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileSelect = async (file: File) => {
        const error = validateFile(file);
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }

        await uploadToS3(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Área de drop */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                        ? "border-[#384A93] bg-blue-50"
                        : "border-[#B5B5B5] hover:border-[#384A93] hover:bg-gray-50"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
            >
                <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 text-[#646464]">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-[#1C1C1C] font-medium">
                            Arrastra y suelta una imagen aquí
                        </p>
                        <p className="text-xs text-[#646464] mt-1">
                            o{" "}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[#384A93] hover:underline"
                                disabled={isUploading}
                            >
                                selecciona un archivo
                            </button>
                        </p>
                    </div>
                    <p className="text-xs text-[#646464]">
                        PNG o JPG • Máximo 5MB
                    </p>
                    <p className="text-xs text-[#646464] font-medium">
                        SKU: {productSku}
                    </p>
                </div>

                {/* Barra de progreso */}
                {isUploading && (
                    <div className="absolute inset-x-4 bottom-4">
                        <div className="bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-[#384A93] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-[#646464] mt-1 text-center">
                            {uploadProgress}%
                        </p>
                    </div>
                )}
            </div>

            {/* Input oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploading}
            />

            {/* Mensajes */}
            {message && (
                <div
                    className={`p-3 rounded-md text-sm ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : message.type === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                >
                    {message.text}
                </div>
            )}
        </div>
    );
}