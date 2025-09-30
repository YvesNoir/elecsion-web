import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import AccountSidebar from '@/components/AccountSidebar';
import BrandsTable from '@/components/BrandsTable';

export default async function MarcasPage() {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    // Obtener todas las marcas con conteo de productos (activas e inactivas)
    const brandsWithCount = await prisma.brand.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            code: true,
            isActive: true,
            createdAt: true,
            _count: {
                select: {
                    products: {
                        where: {
                            isDeleted: false // Solo contar productos no eliminados
                        }
                    }
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    // Transformar los datos para el componente cliente
    const brands = brandsWithCount.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        code: brand.code,
        isActive: brand.isActive,
        createdAt: brand.createdAt.toISOString(),
        productCount: brand._count.products
    }));

    const totalBrands = brands.length;

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
                <span className="mx-2 text-[#646464]">&gt;</span>
                <span className="mx-2 text-[#646464]">Marcas</span>
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Marcas</h1>
                            <p className="text-sm text-[#646464] mt-1">
                                Gestión de marcas - Total: {totalBrands} marcas
                            </p>
                        </div>

                        <div className="p-6">
                            <BrandsTable brands={brands} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}