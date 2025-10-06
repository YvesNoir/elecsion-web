import { prisma } from "@/lib/db";

/**
 * Obtiene el siguiente número secuencial para un contador dado
 * @param counterName - Nombre del contador (ej: 'quote', 'order')
 * @returns El siguiente número secuencial
 */
export async function getNextSequentialNumber(counterName: string): Promise<number> {
    try {
        // Usar transacción para evitar condiciones de carrera
        const result = await prisma.$transaction(async (tx) => {
            // Buscar el contador existente
            let counter = await tx.counter.findUnique({
                where: { name: counterName }
            });

            // Si no existe, crearlo con valor inicial 1
            if (!counter) {
                counter = await tx.counter.create({
                    data: {
                        name: counterName,
                        value: 1
                    }
                });
                return 1;
            }

            // Incrementar el contador y retornar el nuevo valor
            const updatedCounter = await tx.counter.update({
                where: { name: counterName },
                data: {
                    value: {
                        increment: 1
                    }
                }
            });

            return updatedCounter.value;
        });

        return result;
    } catch (error) {
        console.error(`Error getting next sequential number for ${counterName}:`, error);
        throw error;
    }
}

/**
 * Genera un código de cotización secuencial
 * @returns Código en formato COT-1, COT-2, etc.
 */
export async function generateQuoteCode(): Promise<string> {
    const nextNumber = await getNextSequentialNumber('quote');
    return `COT-${nextNumber}`;
}

/**
 * Genera un código de pedido secuencial
 * @returns Código en formato ORD-1, ORD-2, etc.
 */
export async function generateOrderCode(): Promise<string> {
    const nextNumber = await getNextSequentialNumber('order');
    return `ORD-${nextNumber}`;
}

/**
 * Resetea un contador a un valor específico (útil para testing o migración)
 * @param counterName - Nombre del contador
 * @param value - Valor al cual resetear
 */
export async function resetCounter(counterName: string, value: number = 0): Promise<void> {
    await prisma.counter.upsert({
        where: { name: counterName },
        update: { value },
        create: {
            name: counterName,
            value
        }
    });
}