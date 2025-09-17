// src/app/mi-cuenta/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
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

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
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

    // Buscar al usuario en la BD para obtener información completa
    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: {
            assignedSeller: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!user) {
        return (
            <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Usuario no encontrado</h1>
                <p className="text-[#646464]">No se pudo encontrar tu perfil de usuario.</p>
            </div>
        );
    }

    // Obtener estadísticas de pedidos
    const orderStats = await prisma.order.groupBy({
        by: ['status', 'type'],
        where: {
            clientUserId: user.id
        },
        _count: {
            id: true
        },
        _sum: {
            total: true
        }
    });

    // Obtener cotizaciones recientes
    const recentQuotes = await prisma.order.findMany({
        where: {
            clientUserId: user.id,
            type: 'QUOTE'
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            code: true,
            status: true,
            total: true,
            createdAt: true
        }
    });

    const email = user.email ?? "—";
    const role = roleLabel(user.role);
    const userName = user.name || user.email?.split('@')[0] || "Usuario";

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
                                <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Información del perfil</h3>
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

                                {/* Información adicional del usuario */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {user.phone && (
                                        <div>
                                            <div className="text-sm text-[#646464] mb-1">Teléfono</div>
                                            <div className="text-[#1C1C1C]">{user.phone}</div>
                                        </div>
                                    )}
                                    {user.assignedSeller && (
                                        <div>
                                            <div className="text-sm text-[#646464] mb-1">Vendedor asignado</div>
                                            <div className="text-[#1C1C1C]">{user.assignedSeller.name}</div>
                                            <div className="text-sm text-[#646464]">{user.assignedSeller.email}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <Link 
                                        href="/mi-cuenta/perfil" 
                                        className="text-sm text-[#384A93] hover:underline"
                                    >
                                        Editar perfil
                                    </Link>
                                </div>
                            </div>

                            {/* Resumen de pedidos */}
                            <div className="border-t border-[#B5B5B5]/40 pt-6">
                                <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Resumen de actividad</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(() => {
                                        const totalQuotes = orderStats.filter(stat => stat.type === 'QUOTE').reduce((sum, stat) => sum + stat._count.id, 0);
                                        const totalAmount = orderStats.reduce((sum, stat) => sum + (stat._sum.total || 0), 0);
                                        const pendingQuotes = orderStats.filter(stat => stat.type === 'QUOTE' && stat.status === 'SUBMITTED').reduce((sum, stat) => sum + stat._count.id, 0);
                                        
                                        return (
                                            <>
                                                <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-semibold text-[#1C1C1C]">{totalQuotes}</div>
                                                    <div className="text-sm text-[#646464]">Cotizaciones totales</div>
                                                </div>
                                                <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-semibold text-[#1C1C1C]">{pendingQuotes}</div>
                                                    <div className="text-sm text-[#646464]">Cotizaciones pendientes</div>
                                                </div>
                                                <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
                                                    <div className="text-2xl font-semibold text-[#1C1C1C]">
                                                        {totalAmount > 0 ? money(totalAmount) : "—"}
                                                    </div>
                                                    <div className="text-sm text-[#646464]">Valor total cotizado</div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Información de contacto y dirección */}
                            <div className="border-t border-[#B5B5B5]/40 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-medium text-[#1C1C1C]">Información de contacto</h3>
                                    <Link href="/mi-cuenta/perfil" className="text-sm text-[#384A93] hover:underline">
                                        Editar información
                                    </Link>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-[#1C1C1C] mb-2">Información personal</h4>
                                        <div className="text-sm text-[#646464] space-y-1">
                                            <div>{userName}</div>
                                            <div>{email}</div>
                                            {user.phone && <div>T: {user.phone}</div>}
                                            {user.company && <div>Empresa: {user.company}</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-[#1C1C1C] mb-2">Dirección</h4>
                                        <div className="text-sm text-[#646464] space-y-1">
                                            {user.address ? (
                                                <>
                                                    <div>{user.address}</div>
                                                    {user.city && user.state && (
                                                        <div>{user.city}, {user.state}</div>
                                                    )}
                                                    {user.zip && <div>CP: {user.zip}</div>}
                                                </>
                                            ) : (
                                                <div className="italic">No hay dirección registrada</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cotizaciones recientes */}
                            <div className="border-t border-[#B5B5B5]/40 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-medium text-[#1C1C1C]">Cotizaciones recientes</h3>
                                    <Link href="/mis-cotizaciones" className="text-sm text-[#384A93] hover:underline">
                                        Ver todas
                                    </Link>
                                </div>
                                
                                {recentQuotes.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentQuotes.map((quote) => (
                                            <div key={quote.id} className="bg-[#F5F5F7] rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-sm text-[#1C1C1C]">
                                                            Cotización #{quote.code || quote.id}
                                                        </div>
                                                        <div className="text-xs text-[#646464] mt-1">
                                                            {new Date(quote.createdAt).toLocaleDateString('es-AR', {
                                                                day: '2-digit',
                                                                month: '2-digit', 
                                                                year: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium text-sm text-[#1C1C1C]">
                                                            {money(Number(quote.total))}
                                                        </div>
                                                        <div className="text-xs mt-1">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                quote.status === 'APPROVED' || quote.status === 'FULFILLED' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : quote.status === 'CANCELLED'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {quote.status === 'SUBMITTED' ? 'Pendiente' : 
                                                                 quote.status === 'CANCELLED' ? 'Cancelada' : 
                                                                 quote.status === 'APPROVED' ? 'Aprobada' : 'Completada'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[#F5F5F7] rounded-lg p-4">
                                        <p className="text-sm text-[#646464] text-center">
                                            Aún no tienes cotizaciones realizadas.
                                        </p>
                                        <div className="text-center mt-2">
                                            <Link 
                                                href="/catalogo" 
                                                className="text-sm text-[#384A93] hover:underline"
                                            >
                                                Explorar catálogo
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}