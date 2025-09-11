import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea admin
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Solo administradores pueden acceder a esta información" }, { status: 403 });
        }

        // Obtener vendedores y administradores para asignar a clientes
        const sellers = await prisma.user.findMany({
            where: {
                role: {
                    in: ["SELLER", "ADMIN"]
                },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: [
                { role: "desc" }, // SELLER antes que ADMIN
                { name: "asc" }
            ]
        });

        return NextResponse.json(sellers);

    } catch (error) {
        console.error("Error fetching sellers:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}