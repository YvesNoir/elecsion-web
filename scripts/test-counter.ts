import { generateQuoteCode, generateOrderCode } from "../src/lib/counter";

async function testCounters() {
    try {
        console.log("Probando generación de códigos secuenciales...");

        // Generar 3 códigos de cotización
        console.log("\n🔵 Generando códigos de cotización:");
        for (let i = 1; i <= 3; i++) {
            const code = await generateQuoteCode();
            console.log(`${i}. ${code}`);
        }

        // Generar 3 códigos de pedido
        console.log("\n🟢 Generando códigos de pedido:");
        for (let i = 1; i <= 3; i++) {
            const code = await generateOrderCode();
            console.log(`${i}. ${code}`);
        }

        console.log("\n✅ Test completado exitosamente");

    } catch (error) {
        console.error("❌ Error en el test:", error);
    }
}

testCounters();