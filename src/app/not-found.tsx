import { getSession } from '@/lib/session';
import Link from 'next/link';

export default async function NotFound() {
    const session = await getSession();
    const isAdminOrAgent = session?.user && (session.user.role === 'ADMIN' || session.user.role === 'VENDOR');

    return (
        <div className="flex items-center justify-center mt-[100px]">
            <div className="max-w-md w-full space-y-6 text-center">
                {/* Ilustración 404 */}
                <div className="mx-auto">
                    <div className="text-6xl font-bold text-[#384A93] mb-3">404</div>
                    <h1 className="text-xl font-bold text-[#1C1C1C] mb-2">
                        Página no encontrada
                    </h1>
                    <p className="text-[#646464] mb-6">
                        Lo sentimos, la página que buscas no existe o ha sido movida.
                    </p>
                </div>

                {/* Botones para Admin/Agente */}
                {isAdminOrAgent ? (
                    <div className="space-y-3">
                        <p className="text-sm text-[#646464] mb-4">
                            Como {session.user.role === 'ADMIN' ? 'administrador' : 'agente'}, puedes acceder a:
                        </p>

                        <div className="grid gap-2">
                            <Link
                                href="/mi-cuenta"
                                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#384A93] hover:bg-[#2e3d7a] transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Mi Cuenta
                            </Link>

                            <Link
                                href="/catalogo"
                                className="w-full flex items-center justify-center px-6 py-3 border border-[#384A93] text-base font-medium rounded-lg text-[#384A93] bg-white hover:bg-[#384A93] hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Ver Catálogo
                            </Link>

                            <Link
                                href="/pedidos-pendientes"
                                className="w-full flex items-center justify-center px-6 py-3 border border-[#384A93] text-base font-medium rounded-lg text-[#384A93] bg-white hover:bg-[#384A93] hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v4a2 2 0 002 2h2a2 2 0 002-2v-4m-6 0h6m-6 0V5m6 4V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v4" />
                                </svg>
                                Ver Pedidos
                            </Link>
                        </div>

                        {session.user.role === 'ADMIN' && (
                            <Link
                                href="/reportes"
                                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-[#646464] bg-white hover:bg-gray-50 transition-colors mt-3"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
                                </svg>
                                Ver Reportes
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Botones para usuarios regulares o no logueados */
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#384A93] hover:bg-[#2e3d7a] transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Volver al Inicio
                        </Link>

                        <Link
                            href="/catalogo"
                            className="w-full flex items-center justify-center px-6 py-3 border border-[#384A93] text-base font-medium rounded-lg text-[#384A93] bg-white hover:bg-[#384A93] hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Explorar Catálogo
                        </Link>

                        {!session?.user && (
                            <Link
                                href="/login"
                                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-[#646464] bg-white hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                )}

                {/* Footer con información adicional */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-[#646464]">
                        Si crees que esto es un error, por favor{' '}
                        <Link href="/contacto" className="text-[#384A93] hover:underline">
                            contáctanos
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}