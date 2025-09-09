// scripts/import-from-xlsx.ts
// Uso:
//   npm run import:xlsx
//   npm run import:xlsx -- ./otra-ruta/archivo.xlsx
//   npm run import:xlsx -- --preview

import "dotenv/config";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_XLSX = path.resolve(process.cwd(), "products-xlsx", "lista-productos.xlsx");
const ARGS = process.argv.slice(2);
const PREVIEW = ARGS.includes("--preview");
const ARG_PATH = ARGS.find((a) => a !== "--preview");
const INPUT_PATH = ARG_PATH ? path.resolve(process.cwd(), ARG_PATH) : DEFAULT_XLSX;

type Row = Record<string, unknown>;
type ParsedRow = {
    brandName: string;
    name: string;
    sku: string;                 // ahora requerido
    currency: "ARS" | "USD";
    price: Prisma.Decimal;
};

function slugify(s: string): string {
    return s
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

function normKeys(row: Row): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(row)) out[k.trim().toLowerCase()] = (row as any)[k];
    return out;
}
function pick(row: Record<string, unknown>, candidates: string[]): any {
    for (const k of candidates) {
        if (k in row && row[k] != null && row[k] !== "") return row[k];
    }
    return undefined;
}
// primera key que contenga fragmentos
function firstKeyContaining(row: Record<string, unknown>, fragments: string[]): string | null {
    const keys = Object.keys(row);
    for (const k of keys) {
        const kk = k.toLowerCase();
        if (fragments.some((f) => kk.includes(f))) return k;
    }
    return null;
}

function parseMoney(input: unknown): { amount: Prisma.Decimal; currency: "ARS" | "USD" } | null {
    if (input == null || input === "") return null;
    let raw = String(input).trim();

    let currency: "ARS" | "USD" | null = null;
    if (/usd|u\$s|us\$|us ?\$|u\$|dolares|dólares/i.test(raw)) currency = "USD";
    if (/(^|\s)(ars|ar\$|\$)(\s|$)/i.test(raw)) currency = currency ?? "ARS";

    raw = raw
        .replace(/(usd|u\$s|us\$|us ?\$|u\$|ars|ar\$|pesos|dolares|dólares|\$)/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    // normalizar separadores
    const hasComma = /,/.test(raw);
    const hasDot = /\./.test(raw);
    let normalized = raw;
    if (hasComma && !hasDot) normalized = raw.replace(/\./g, "").replace(/,/g, ".");
    else if (hasComma && hasDot) normalized = raw.replace(/\./g, "").replace(/,/g, ".");

    const n = Number(normalized);
    if (!isFinite(n)) return null;
    return { amount: new Prisma.Decimal(n), currency: (currency ?? "ARS") as "ARS" | "USD" };
}

function parseRow(rowIn: Row): ParsedRow | null {
    const row = normKeys(rowIn);

    const brandNameRaw =
        pick(row, ["marca", "brand", "proveedor", "fabricante"]) ??
        row[firstKeyContaining(row, ["marca", "brand", "proveedor", "fabricante"]) ?? ""] ?? "";
    const brandName = String(brandNameRaw ?? "").trim();

    const nameRaw =
        pick(row, ["nombre", "name", "descripcion", "descripción", "producto", "detalle"]) ??
        row[firstKeyContaining(row, ["descrip", "nombre", "description", "producto", "detalle"]) ?? ""] ?? "";
    const name = String(nameRaw ?? "").trim();

    const skuRaw =
        pick(row, ["sku", "codigo", "código", "cod", "item", "referencia"]) ??
        row[firstKeyContaining(row, ["sku", "cód", "cod", "item", "ref"]) ?? ""] ?? "";
    const sku = String(skuRaw ?? "").trim();

    if (!brandName || !name || !sku) return null; // ahora SKU requerido

    let currencyExplicit = (pick(row, ["moneda", "currency"]) ?? "").toString().trim().toUpperCase();
    if (/(^usd$|^u\$s$|^us\$|^us$)/i.test(currencyExplicit)) currencyExplicit = "USD";
    if (/(^ars$|^\$$|^ar\$)/i.test(currencyExplicit)) currencyExplicit = "ARS";
    let currency: "ARS" | "USD" | undefined =
        currencyExplicit === "USD" || currencyExplicit === "ARS"
            ? (currencyExplicit as "ARS" | "USD")
            : undefined;

    const priceCell =
        pick(row, [
            "precio unit s/iva",
            "precio sin iva",
            "precio unitario",
            "precio",
            "p.unit",
            "p unit",
            "unit price",
            "price",
        ]) ?? row[firstKeyContaining(row, ["precio", "price", "p.unit", "p unit"]) ?? ""];

    let price: Prisma.Decimal = new Prisma.Decimal(0);
    if (priceCell != null && priceCell !== "") {
        const parsed = parseMoney(priceCell);
        if (parsed) {
            price = parsed.amount;
            currency = (currency ?? parsed.currency) as "ARS" | "USD";
        }
    }
    currency = (currency ?? "ARS") as "ARS" | "USD";

    return { brandName, name, sku, price, currency };
}

async function main() {
    console.log("📄 Archivo a importar:", INPUT_PATH);
    if (!fs.existsSync(INPUT_PATH)) {
        console.error("❌ No se encontró el archivo:", INPUT_PATH);
        process.exit(1);
    }

    const wb = XLSX.readFile(INPUT_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });

    if (!rows.length) {
        console.warn("⚠️  La planilla no tiene filas.");
        return;
    }

    if (PREVIEW) {
        const keys = Object.keys(normKeys(rows[0]));
        console.log("🔎 Claves detectadas (primera fila):", keys);
        const sample = rows.slice(0, 5).map((r) => parseRow(r));
        console.log("🔎 Muestra parseada (5 filas):", sample);
    }

    console.log(`🧾 Filas leídas: ${rows.length}`);

    const brandCache = new Map<string, string>();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of rows) {
        const parsed = parseRow(r);
        if (!parsed) {
            skipped++;
            continue;
        }

        const { brandName, name, sku, price, currency } = parsed;

        // upsert de marca (cacheado)
        let brandId = brandCache.get(brandName);
        if (!brandId) {
            const slug = slugify(brandName);
            const b = await prisma.brand.upsert({
                where: { slug },
                update: { name: brandName },
                create: { name: brandName, slug },
                select: { id: true },
            });
            brandId = b.id;
            brandCache.set(brandName, brandId);
        }

        // buscar por SKU (único)
        const existing = await prisma.product.findUnique({ where: { sku } });

        if (existing) {
            await prisma.product.update({
                where: { sku },
                data: {
                    name,                 // si no querés cambiar el nombre, quítalo
                    priceBase: price,
                    currency,
                    // Si querés que también cambie la marca según la planilla, descomenta:
                    // brandId,
                },
            });
            updated++;
        } else {
            await prisma.product.create({
                data: {
                    sku,
                    name,
                    brandId,
                    priceBase: price,
                    currency,
                },
            });
            created++;
        }
    }

    console.log("✅ Importación finalizada.");
    console.log({ filas: rows.length, creados: created, actualizados: updated, ignorados: skipped });
}

main()
    .catch((e) => {
        console.error("❌ Error en importación:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });