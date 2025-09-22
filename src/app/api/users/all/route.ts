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

        // Obtener todos los usuarios
        const users = await prisma.user.findMany({
            orderBy: [
                { role: "asc" },
                { name: "asc" },
                { email: "asc" }
            ],
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                deleted: true,
                createdAt: true,
                assignedSeller: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        clients: {
                            where: {
                                role: "CLIENT" // Solo contar usuarios con rol CLIENT
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(users);

    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}