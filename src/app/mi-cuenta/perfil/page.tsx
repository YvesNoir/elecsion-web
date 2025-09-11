// src/app/mi-cuenta/perfil/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import AccountSidebar from "@/components/AccountSidebar";

export const metadata: Metadata = {
    title: "Perfil | Mi cuenta | Elecsion",
};

export default async function ProfilePage() {
    const session = await getSession();
    
    if (!session?.user) {
        return (
            <>
                <div className="mb-4">
                    <Link 
                        href="/" 
                        className="text-[#384A93] hover:underline text-sm"
                    >
                        ← Catálogo
                    </Link>
                    <span className="mx-2 text-[#646464]">Mi Cuenta</span>
                </div>
                
                <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Perfil</h1>
                    <p className="text-[#646464] mb-6">
                        No has iniciado sesión. Por favor, inicia sesión para acceder a tu perfil.
                    </p>
                    <Link
                        href="/login?next=/mi-cuenta/perfil"
                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </>
        );
    }

    const email = session.user.email ?? "—";
    const userName = session.user.name || session.user.email?.split('@')[0] || "Usuario";

    return (
        <>
            <div className="mb-4">
                <Link 
                    href="/" 
                    className="text-[#384A93] hover:underline text-sm"
                >
                    ← Catálogo
                </Link>
                <span className="mx-2 text-[#646464]">Mi Cuenta</span>
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Perfil</h1>
                            <p className="text-sm text-[#646464] mt-1">Gestiona tu información personal</p>
                        </div>

                        <div className="p-6">
                            <form className="space-y-6">
                                {/* Información personal */}
                                <div>
                                    <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Información Personal</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                Nombre completo
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                defaultValue={userName}
                                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                defaultValue={email}
                                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Información de contacto */}
                                <div className="border-t border-[#B5B5B5]/40 pt-6">
                                    <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Información de Contacto</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                placeholder="2099-6983"
                                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="company" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                Empresa
                                            </label>
                                            <input
                                                type="text"
                                                id="company"
                                                name="company"
                                                placeholder="Nombre de la empresa"
                                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div className="border-t border-[#B5B5B5]/40 pt-6">
                                    <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Dirección</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="address" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                placeholder="Calle y número"
                                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label htmlFor="city" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                    Ciudad
                                                </label>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    name="city"
                                                    placeholder="Buenos Aires"
                                                    className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="state" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                    Provincia
                                                </label>
                                                <input
                                                    type="text"
                                                    id="state"
                                                    name="state"
                                                    placeholder="Buenos Aires"
                                                    className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="zip" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                                    Código Postal
                                                </label>
                                                <input
                                                    type="text"
                                                    id="zip"
                                                    name="zip"
                                                    placeholder="1439"
                                                    className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preferencias */}
                                <div className="border-t border-[#B5B5B5]/40 pt-6">
                                    <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Preferencias</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-[#B5B5B5]/60 text-[#384A93] focus:ring-[#384A93]"
                                            />
                                            <span className="ml-2 text-sm text-[#1C1C1C]">
                                                Suscribirse al newsletter
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-[#B5B5B5]/60 text-[#384A93] focus:ring-[#384A93]"
                                            />
                                            <span className="ml-2 text-sm text-[#1C1C1C]">
                                                Recibir notificaciones de promociones
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="border-t border-[#B5B5B5]/40 pt-6 flex gap-3">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                                    >
                                        Guardar Cambios
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-2 border border-[#B5B5B5]/60 text-[#646464] rounded-md hover:bg-[#F5F5F7] transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}