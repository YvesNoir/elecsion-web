import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import AccountSidebar from '@/components/AccountSidebar';
import ProductsPageClient from '@/components/ProductsPageClient';

export default async function ProductosPage() {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const productsRaw = await prisma.product.findMany({
        select: {
            id: true,
            sku: true,
            name: true,
            priceBase: true,
            stockQty: true,
            taxRate: true,
            isActive: true,
            brand: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    // Convertir Decimal a number para componentes cliente
    const products = productsRaw.map(product => ({
        ...product,
        priceBase: Number(product.priceBase),
        stockQty: product.stockQty ? Number(product.stockQty) : 0,
        taxRate: product.taxRate ? Number(product.taxRate) : null,
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
                <span className="mx-2 text-[#646464]">&gt;</span>
                <span className="mx-2 text-[#646464]">Productos</span>
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Productos</h1>
                            <p className="text-sm text-[#646464] mt-1">
                                Gestión de productos - Total: {products.length} productos
                            </p>
                        </div>

                        <div className="p-6">
                            <ProductsPageClient products={products} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}