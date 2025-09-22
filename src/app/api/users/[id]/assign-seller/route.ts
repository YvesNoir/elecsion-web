import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea admin
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Solo administradores pueden asignar vendedores" }, { status: 403 });
        }

        const userId = (await params).id;
        const body = await request.json();
        const { assignedSellerId } = body;

        // Verificar que el usuario a modificar existe
        const userToUpdate = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToUpdate) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Si se asigna un vendedor, verificar que existe y tiene el rol correcto
        if (assignedSellerId) {
            const seller = await prisma.user.findUnique({
                where: { id: assignedSellerId }
            });

            if (!seller) {
                return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
            }

            if (!["SELLER", "ADMIN"].includes(seller.role)) {
                return NextResponse.json({ error: "El usuario asignado debe ser vendedor o administrador" }, { status: 400 });
            }
        }

        // Actualizar el usuario
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                assignedSellerId: assignedSellerId || null
            },
            include: {
                assignedSeller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: assignedSellerId 
                ? "Vendedor asignado exitosamente" 
                : "Vendedor removido exitosamente"
        });

    } catch (error) {
        console.error("Error updating user assigned seller:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}