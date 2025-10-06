// src/app/fix-images/page.tsx
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import FixImagesClient from "@/components/admin/FixImagesClient";

export const metadata = {
    title: "Gestión de Imágenes - Elecsion",
    description: "Herramienta para administradores para gestionar imágenes de productos",
};

export default async function FixImagesPage() {
    const session = await getSession();

    // Verificar autenticación y permisos
    if (!session?.user) {
        redirect("/login");
    }

    if (!["ADMIN", "SELLER"].includes(session.user.role)) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#1C1C1C]">
                        Gestión de Imágenes de Productos
                    </h1>
                    <p className="text-[#646464] mt-2">
                        Identifica y sube imágenes para productos que aún no las tienen
                    </p>
                </div>

                <FixImagesClient />
            </div>
        </div>
    );
}