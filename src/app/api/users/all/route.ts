import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea admin o seller
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (!["ADMIN", "SELLER"].includes(session.user.role as string)) {
            return NextResponse.json({ error: "Solo administradores y vendedores pueden acceder a esta información" }, { status: 403 });
        }

        // Obtener parámetros de filtro
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get("role");
        const activeFilter = searchParams.get("active");

        // Construir filtros dinámicos
        const whereClause: any = {
            // No filtrar por deleted aquí, el cliente maneja el filtrado
        };

        if (roleFilter) {
            whereClause.role = roleFilter;
        }

        if (activeFilter !== null) {
            whereClause.isActive = activeFilter === "true";
        }

        // Obtener usuarios filtrados
        const users = await prisma.user.findMany({
            where: whereClause,
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
                company: true,
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

        return NextResponse.json({ users });

    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}