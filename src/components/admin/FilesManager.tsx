"use client";

import { useRef, useState } from "react";

export type StoredFileData = {
    id: string;
    originalName: string;
    url: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
    uploadedBy: { name: string | null; email: string };
};

type Props = {
    initialFiles: StoredFileData[];
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(date));
}

function fileExtension(fileName: string) {
    return fileName.split(".").pop()?.toUpperCase() || "FILE";
}

function uploadToS3(uploadUrl: string, file: File) {
    return fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
    }).then((response) => {
        if (!response.ok) throw new Error(`Error de carga (${response.status})`);
    });
}

export default function FilesManager({ initialFiles }: Props) {
    const [files, setFiles] = useState(initialFiles);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadFiles = async (selectedFiles: File[]) => {
        if (!selectedFiles.length || isUploading) return;

        setIsUploading(true);
        setMessage(null);
        let uploadedCount = 0;

        try {
            for (const file of selectedFiles) {
                const prepareResponse = await fetch("/api/admin/files", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "prepare",
                        fileName: file.name,
                        contentType: file.type || "application/octet-stream",
                        sizeBytes: file.size,
                    }),
                });
                const prepareData = await prepareResponse.json();
                if (!prepareResponse.ok) throw new Error(prepareData.error || "No se pudo preparar la carga");

                await uploadToS3(prepareData.uploadUrl, file);

                const completeResponse = await fetch("/api/admin/files", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "complete",
                        key: prepareData.key,
                        fileName: file.name,
                    }),
                });
                const completeData = await completeResponse.json();
                if (!completeResponse.ok) throw new Error(completeData.error || "No se pudo registrar el archivo");

                setFiles((current) => [completeData.file, ...current]);
                uploadedCount += 1;
            }

            setMessage({
                type: "success",
                text: uploadedCount === 1 ? "Archivo cargado correctamente." : `${uploadedCount} archivos cargados correctamente.`,
            });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "No se pudieron cargar los archivos.",
            });
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const copyUrl = async (file: StoredFileData) => {
        await navigator.clipboard.writeText(file.url);
        setCopiedId(file.id);
        window.setTimeout(() => setCopiedId(null), 1800);
    };

    const deleteFile = async (file: StoredFileData) => {
        setDeletingId(file.id);
        setMessage(null);

        try {
            const response = await fetch(`/api/admin/files/${file.id}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "No se pudo eliminar el archivo.");
            setFiles((current) => current.filter((item) => item.id !== file.id));
            setMessage({ type: "success", text: "Archivo eliminado correctamente." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el archivo." });
        } finally {
            setDeletingId(null);
            setPendingDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging ? "border-[#384A93] bg-blue-50" : "border-[#B5B5B5] bg-[#FAFAFB] hover:border-[#384A93]"
                } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    void uploadFiles(Array.from(event.dataTransfer.files));
                }}
            >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#384A93]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6H16a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
                    </svg>
                </div>
                <p className="font-medium text-[#1C1C1C]">
                    {isUploading ? "Cargando archivos…" : "Arrastrá archivos aquí"}
                </p>
                <p className="mt-1 text-sm text-[#646464]">
                    o{" "}
                    <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-[#384A93] hover:underline" disabled={isUploading}>
                        seleccioná desde tu equipo
                    </button>
                </p>
                <p className="mt-3 text-xs text-[#646464]">PDF, Word, Excel, CSV, imágenes o ZIP · máximo 50 MB por archivo</p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.zip"
                    onChange={(event) => void uploadFiles(Array.from(event.target.files || []))}
                />
            </div>

            {message && (
                <div className={`rounded-md border px-4 py-3 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {message.text}
                </div>
            )}

            <div>
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h2 className="font-medium text-[#1C1C1C]">Archivos cargados</h2>
                        <p className="text-sm text-[#646464]">{files.length} {files.length === 1 ? "archivo" : "archivos"}</p>
                    </div>
                </div>

                {files.length === 0 ? (
                    <div className="rounded-lg border border-[#B5B5B5]/40 bg-[#FAFAFB] px-6 py-10 text-center">
                        <p className="font-medium text-[#1C1C1C]">Todavía no hay archivos</p>
                        <p className="mt-1 text-sm text-[#646464]">Cuando cargues uno, su URL aparecerá en este listado.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-[#B5B5B5]/40">
                        <div className="hidden grid-cols-[minmax(0,1fr)_120px_150px_220px] gap-4 bg-[#F5F5F7] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#646464] md:grid">
                            <span>Archivo</span><span>Tamaño</span><span>Fecha</span><span className="text-right">Acciones</span>
                        </div>
                        <ul className="divide-y divide-[#B5B5B5]/30">
                            {files.map((file) => (
                                <li key={file.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px_150px_220px] md:items-center md:gap-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-bold text-[#384A93]">{fileExtension(file.originalName)}</span>
                                        <div className="min-w-0">
                                            <a href={file.url} target="_blank" rel="noreferrer" className="block truncate font-medium text-[#1C1C1C] hover:text-[#384A93] hover:underline" title={file.originalName}>
                                                {file.originalName}
                                            </a>
                                            <p className="truncate text-xs text-[#646464]">{file.uploadedBy.name || file.uploadedBy.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-[#646464]">{formatBytes(file.sizeBytes)}</span>
                                    <span className="text-sm text-[#646464]">{formatDate(file.createdAt)}</span>
                                    <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                                        <button type="button" onClick={() => void copyUrl(file)} className="rounded-md border border-[#B5B5B5] px-3 py-1.5 text-xs font-medium text-[#1C1C1C] transition-colors hover:bg-[#F5F5F7]">
                                            {copiedId === file.id ? "URL copiada" : "Copiar URL"}
                                        </button>
                                        <a href={file.url} target="_blank" rel="noreferrer" className="rounded-md bg-[#384A93] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2e3d7a]">Abrir</a>
                                        {pendingDeleteId === file.id ? (
                                            <>
                                                <button type="button" onClick={() => void deleteFile(file)} disabled={deletingId === file.id} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">{deletingId === file.id ? "…" : "Confirmar"}</button>
                                                <button type="button" onClick={() => setPendingDeleteId(null)} className="text-xs text-[#646464] hover:underline">Cancelar</button>
                                            </>
                                        ) : (
                                            <button type="button" onClick={() => setPendingDeleteId(file.id)} className="text-xs font-medium text-red-600 hover:underline">Eliminar</button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
