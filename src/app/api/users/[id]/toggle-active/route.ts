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
            return NextResponse.json({ error: "Solo administradores pueden cambiar el estado de usuarios" }, { status: 403 });
        }

        const userId = (await params).id;

        // Verificar que el usuario a modificar existe
        const userToUpdate = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToUpdate) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // No permitir que el admin se marque como eliminado a sí mismo
        if (userId === session.user.id) {
            return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
        }

        // Cambiar el estado deleted del usuario
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                deleted: !userToUpdate.deleted
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: updatedUser.deleted 
                ? "Usuario marcado como eliminado exitosamente" 
                : "Usuario restaurado exitosamente"
        });

    } catch (error) {
        console.error("Error updating user deleted status:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}