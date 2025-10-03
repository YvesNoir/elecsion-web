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
                error: "Solo administradores o el vendedor asignado pueden confirmar este pedido" 
            }, { status: 403 });
        }

        // Verificar que el pedido esté en estado SUBMITTED
        if (order.status !== "SUBMITTED") {
            return NextResponse.json({ 
                error: `El pedido ya está en estado ${order.status} y no puede ser confirmado` 
            }, { status: 400 });
        }

        // Actualizar el estado y tipo del pedido - QUOTE se convierte en ORDER cuando se aprueba
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "APPROVED",
                type: "ORDER", // Cambiar de QUOTE a ORDER
                updatedAt: new Date()
            },
            include: {
                clientUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                sellerUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                items: true
            }
        });

        // Enviar notificación por email al cliente sobre la aprobación
        try {
            const clientName = `${updatedOrder.clientUser?.firstName || ''} ${updatedOrder.clientUser?.lastName || ''}`.trim() || 'Cliente';
            const clientEmail = updatedOrder.clientUser?.email;

            if (clientEmail) {
                const template = emailTemplates.orderApproved(orderId, clientName);
                await sendEmail({
                    to: clientEmail,
                    subject: template.subject,
                    html: template.html
                });
            }
        } catch (emailError) {
            console.error('Error sending approval email notification:', emailError);
            // No interrumpimos el flujo por errores de email
        }

        return NextResponse.json({
            success: true,
            order: updatedOrder,
            message: "Pedido confirmado exitosamente"
        });

    } catch (error) {
        console.error("Error confirming order:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}