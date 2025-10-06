import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initializeCounters() {
    try {
        console.log("Inicializando contadores basándose en datos existentes...");

        // Contar cotizaciones existentes
        const quotesCount = await prisma.order.count({
            where: {
                type: "QUOTE"
            }
        });

        // Contar pedidos existentes
        const ordersCount = await prisma.order.count({
            where: {
                type: "ORDER"
            }
        });

        console.log(`Cotizaciones existentes: ${quotesCount}`);
        console.log(`Pedidos existentes: ${ordersCount}`);

        // Crear o actualizar contador de cotizaciones
        await prisma.counter.upsert({
            where: { name: "quote" },
            update: { value: quotesCount },
            create: {
                name: "quote",
                value: quotesCount
            }
        });

        // Crear o actualizar contador de pedidos
        await prisma.counter.upsert({
            where: { name: "order" },
            update: { value: ordersCount },
            create: {
                name: "order",
                value: ordersCount
            }
        });

        console.log("✅ Contadores inicializados exitosamente:");
        console.log(`- Próxima cotización será: COT-${quotesCount + 1}`);
        console.log(`- Próximo pedido será: ORD-${ordersCount + 1}`);

    } catch (error) {
        console.error("❌ Error inicializando contadores:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    initializeCounters();
}

export { initializeCounters };