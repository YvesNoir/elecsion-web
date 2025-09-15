import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Obtener los datos del cuerpo de la petición
        const body = await request.json();
        const { name, phone, company, address, city, state, zip } = body;

        // Validar que al menos un campo esté presente
        if (!name && !phone && !company && !address && !city && !state && !zip) {
            return NextResponse.json({ 
                error: "Debe proporcionar al menos un campo para actualizar" 
            }, { status: 400 });
        }

        // Buscar al usuario por email
        const existingUser = await prisma.user.findUnique({
            where: { email: session.user.email! }
        });

        if (!existingUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Actualizar el usuario con los nuevos datos
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email! },
            data: {
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(company !== undefined && { company }),
                ...(address !== undefined && { address }),
                ...(city !== undefined && { city }),
                ...(state !== undefined && { state }),
                ...(zip !== undefined && { zip }),
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                address: true,
                city: true,
                state: true,
                zip: true,
                role: true,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: "Perfil actualizado exitosamente"
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}