"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AccountSidebar from "@/components/AccountSidebar";

export default function ChangePasswordPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Verificar autenticación
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4"></div>
                    <p className="text-[#646464]">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        router.push("/login?callbackUrl=/mi-cuenta/cambiar-password");
        return null;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar mensajes cuando el usuario empiece a escribir
        if (error) setError("");
        if (success) setSuccess("");
    };

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validaciones del cliente
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError("Todos los campos son obligatorios");
            setLoading(false);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("La nueva contraseña y la confirmación no coinciden");
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/users/change-password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Contraseña actualizada exitosamente");
                setFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            } else {
                setError(data.error || "Error al cambiar la contraseña");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="mb-4">
                <Link 
                    href="/" 
                    className="text-[#384A93] hover:underline text-sm"
                >
                    ← Catálogo
                </Link>
                <span className="mx-2 text-[#646464]">👤 Mi Cuenta</span>
                <span className="mx-2 text-[#646464]">→</span>
                <span className="text-[#646464]">Cambiar Contraseña</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - 1/4 del ancho */}
                <div className="lg:col-span-1">
                    <AccountSidebar />
                </div>

                {/* Contenido principal - 3/4 del ancho */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                            <div>
                                <h1 className="text-xl font-semibold text-[#1C1C1C]">Cambiar Contraseña</h1>
                                <p className="text-sm text-[#646464] mt-1">
                                    Actualiza tu contraseña para mantener tu cuenta segura
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Contraseña actual */}
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                        Contraseña Actual *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#B5B5B5]/40 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            placeholder="Ingresa tu contraseña actual"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#646464] hover:text-[#1C1C1C]"
                                        >
                                            {showPasswords.current ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                </div>

                                {/* Nueva contraseña */}
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                        Nueva Contraseña *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#B5B5B5]/40 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            placeholder="Ingresa tu nueva contraseña"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('new')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#646464] hover:text-[#1C1C1C]"
                                        >
                                            {showPasswords.new ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    <p className="text-xs text-[#646464] mt-1">
                                        Mínimo 6 caracteres
                                    </p>
                                </div>

                                {/* Confirmar nueva contraseña */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                        Confirmar Nueva Contraseña *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#B5B5B5]/40 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            placeholder="Confirma tu nueva contraseña"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#646464] hover:text-[#1C1C1C]"
                                        >
                                            {showPasswords.confirm ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                </div>

                                {/* Mensajes de error y éxito */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                                        {success}
                                    </div>
                                )}

                                {/* Botones */}
                                <div className="flex items-center justify-between pt-4">
                                    <Link
                                        href="/mi-cuenta"
                                        className="text-[#646464] hover:text-[#1C1C1C] text-sm transition-colors"
                                    >
                                        ← Volver a Mi Cuenta
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                                            loading
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-[#384A93] text-white hover:bg-[#2A3A7A]"
                                        }`}
                                    >
                                        {loading ? "Actualizando..." : "Actualizar Contraseña"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Consejos de seguridad */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Consejos para una contraseña segura:</h3>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Usa al menos 6 caracteres (recomendado: 8 o más)</li>
                            <li>• Combina letras, números y símbolos especiales</li>
                            <li>• Evita usar información personal como fechas de nacimiento</li>
                            <li>• No compartas tu contraseña con nadie</li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}