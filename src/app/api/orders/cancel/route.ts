// src/app/api/orders/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "ID de orden requerido" }, { status: 400 });
        }

        // Buscar al usuario
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Buscar la orden
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
        }

        // Verificar que la orden pertenece al usuario
        if (order.clientUserId !== user.id) {
            return NextResponse.json({ error: "No tienes permiso para cancelar esta cotización" }, { status: 403 });
        }

        // Verificar que la orden se puede cancelar (solo DRAFT o SUBMITTED)
        if (!['DRAFT', 'SUBMITTED'].includes(order.status)) {
            return NextResponse.json({ error: "Esta cotización no se puede cancelar" }, { status: 400 });
        }

        // Actualizar el estado a CANCELLED
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ 
            message: "Cotización cancelada exitosamente",
            order: updatedOrder
        });

    } catch (error) {
        console.error("Error al cancelar cotización:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}