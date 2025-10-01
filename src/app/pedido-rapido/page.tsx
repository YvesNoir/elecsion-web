import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PedidoRapidoClient from "@/components/pedido-rapido/PedidoRapidoClient";

export default async function PedidoRapidoPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Verificar que el usuario tenga acceso (CLIENT, SELLER, ADMIN)
    const allowedRoles = ["CLIENT", "SELLER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-[1500px]">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C]">Pedido Rápido</h1>
                    <p className="text-[#646464] mt-1">Crear pedidos para clientes de forma rápida</p>
                </div>

                <PedidoRapidoClient
                    userRole={session.user.role}
                    userId={session.user.id}
                />
            </div>
        </div>
    );
}