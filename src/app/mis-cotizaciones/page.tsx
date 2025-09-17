// src/app/mis-cotizaciones/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import AccountSidebar from "@/components/AccountSidebar";
import QuotesClient from "@/components/QuotesClient";

export const metadata: Metadata = {
    title: "Mis Cotizaciones | Mi cuenta | Elecsion",
};

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

function formatAddress(user: { address?: string | null; city?: string | null; state?: string | null; zip?: string | null; company?: string | null }) {
    const parts = [];
    
    // Agregar dirección si existe
    if (user.address) {
        parts.push(user.address);
    }
    
    // Agregar ciudad, provincia y código postal en una línea
    const locationParts = [];
    if (user.city) locationParts.push(user.city);
    if (user.state) locationParts.push(user.state);
    if (user.zip) locationParts.push(user.zip);
    
    if (locationParts.length > 0) {
        parts.push(locationParts.join(", "));
    }
    
    // Si no hay información de dirección, mostrar mensaje por defecto
    if (parts.length === 0) {
        return "Dirección no especificada";
    }
    
    return parts.join(" - ");
}


export default async function QuotesPage() {
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
                    <span className="mx-2 text-[#646464]">Mis Cotizaciones</span>
                </div>
                
                <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Mis Cotizaciones</h1>
                    <p className="text-[#646464] mb-6">
                        No has iniciado sesión. Por favor, inicia sesión para ver tus cotizaciones.
                    </p>
                    <Link
                        href="/login?next=/mis-cotizaciones"
                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </>
        );
    }

    // Buscar al usuario en la BD para obtener su ID real y datos de dirección
    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            company: true
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

    // Traer cotizaciones reales de la base de datos
    const quotes = await prisma.order.findMany({
        where: {
            clientUserId: user.id,
            type: 'QUOTE'
        },
        include: {
            items: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Formatear fechas y datos para la UI
    const formattedQuotes = quotes.map(quote => ({
        id: quote.code || quote.id,
        realId: quote.id, // ID real para la API
        date: new Date(quote.createdAt).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }),
        company: formatAddress(user),
        total: Number(quote.total),
        status: quote.status,
        statusLabel: quote.status === 'SUBMITTED' ? 'Pendiente' : 
                    quote.status === 'CANCELLED' ? 'Cancelada' : 'Completo',
        items: quote.items.map(item => ({
            sku: item.sku || 'N/A',
            name: item.name,
            qty: Number(item.quantity),
            price: Number(item.unitPrice || 0)
        }))
    }));

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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Mis Cotizaciones</h1>
                            <p className="text-sm text-[#646464] mt-1">Historial de cotizaciones realizadas</p>
                        </div>

                        <div className="p-6">
                            <QuotesClient quotes={formattedQuotes} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}