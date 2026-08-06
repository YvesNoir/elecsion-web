import { google } from "googleapis";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";

type SheetRow = {
    articleCode: string;
    description: string;
    synonym: string | null;
    price: Prisma.Decimal;
    stockQty: Prisma.Decimal | null;
    taxRate: Prisma.Decimal | null;
    isActive: boolean;
    brandName: string | null;
    currency: string;
    rawData: Prisma.InputJsonValue;
};

export type ProductsTangoSyncResult = {
    sheetRows: number;
    usableRows: number;
    selectedRows: number;
    created: number;
    updated: number;
};

function requiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Falta la variable de entorno ${name}`);
    return value;
}

function normalizeKey(value: unknown): string {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function text(value: unknown): string | null {
    if (value === null || value === undefined || value === "") return null;
    const result = String(value).trim();
    return result || null;
}

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;

    const raw = String(value).trim().replace(/%/g, "").replace(/[^0-9,.-]/g, "");
    if (!raw) return null;

    const normalized = raw.includes(",") && raw.includes(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(",", ".");
    const result = Number(normalized);
    return Number.isFinite(result) ? result : null;
}

function parseDecimal(value: unknown): Prisma.Decimal | null {
    const number = parseNumber(value);
    return number === null ? null : new Prisma.Decimal(number);
}

function parseTaxRate(value: unknown): Prisma.Decimal | null {
    const number = parseNumber(value);
    if (number === null) return null;
    return new Prisma.Decimal(number > 1 ? number / 100 : number);
}

function parseBoolean(value: unknown, fallback = true): boolean {
    if (value === null || value === undefined || value === "") return fallback;
    const normalized = normalizeKey(value);
    if (["si", "s", "true", "1", "yes"].includes(normalized)) return true;
    if (["no", "n", "false", "0"].includes(normalized)) return false;
    return fallback;
}

function asJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getValue(row: unknown[], indexes: Map<string, number>, aliases: string[]): unknown {
    for (const alias of aliases) {
        const index = indexes.get(normalizeKey(alias));
        if (index !== undefined) return row[index];
    }
    return undefined;
}

function sheetRange(tab: string): string {
    const escaped = tab.replace(/'/g, "''");
    return `'${escaped}'!A:Z`;
}

async function readSheet(): Promise<{ headers: string[]; rows: unknown[][] }> {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
            private_key: requiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID"),
        range: sheetRange(requiredEnv("GOOGLE_SHEETS_TAB")),
        majorDimension: "ROWS",
        valueRenderOption: "UNFORMATTED_VALUE",
    });

    const values = response.data.values ?? [];
    if (values.length === 0) throw new Error("La hoja no contiene filas.");

    const headers = values[0].map((value) => String(value ?? "").trim());
    const normalizedHeaders = new Set(headers.map(normalizeKey));
    const missing = ["codarticulo", "descripcion", "precio"]
        .filter((header) => !normalizedHeaders.has(header));
    if (missing.length > 0) {
        throw new Error(`Faltan columnas obligatorias en la hoja: ${missing.join(", ")}`);
    }

    return { headers, rows: values.slice(1) };
}

function normalizeRows(headers: string[], rows: unknown[][]): SheetRow[] {
    const indexes = new Map(headers.map((header, index) => [normalizeKey(header), index]));
    const result: SheetRow[] = [];

    for (const row of rows) {
        const articleCode = text(getValue(row, indexes, ["Cód. Artículo", "CodigoArticulo", "SKU", "Codigo"]));
        if (!articleCode) continue;

        const description = text(getValue(row, indexes, ["Descripción", "Descripcion", "Nombre"]));
        const price = parseDecimal(getValue(row, indexes, ["Precio", "Price"]));
        if (!description || price === null) continue;

        const rawData: Record<string, unknown> = {};
        headers.forEach((header, index) => { rawData[header] = row[index] ?? null; });

        result.push({
            articleCode,
            description,
            synonym: text(getValue(row, indexes, ["Sinónimo", "Sinonimo", "AlternativeCode"])),
            price,
            stockQty: parseDecimal(getValue(row, indexes, ["Stock", "Existencia", "Cantidad"])),
            taxRate: parseTaxRate(getValue(row, indexes, ["Iva", "IVA", "TaxRate"])),
            isActive: parseBoolean(getValue(row, indexes, ["Activo", "Active"])),
            brandName: text(getValue(row, indexes, ["Marca", "Brand"])),
            currency: text(getValue(row, indexes, ["Moneda", "Currency"]))
                ?? process.env.GOOGLE_SHEETS_DEFAULT_CURRENCY
                ?? "ARS",
            rawData: asJsonValue(rawData),
        });
    }

    return result;
}

async function saveRows(rows: SheetRow[]) {
    let created = 0;
    let updated = 0;

    for (let offset = 0; offset < rows.length; offset += 100) {
        const batch = rows.slice(offset, offset + 100);
        const existing = await prisma.productsTango.findMany({
            where: {
                articleCode: { in: batch.map((row) => row.articleCode) },
                priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            },
            select: { articleCode: true, priceListCode: true },
        });
        const existingKeys = new Set(existing.map((row) => `${row.articleCode}::${row.priceListCode}`));

        await prisma.$transaction(batch.map((row) => prisma.productsTango.upsert({
            where: {
                articleCode_priceListCode: {
                    articleCode: row.articleCode,
                    priceListCode: TANGO_WEB_PRICE_LIST_CODE,
                },
            },
            update: {
                description: row.description,
                synonym: row.synonym,
                price: row.price,
                currency: row.currency,
                stockQty: row.stockQty,
                taxRate: row.taxRate,
                isActive: row.isActive,
                brandName: row.brandName,
                priceListDescription: "Google Sheets",
                rawData: row.rawData,
                fetchedAt: new Date(),
            },
            create: {
                articleCode: row.articleCode,
                description: row.description,
                synonym: row.synonym,
                priceListCode: TANGO_WEB_PRICE_LIST_CODE,
                priceListDescription: "Google Sheets",
                price: row.price,
                currency: row.currency,
                stockQty: row.stockQty,
                taxRate: row.taxRate,
                isActive: row.isActive,
                brandName: row.brandName,
                rawData: row.rawData,
                fetchedAt: new Date(),
            },
        })));

        for (const row of batch) {
            if (existingKeys.has(`${row.articleCode}::${TANGO_WEB_PRICE_LIST_CODE}`)) updated++;
            else created++;
        }
    }

    return { created, updated };
}

export async function syncProductsTangoFromSheet(options: { apply?: boolean; limit?: number } = {}): Promise<ProductsTangoSyncResult> {
    const { headers, rows } = await readSheet();
    const normalized = normalizeRows(headers, rows);
    const selected = options.limit && options.limit > 0
        ? normalized.slice(0, Math.floor(options.limit))
        : normalized;
    const result = options.apply === false || selected.length === 0
        ? { created: 0, updated: 0 }
        : await saveRows(selected);

    return {
        sheetRows: rows.length,
        usableRows: normalized.length,
        selectedRows: selected.length,
        ...result,
    };
}
