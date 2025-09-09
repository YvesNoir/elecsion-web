// src/app/producto/[slug]/loading.tsx
export default function LoadingProduct() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
            <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-80 bg-gray-200 rounded" />
                <div className="space-y-4">
                    <div className="h-8 w-3/4 bg-gray-200 rounded" />
                    <div className="h-6 w-1/3 bg-gray-200 rounded" />
                    <div className="h-10 w-40 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}