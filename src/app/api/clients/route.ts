import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, id: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        let clients = [];

        switch (user.role) {
            case "ADMIN":
                // Admin puede ver todos los clientes
                clients = await prisma.user.findMany({
                    where: {
                        role: "CLIENT",
                        deleted: false,
                        isActive: true
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    },
                    orderBy: [
                        { company: "asc" },
                        { name: "asc" }
                    ]
                });
                break;

            case "SELLER":
                // Seller solo puede ver sus clientes asignados
                clients = await prisma.user.findMany({
                    where: {
                        role: "CLIENT",
                        assignedSellerId: user.id,
                        deleted: false,
                        isActive: true
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    },
                    orderBy: [
                        { company: "asc" },
                        { name: "asc" }
                    ]
                });
                break;

            case "CLIENT":
                // Client solo puede verse a sí mismo
                clients = await prisma.user.findMany({
                    where: {
                        id: user.id,
                        role: "CLIENT"
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        company: true
                    }
                });
                break;

            default:
                return NextResponse.json({ error: "Rol no autorizado" }, { status: 403 });
        }

        return NextResponse.json({ clients });

    } catch (error) {
        console.error("Error fetching clients:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}