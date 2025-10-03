import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function ReportesPage() {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    // Obtener métricas básicas
    const [
        totalBrands,
        activeBrands,
        totalProducts,
        activeProducts,
        featuredProducts,
        totalOrders,
        pendingOrders,
        completedOrders
    ] = await Promise.all([
        prisma.brand.count(),
        prisma.brand.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isDeleted: false } }),
        prisma.product.count({ where: { isDeleted: false, isActive: true } }),
        prisma.product.count({ where: { isDeleted: false, isFeatured: true } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'SUBMITTED' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } })
    ]);

    const metrics = [
        {
            title: 'Marcas',
            total: totalBrands,
            active: activeBrands,
            icon: '🏷️',
            color: 'bg-blue-50 border-blue-200',
            textColor: 'text-blue-800'
        },
        {
            title: 'Productos',
            total: totalProducts,
            active: activeProducts,
            featured: featuredProducts,
            icon: '📦',
            color: 'bg-green-50 border-green-200',
            textColor: 'text-green-800'
        },
        {
            title: 'Pedidos',
            total: totalOrders,
            pending: pendingOrders,
            completed: completedOrders,
            icon: '📋',
            color: 'bg-purple-50 border-purple-200',
            textColor: 'text-purple-800'
        }
    ];

    return (
        <>
            <div className="mb-4">
                <Link
                    href="/"
                    className="text-[#384A93] hover:underline text-sm"
                >
                    ← Inicio
                </Link>
                <span className="mx-2 text-[#646464]">&gt;</span>
                <span className="mx-2 text-[#646464]">Reportes</span>
            </div>

            <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                    <h1 className="text-xl font-semibold text-[#1C1C1C]">Dashboard de Reportes</h1>
                    <p className="text-sm text-[#646464] mt-1">
                        Métricas y estadísticas del sistema
                    </p>
                </div>

                <div className="p-6">
                    {/* Métricas principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {metrics.map((metric) => (
                            <div
                                key={metric.title}
                                className={`${metric.color} rounded-lg border p-6`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-2xl">{metric.icon}</div>
                                    <div className={`text-3xl font-bold ${metric.textColor}`}>
                                        {metric.total}
                                    </div>
                                </div>
                                <h3 className={`text-lg font-semibold ${metric.textColor} mb-2`}>
                                    {metric.title}
                                </h3>
                                <div className="space-y-1 text-sm">
                                    {metric.active !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Activos:</span>
                                            <span className={metric.textColor}>{metric.active}</span>
                                        </div>
                                    )}
                                    {metric.featured !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Destacados:</span>
                                            <span className={metric.textColor}>{metric.featured}</span>
                                        </div>
                                    )}
                                    {metric.pending !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Pendientes:</span>
                                            <span className={metric.textColor}>{metric.pending}</span>
                                        </div>
                                    )}
                                    {metric.completed !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Completados:</span>
                                            <span className={metric.textColor}>{metric.completed}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enlaces rápidos */}
                    <div className="border-t border-[#B5B5B5]/40 pt-6">
                        <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">Accesos Rápidos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link
                                href="/mi-cuenta/productos"
                                className="p-4 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="font-medium text-[#1C1C1C]">Gestión de Productos</div>
                                <div className="text-sm text-[#646464] mt-1">Administrar catálogo</div>
                            </Link>
                            <Link
                                href="/mi-cuenta/marcas"
                                className="p-4 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="font-medium text-[#1C1C1C]">Gestión de Marcas</div>
                                <div className="text-sm text-[#646464] mt-1">Administrar marcas</div>
                            </Link>
                            <Link
                                href="/pedidos-pendientes"
                                className="p-4 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="font-medium text-[#1C1C1C]">Pedidos Pendientes</div>
                                <div className="text-sm text-[#646464] mt-1">Ver pedidos por aprobar</div>
                            </Link>
                            <Link
                                href="/catalogo/destacados"
                                className="p-4 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="font-medium text-[#1C1C1C]">Productos Destacados</div>
                                <div className="text-sm text-[#646464] mt-1">Ver catálogo destacado</div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}