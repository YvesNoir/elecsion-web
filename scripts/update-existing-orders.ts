import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateExistingOrders() {
    try {
        console.log("Actualizando órdenes existentes sin códigos...");

        // Buscar cotizaciones sin código
        const quotesWithoutCode = await prisma.order.findMany({
            where: {
                type: "QUOTE",
                code: null
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        // Buscar pedidos sin código
        const ordersWithoutCode = await prisma.order.findMany({
            where: {
                type: "ORDER",
                code: null
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        console.log(`Cotizaciones sin código: ${quotesWithoutCode.length}`);
        console.log(`Pedidos sin código: ${ordersWithoutCode.length}`);

        // Actualizar cotizaciones
        let quoteCounter = 1;
        for (const quote of quotesWithoutCode) {
            const code = `COT-${quoteCounter}`;
            await prisma.order.update({
                where: { id: quote.id },
                data: { code }
            });
            console.log(`✅ Cotización ${quote.id} actualizada con código: ${code}`);
            quoteCounter++;
        }

        // Actualizar pedidos
        let orderCounter = 1;
        for (const order of ordersWithoutCode) {
            const code = `ORD-${orderCounter}`;
            await prisma.order.update({
                where: { id: order.id },
                data: { code }
            });
            console.log(`✅ Pedido ${order.id} actualizado con código: ${code}`);
            orderCounter++;
        }

        // Actualizar contadores con el último número usado
        if (quotesWithoutCode.length > 0) {
            await prisma.counter.upsert({
                where: { name: "quote" },
                update: { value: quoteCounter - 1 },
                create: {
                    name: "quote",
                    value: quoteCounter - 1
                }
            });
        }

        if (ordersWithoutCode.length > 0) {
            await prisma.counter.upsert({
                where: { name: "order" },
                update: { value: orderCounter - 1 },
                create: {
                    name: "order",
                    value: orderCounter - 1
                }
            });
        }

        console.log("✅ Todas las órdenes existentes han sido actualizadas con códigos secuenciales");

    } catch (error) {
        console.error("❌ Error actualizando órdenes existentes:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    updateExistingOrders();
}

export { updateExistingOrders };