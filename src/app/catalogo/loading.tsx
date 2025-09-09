// src/app/catalogo/loading.tsx
export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-3">
                    <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-8 bg-gray-200 rounded" />
                        ))}
                    </div>
                </div>
                <div className="col-span-12 md:col-span-9">
                    <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
                    <div className="h-40 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}