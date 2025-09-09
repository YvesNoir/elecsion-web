// src/app/carrito/loading.tsx
export default function Loading() {
    return (
        <main className="max-w-6xl mx-auto px-4 py-8" aria-busy="true">
            {/* Título */}
            <div className="h-7 w-40 rounded bg-gray-200 animate-pulse mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Izquierda: listado */}
                <section className="lg:col-span-2 rounded-lg border border-[#B5B5B5]/40 bg-white p-4">
                    <ul className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <li key={i} className="animate-pulse">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                                        <div className="h-3 w-24 bg-gray-200 rounded mt-2" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded border border-[#B5B5B5]/60" />
                                        <div className="h-4 w-8 bg-gray-200 rounded" />
                                        <div className="h-8 w-8 rounded border border-[#B5B5B5]/60" />
                                    </div>

                                    <div className="h-4 w-20 bg-gray-200 rounded" />
                                    <div className="h-4 w-10 bg-gray-200 rounded" />
                                </div>

                                <div className="h-px bg-[#B5B5B5]/30 mt-4" />
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Derecha: resumen */}
                <aside className="rounded-lg border border-[#B5B5B5]/40 bg-white p-4 animate-pulse">
                    <div className="h-5 w-24 bg-gray-200 rounded mb-4" />

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>
                        <div className="flex justify-between">
                            <div className="h-3 w-16 bg-gray-200 rounded" />
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                    </div>

                    <div className="h-10 w-full rounded-md bg-gray-200 mt-5" />
                </aside>
            </div>
        </main>
    );
}