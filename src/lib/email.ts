import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        });

        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}

export const emailTemplates = {
    quoteCreatedForClient: (orderNumber: string, clientName: string) => ({
        subject: `Cotización #${orderNumber} - En revisión`,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #384A93; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Elecsion</h1>
                </div>

                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #384A93; margin-bottom: 20px;">¡Hemos recibido tu cotización!</h2>

                    <p>Estimado/a ${clientName},</p>

                    <p>Tu cotización <strong>#${orderNumber}</strong> ha sido recibida correctamente y se encuentra en proceso de revisión.</p>

                    <p>Nuestro equipo de ventas se pondrá en contacto contigo a la brevedad para confirmar los detalles y proceder con la aprobación de la cotización.</p>

                    <div style="background-color: #e1e8f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #384A93;"><strong>Estado actual:</strong> En revisión</p>
                    </div>

                    <p>Si tienes alguna consulta, no dudes en contactarnos.</p>

                    <p>Saludos cordiales,<br>
                    <strong>Equipo de Elecsion</strong></p>
                </div>

                <div style="background-color: #646464; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">Este es un email automático, por favor no respondas a este mensaje.</p>
                </div>
            </div>
        `
    }),

    quoteCreatedForSellers: (orderNumber: string, clientName: string, clientEmail: string) => ({
        subject: `Nueva cotización recibida #${orderNumber}`,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #384A93; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Elecsion - Panel Administrativo</h1>
                </div>

                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #384A93; margin-bottom: 20px;">Nueva cotización recibida</h2>

                    <p>Se ha recibido una nueva cotización que requiere revisión:</p>

                    <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #384A93; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Número de cotización:</strong> #${orderNumber}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Cliente:</strong> ${clientName}</p>
                        <p style="margin: 0;"><strong>Email:</strong> ${clientEmail}</p>
                    </div>

                    <p>Por favor, revisa los detalles de la cotización en el panel administrativo y procede con la aprobación correspondiente.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pedidos-pendientes"
                           style="background-color: #384A93; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver pedidos pendientes
                        </a>
                    </div>

                    <p>Saludos,<br>
                    <strong>Sistema Elecsion</strong></p>
                </div>

                <div style="background-color: #646464; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">Notificación automática del sistema.</p>
                </div>
            </div>
        `
    }),
    orderCreatedForClient: (orderNumber: string, clientName: string) => ({
        subject: `Pedido #${orderNumber} - En revisión`,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #384A93; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Elecsion</h1>
                </div>

                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #384A93; margin-bottom: 20px;">¡Hemos recibido tu pedido!</h2>

                    <p>Estimado/a ${clientName},</p>

                    <p>Tu pedido <strong>#${orderNumber}</strong> ha sido recibido correctamente y se encuentra en proceso de revisión.</p>

                    <p>Nuestro equipo de ventas se pondrá en contacto contigo a la brevedad para confirmar los detalles y proceder con la aprobación del pedido.</p>

                    <div style="background-color: #e1e8f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #384A93;"><strong>Estado actual:</strong> En revisión</p>
                    </div>

                    <p>Si tienes alguna consulta, no dudes en contactarnos.</p>

                    <p>Saludos cordiales,<br>
                    <strong>Equipo de Elecsion</strong></p>
                </div>

                <div style="background-color: #646464; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">Este es un email automático, por favor no respondas a este mensaje.</p>
                </div>
            </div>
        `
    }),

    orderCreatedForSellers: (orderNumber: string, clientName: string, clientEmail: string) => ({
        subject: `Nuevo pedido recibido #${orderNumber}`,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #384A93; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Elecsion - Panel Administrativo</h1>
                </div>

                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #384A93; margin-bottom: 20px;">Nuevo pedido recibido</h2>

                    <p>Se ha recibido un nuevo pedido que requiere revisión:</p>

                    <div style="background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #384A93; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Número de pedido:</strong> #${orderNumber}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Cliente:</strong> ${clientName}</p>
                        <p style="margin: 0;"><strong>Email:</strong> ${clientEmail}</p>
                    </div>

                    <p>Por favor, revisa los detalles del pedido en el panel administrativo y procede con la aprobación correspondiente.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pedidos-pendientes"
                           style="background-color: #384A93; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Ver pedidos pendientes
                        </a>
                    </div>

                    <p>Saludos,<br>
                    <strong>Sistema Elecsion</strong></p>
                </div>

                <div style="background-color: #646464; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">Notificación automática del sistema.</p>
                </div>
            </div>
        `
    }),

    orderApproved: (orderNumber: string, clientName: string) => ({
        subject: `Pedido #${orderNumber} - Aprobado`,
        html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Elecsion</h1>
                </div>

                <div style="padding: 30px; background-color: #f9f9f9;">
                    <h2 style="color: #28a745; margin-bottom: 20px;">¡Tu pedido ha sido aprobado!</h2>

                    <p>Estimado/a ${clientName},</p>

                    <p>Nos complace informarte que tu pedido <strong>#${orderNumber}</strong> ha sido <strong>aprobado</strong>.</p>

                    <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;"><strong>Estado actual:</strong> Aprobado ✓</p>
                    </div>

                    <p>Nuestro equipo de ventas se pondrá en contacto contigo para coordinar los próximos pasos del proceso de entrega.</p>

                    <p>Gracias por confiar en Elecsion.</p>

                    <p>Saludos cordiales,<br>
                    <strong>Equipo de Elecsion</strong></p>
                </div>

                <div style="background-color: #646464; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">Este es un email automático, por favor no respondas a este mensaje.</p>
                </div>
            </div>
        `
    }),
};