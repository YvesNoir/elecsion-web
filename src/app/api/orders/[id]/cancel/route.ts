import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();

        // Verificar que el usuario esté logueado
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const orderId = (await params).id;

        // Buscar el pedido
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                clientUser: true,
                sellerUser: true,
                items: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Verificar permisos: debe ser admin o el vendedor asignado al pedido
        const isAdmin = session.user.role === "ADMIN";
        const isAssignedSeller = order.sellerUserId && order.sellerUserId === session.user.id;

        if (!isAdmin && !isAssignedSeller) {
            return NextResponse.json({
                error: "Solo administradores o el vendedor asignado pueden cancelar este pedido"
            }, { status: 403 });
        }

        // Verificar que el pedido pueda ser cancelado (no debe estar ya completado/entregado)
        const nonCancellableStatuses = ["FULFILLED", "SHIPPED", "DELIVERED", "CANCELED"];
        if (nonCancellableStatuses.includes(order.status)) {
            return NextResponse.json({
                error: `El pedido ya está en estado ${order.status} y no puede ser cancelado`
            }, { status: 400 });
        }

        // Actualizar el estado del pedido a CANCELED
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "CANCELED",
                updatedAt: new Date()
            },
            include: {
                clientUser: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                sellerUser: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                items: true
            }
        });

        // Enviar notificación por email al cliente sobre la cancelación
        try {
            const clientName = updatedOrder.clientUser?.name || updatedOrder.quoteName || 'Cliente';
            const clientEmail = updatedOrder.clientUser?.email || updatedOrder.quoteEmail;

            if (clientEmail) {
                const template = emailTemplates.orderCanceled(orderId, clientName);
                await sendEmail({
                    to: clientEmail,
                    subject: template.subject,
                    html: template.html
                });
            }
        } catch (emailError) {
            console.error('Error sending cancellation email notification:', emailError);
            // No interrumpimos el flujo por errores de email
        }

        return NextResponse.json({
            success: true,
            order: updatedOrder,
            message: "Pedido cancelado exitosamente"
        });

    } catch (error) {
        console.error("Error canceling order:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}