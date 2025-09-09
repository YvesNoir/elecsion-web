// src/app/producto/[slug]/not-found.tsx
import Link from "next/link";

export default function NotFoundProduct() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-semibold mb-2">Producto no encontrado</h1>
            <p className="text-[#646464] mb-6">
                Puede que el producto haya sido despublicado o el enlace ya no exista.
            </p>
            <Link href="/" className="btn-primary">Volver al inicio</Link>
        </div>
    );
}