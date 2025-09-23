import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword, confirmPassword } = body;

        // Validaciones
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { error: "Todos los campos son obligatorios" }, 
                { status: 400 }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { error: "La nueva contraseña y la confirmación no coinciden" }, 
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "La nueva contraseña debe tener al menos 6 caracteres" }, 
                { status: 400 }
            );
        }

        // Obtener el usuario actual
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Verificar la contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: "La contraseña actual es incorrecta" }, 
                { status: 400 }
            );
        }

        // Hash de la nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Actualizar la contraseña en la base de datos
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: hashedNewPassword }
        });

        return NextResponse.json({
            success: true,
            message: "Contraseña actualizada exitosamente"
        });

    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}