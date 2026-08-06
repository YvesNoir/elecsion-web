import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const args = process.argv.slice(2);
const rawLimit = args.find((arg) => arg.startsWith("--limit="))?.split("=")[1];
const parsedLimit = rawLimit ? Number(rawLimit) : 0;
const apply = args.includes("--apply");

async function main() {
    const { syncProductsTangoFromSheet } = await import("../src/lib/products-tango-sync");
    const result = await syncProductsTangoFromSheet({
        apply,
        limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 0,
    });
    console.log(apply ? "Modo APPLY: se guardaron registros en products_tango." : "Modo PRUEBA: no se modificó la base de datos.");
    console.log(result);
}

main().catch((error) => {
    console.error("Error sincronizando Google Sheets:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
