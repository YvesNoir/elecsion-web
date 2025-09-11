// src/app/mi-cuenta/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import AccountSidebar from "@/components/AccountSidebar";

export const metadata: Metadata = {
    title: "Mi cuenta | Elecsion",
};

function roleLabel(role?: string) {
    switch (role) {
        case "ADMIN":
            return "Administrador de la empresa";
        case "SELLER":
            return "Vendedor";
        case "CLIENT":
            return "Cliente";
        default:
            return "—";
    }
}

export default async function AccountPage() {
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
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Mi cuenta</h1>
                    <p className="text-[#646464] mb-6">
                        No has iniciado sesión. Por favor, inicia sesión para acceder a tu cuenta.
                    </p>
                    <Link
                        href="/login?next=/mi-cuenta"
                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </>
        );
    }

    const email = session.user.email ?? "—";
    const role = roleLabel(session.user.role as string | undefined);
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Mi Cuenta</h1>
                            <p className="text-sm text-[#646464] mt-1">Información de la Cuenta</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Información del contacto */}
                            <div>
                                <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Información del contacto</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-sm text-[#646464] mb-1">Nombre</div>
                                        <div className="text-[#1C1C1C]">{userName}</div>
                                        <div className="text-sm text-[#646464] mt-1">{email}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#646464] mb-1">Rol de Usuario</div>
                                        <div className="text-[#1C1C1C]">{role}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Newsletter */}
                            <div className="border-t border-[#B5B5B5]/40 pt-6">
                                <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Newsletter</h3>
                                <p className="text-sm text-[#646464] mb-2">
                                    No estás suscrito a nuestro Newsletter.
                                </p>
                                <button className="text-sm text-[#384A93] hover:underline">
                                    Editar
                                </button>
                            </div>

                            {/* Direcciones */}
                            <div className="border-t border-[#B5B5B5]/40 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-medium text-[#1C1C1C]">Direcciones</h3>
                                    <button className="text-sm text-[#384A93] hover:underline">
                                        Editar direcciones
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-[#1C1C1C] mb-2">Dirección de facturación</h4>
                                        <div className="text-sm text-[#646464] space-y-1">
                                            <div>{userName}</div>
                                            <div>Buenos Aires</div>
                                            <div>Argentina</div>
                                            <div>T: 2099-6983</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-[#1C1C1C] mb-2">Dirección de envío</h4>
                                        <div className="text-sm text-[#646464] space-y-1">
                                            <div>{userName}</div>
                                            <div>Buenos Aires</div>
                                            <div>Argentina</div>
                                            <div>T: 2099-6983</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Compras recientes */}
                            <div className="border-t border-[#B5B5B5]/40 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-medium text-[#1C1C1C]">Compras recientes</h3>
                                    <Link href="/mis-cotizaciones" className="text-sm text-[#384A93] hover:underline">
                                        Ver todo
                                    </Link>
                                </div>
                                
                                <div className="bg-[#F5F5F7] rounded-lg p-4">
                                    <p className="text-sm text-[#646464] text-center">
                                        Aún no tienes compras realizadas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}