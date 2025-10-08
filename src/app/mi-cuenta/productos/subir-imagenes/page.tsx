import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import AccountSidebar from '@/components/AccountSidebar';
import ImageUploaderBulk from '@/components/ImageUploaderBulk';

export default async function SubirImagenesPage() {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
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
                <span className="mx-2 text-[#646464]">&gt;</span>
                <Link
                    href="/mi-cuenta/productos"
                    className="text-[#384A93] hover:underline text-sm"
                >
                    Productos
                </Link>
                <span className="mx-2 text-[#646464]">&gt;</span>
                <span className="mx-2 text-[#646464]">Subir Imágenes</span>
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
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/mi-cuenta/productos"
                                    className="text-[#384A93] hover:text-[#2e3d7a] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <div>
                                    <h1 className="text-xl font-semibold text-[#1C1C1C]">Subir Imágenes de Productos</h1>
                                    <p className="text-sm text-[#646464] mt-1">
                                        Sube imágenes usando el formato: sku.png o sku.jpg
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <ImageUploaderBulk />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}