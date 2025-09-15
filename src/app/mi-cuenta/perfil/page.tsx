// src/app/mi-cuenta/perfil/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import AccountSidebar from "@/components/AccountSidebar";
import ProfileClient from "@/components/ProfileClient";

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

    // Buscar al usuario completo en la BD
    const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
    });

    if (!user) {
        return (
            <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Usuario no encontrado</h1>
                <p className="text-[#646464]">No se pudo encontrar tu perfil de usuario.</p>
            </div>
        );
    }

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
                            <ProfileClient user={user} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}