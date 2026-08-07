import { google } from "googleapis";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";

type SheetRow = {
    articleCode: string;
    description: string;
    additionalDescription: string | null;
    synonym: string | null;
    priceListCode: string;
    priceListDescription: string | null;
    price: Prisma.Decimal;
    stockQty: Prisma.Decimal | null;
    taxRate: Prisma.Decimal | null;
    isActive: boolean;
    brandName: string | null;
    currency: string;
    rawData: Prisma.InputJsonValue;
    hasAdditionalDescriptionColumn: boolean;
    hasSynonymColumn: boolean;
    hasStockColumn: boolean;
    hasTaxRateColumn: boolean;
    hasActiveColumn: boolean;
    hasBrandColumn: boolean;
    hasCurrencyColumn: boolean;
};

const DEFAULT_STOCK = new Prisma.Decimal(100);
const DEFAULT_TAX_RATE = new Prisma.Decimal("0.21");

// Tango utiliza los primeros cinco caracteres del código de artículo para
// identificar la marca. Algunos prefijos incluyen un número, por eso se
// mantienen exactamente como aparecen en los códigos.
const BRAND_BY_ARTICLE_PREFIX: Record<string, string> = {
    ANTHA: "Anthay Electronica",
    CHINT: "Chint",
    CONDU: "Conductres",
    CORIL: "Corilux",
    DIBAP: "Dibaplast",
    ELECE: "Elece",
    ELEKT: "Elektron",
    ELENT: "Elektron",
    ENERG: "Energizer",
    EXULT: "Exultt",
    FERRE: "Ferreteria",
    FERRO: "Ferreteria",
    FLEXI: "Flexivolt",
    GENRO: "Genro",
    HUFER: "Huferjo",
    HYDRA: "Hydra",
    INDRA: "Indra",
    JADEV: "Jadever",
    JELUZ: "Jeluz",
    KALOP: "Kalop",
    KING0: "King",
    MACRO: "Macroled",
    MOTA0: "Mota",
    MOTA1: "Mota",
    PRIOL: "Priolo",
    PROTO: "Protovolt",
    REDEC: "Redec",
    RICHI: "Richi",
    RIO00: "Rio",
    ROKER: "Roker",
    SICA0: "Sica",
    SYBYD: "Sybyd",
    TAAD0: "Taad",
    TACSA: "Tacsa",
    TBCIN: "TBCin",
    TECLA: "Tecla",
    TECNO: "Tecnocom",
    TREFI: "Trefi",
    TUNIS: "Tunisan",
    VIYIL: "Viyilant",
    WAGO0: "Wago",
    YARLU: "Yarlux",
};

export type ProductsTangoSyncResult = {
    sheetRows: number;
    usableRows: number;
    selectedRows: number;
    created: number;
    updated: number;
    matched?: number;
    unmatched?: number;
    unmatchedArticleCodes?: string[];
    cleared?: number;
    preview?: ProductsTangoOfferPreview[];
};

export type ProductsTangoOfferPreview = {
    articleCode: string;
    regularPrice: string | null;
    currentOfferPrice: string | null;
    newOfferPrice: string;
    action: "update" | "unchanged" | "not-found";
};

export type ProductsTangoSheetSource = "web" | "offers";

type SheetConfig = {
    spreadsheetId: string;
    tab: string;
    defaultPriceListCode: string;
};

function requiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Falta la variable de entorno ${name}`);
    return value;
}

function getSheetConfig(source: ProductsTangoSheetSource): SheetConfig {
    if (source === "offers") {
        return {
            spreadsheetId: process.env.GOOGLE_SHEETS_OFFERS_SPREADSHEET_ID?.trim()
                || requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID"),
            tab: requiredEnv("GOOGLE_SHEETS_OFFERS_TAB"),
            defaultPriceListCode: process.env.GOOGLE_SHEETS_OFFERS_PRICE_LIST_CODE?.trim() || "11",
        };
    }

    return {
        spreadsheetId: requiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID"),
        tab: requiredEnv("GOOGLE_SHEETS_TAB"),
        defaultPriceListCode: TANGO_WEB_PRICE_LIST_CODE,
    };
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

function inferBrandName(articleCode: string): string | null {
    const prefix = articleCode.trim().slice(0, 5).toUpperCase();
    return BRAND_BY_ARTICLE_PREFIX[prefix] ?? null;
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

function hasColumn(indexes: Map<string, number>, aliases: string[]): boolean {
    return aliases.some((alias) => indexes.has(normalizeKey(alias)));
}

function sheetRange(tab: string): string {
    const escaped = tab.replace(/'/g, "''");
    return `'${escaped}'!A:Z`;
}

async function readSheet(source: ProductsTangoSheetSource): Promise<{ headers: string[]; rows: unknown[][]; config: SheetConfig }> {
    const config = getSheetConfig(source);
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
            private_key: requiredEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: sheetRange(config.tab),
        majorDimension: "ROWS",
        valueRenderOption: "UNFORMATTED_VALUE",
    });

    const values = response.data.values ?? [];
    if (values.length === 0) throw new Error("La hoja no contiene filas.");

    const headers = values[0].map((value) => String(value ?? "").trim());
    const normalizedHeaders = new Set(headers.map(normalizeKey));
    const missing = ["codarticulo", "descripcion", "precio"]
        .filter((header) => {
            if (header === "descripcion" && source === "offers") {
                return !["descripcion", "descripcionarticulo"].some((alias) => normalizedHeaders.has(alias));
            }
            return !normalizedHeaders.has(header);
        });
    if (missing.length > 0) {
        throw new Error(`Faltan columnas obligatorias en la hoja: ${missing.join(", ")}`);
    }

    return { headers, rows: values.slice(1), config };
}

function normalizeRows(headers: string[], rows: unknown[][], config: SheetConfig): SheetRow[] {
    const indexes = new Map(headers.map((header, index) => [normalizeKey(header), index]));
    const synonymAliases = ["Sinónimo", "Sinonimo", "AlternativeCode"];
    const stockAliases = ["Stock", "Existencia", "Cantidad"];
    const taxRateAliases = ["Iva", "IVA", "TaxRate"];
    const activeAliases = ["Activo", "Active"];
    const brandAliases = ["Marca", "Brand"];
    const currencyAliases = ["Moneda", "Currency"];
    const priceListCodeAliases = ["Cód. Lista", "Cod. Lista", "CodigoLista", "PriceListCode"];
    const priceListDescriptionAliases = ["Desc. Lista", "Descripción de lista", "DescripcionLista", "PriceListDescription"];
    const additionalDescriptionAliases = [
        "Descripción adicional artículo",
        "Descripcion adicional articulo",
        "AdditionalDescription",
    ];
    const result: SheetRow[] = [];

    for (const row of rows) {
        const articleCode = text(getValue(row, indexes, ["Cód. Artículo", "CodigoArticulo", "SKU", "Codigo"]));
        if (!articleCode) continue;

        const description = text(getValue(row, indexes, [
            "Descripción",
            "Descripcion",
            "Descripción artículo",
            "Descripcion artículo",
            "Nombre",
        ]));
        const price = parseDecimal(getValue(row, indexes, ["Precio", "Price"]));
        if (!description || price === null) continue;

        const rawData: Record<string, unknown> = {};
        headers.forEach((header, index) => { rawData[header] = row[index] ?? null; });

        result.push({
            articleCode,
            description,
            additionalDescription: text(getValue(row, indexes, additionalDescriptionAliases)),
            synonym: text(getValue(row, indexes, ["Sinónimo", "Sinonimo", "AlternativeCode"])),
            priceListCode: text(getValue(row, indexes, priceListCodeAliases)) ?? config.defaultPriceListCode,
            priceListDescription: text(getValue(row, indexes, priceListDescriptionAliases)),
            price,
            stockQty: parseDecimal(getValue(row, indexes, ["Stock", "Existencia", "Cantidad"])) ?? DEFAULT_STOCK,
            taxRate: parseTaxRate(getValue(row, indexes, ["Iva", "IVA", "TaxRate"])) ?? DEFAULT_TAX_RATE,
            isActive: true,
            brandName: inferBrandName(articleCode)
                ?? text(getValue(row, indexes, brandAliases)),
            currency: text(getValue(row, indexes, ["Moneda", "Currency"]))
                ?? process.env.GOOGLE_SHEETS_DEFAULT_CURRENCY
                ?? "ARS",
            rawData: asJsonValue(rawData),
            hasAdditionalDescriptionColumn: hasColumn(indexes, additionalDescriptionAliases),
            hasSynonymColumn: hasColumn(indexes, synonymAliases),
            hasStockColumn: hasColumn(indexes, stockAliases),
            hasTaxRateColumn: hasColumn(indexes, taxRateAliases),
            hasActiveColumn: hasColumn(indexes, activeAliases),
            hasBrandColumn: hasColumn(indexes, brandAliases),
            hasCurrencyColumn: hasColumn(indexes, currencyAliases),
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
                priceListCode: { in: Array.from(new Set(batch.map((row) => row.priceListCode))) },
            },
            select: {
                articleCode: true,
                priceListCode: true,
                priceListDescription: true,
                additionalDescription: true,
                synonym: true,
                currency: true,
                stockQty: true,
                taxRate: true,
                isActive: true,
                brandName: true,
            },
        });
        const existingKeys = new Set(existing.map((row) => `${row.articleCode}::${row.priceListCode}`));
        const existingByKey = new Map(
            existing.map((row) => [`${row.articleCode}::${row.priceListCode}`, row])
        );

        await prisma.$transaction(batch.map((row) => {
            const key = `${row.articleCode}::${row.priceListCode}`;
            const current = existingByKey.get(key);

            return prisma.productsTango.upsert({
                where: {
                    articleCode_priceListCode: {
                        articleCode: row.articleCode,
                        priceListCode: row.priceListCode,
                    },
                },
                update: {
                    // Estos son los datos que sí se revisan en cada exportación.
                    description: row.description,
                    additionalDescription: row.hasAdditionalDescriptionColumn
                        ? row.additionalDescription
                        : current?.additionalDescription ?? row.additionalDescription,
                    price: row.price,
                    priceListDescription: row.priceListDescription ?? current?.priceListDescription ?? "Google Sheets",
                    synonym: row.hasSynonymColumn ? row.synonym : current?.synonym ?? row.synonym,
                    currency: row.hasCurrencyColumn ? row.currency : current?.currency ?? row.currency,
                    // Si la exportación no trae estas columnas, se conserva el valor actual.
                    stockQty: row.hasStockColumn ? row.stockQty : current?.stockQty ?? row.stockQty,
                    taxRate: row.hasTaxRateColumn ? row.taxRate : current?.taxRate ?? row.taxRate,
                    isActive: row.hasActiveColumn ? row.isActive : current?.isActive ?? row.isActive,
                    brandName: row.hasBrandColumn ? row.brandName : current?.brandName ?? row.brandName,
                    rawData: row.rawData,
                    fetchedAt: new Date(),
                },
                create: {
                    articleCode: row.articleCode,
                    description: row.description,
                    additionalDescription: row.additionalDescription,
                    synonym: row.synonym,
                    priceListCode: row.priceListCode,
                    priceListDescription: row.priceListDescription ?? "Google Sheets",
                    price: row.price,
                    currency: row.currency,
                    stockQty: row.stockQty,
                    taxRate: row.taxRate,
                    isActive: row.isActive,
                    brandName: row.brandName,
                    rawData: row.rawData,
                    fetchedAt: new Date(),
                },
            });
        }));

        for (const row of batch) {
            if (existingKeys.has(`${row.articleCode}::${row.priceListCode}`)) updated++;
            else created++;
        }
    }

    return { created, updated };
}

function decimalToString(value: Prisma.Decimal | null | undefined): string | null {
    return value === null || value === undefined ? null : value.toFixed(4);
}

async function previewOfferRows(rows: SheetRow[]): Promise<{
    matched: number;
    unmatched: number;
    unmatchedArticleCodes: string[];
    preview: ProductsTangoOfferPreview[];
}> {
    const existing = await prisma.productsTango.findMany({
        where: {
            articleCode: { in: rows.map((row) => row.articleCode) },
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
        },
        select: {
            articleCode: true,
            price: true,
            offerPrice: true,
        },
    });
    const existingByCode = new Map(existing.map((row) => [row.articleCode, row]));
    const preview = rows.map((row) => {
        const current = existingByCode.get(row.articleCode);
        const newOfferPrice = decimalToString(row.price)!;

        return {
            articleCode: row.articleCode,
            regularPrice: decimalToString(current?.price),
            currentOfferPrice: decimalToString(current?.offerPrice),
            newOfferPrice,
            action: !current
                ? "not-found"
                : current.offerPrice?.equals(row.price)
                    ? "unchanged"
                    : "update",
        } satisfies ProductsTangoOfferPreview;
    });

    return {
        matched: preview.filter((row) => row.action !== "not-found").length,
        unmatched: preview.filter((row) => row.action === "not-found").length,
        unmatchedArticleCodes: preview
            .filter((row) => row.action === "not-found")
            .map((row) => row.articleCode),
        preview,
    };
}

async function saveOfferRows(rows: SheetRow[]) {
    if (rows.length === 0) throw new Error("La pestaña Ofertas no tiene productos utilizables.");

    const codes = Array.from(new Set(rows.map((row) => row.articleCode)));
    const existing = await prisma.productsTango.findMany({
        where: {
            articleCode: { in: codes },
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
        },
        select: { articleCode: true },
    });
    const existingCodes = new Set(existing.map((row) => row.articleCode));
    const matchedRows = rows.filter((row) => existingCodes.has(row.articleCode));

    const result = await prisma.$transaction(async (transaction) => {
        const clearedResult = await transaction.productsTango.updateMany({
            where: {
                priceListCode: TANGO_WEB_PRICE_LIST_CODE,
                offerPrice: { not: null },
            },
            data: { offerPrice: null },
        });

        if (matchedRows.length > 0) {
            const cases = matchedRows.map((row) =>
                Prisma.sql`WHEN ${row.articleCode} THEN ${row.price}`
            );
            const articleCodes = matchedRows.map((row) => row.articleCode);

            await transaction.$executeRaw(Prisma.sql`
                UPDATE products_tango
                SET offer_price = CASE article_code
                    ${Prisma.join(cases, " ")}
                    ELSE offer_price
                END,
                updated_at = NOW()
                WHERE price_list_code = ${TANGO_WEB_PRICE_LIST_CODE}
                  AND article_code IN (${Prisma.join(articleCodes)})
            `);
        }

        return { cleared: clearedResult.count };
    });

    return {
        created: 0,
        updated: matchedRows.length,
        matched: matchedRows.length,
        unmatched: rows.length - matchedRows.length,
        cleared: result.cleared,
    };
}

export async function syncProductsTangoFromSheet(options: { apply?: boolean; limit?: number; source?: ProductsTangoSheetSource } = {}): Promise<ProductsTangoSyncResult> {
    const source = options.source ?? "web";
    const { headers, rows, config } = await readSheet(source);
    const normalized = normalizeRows(headers, rows, config);
    const selected = options.limit && options.limit > 0
        ? normalized.slice(0, Math.floor(options.limit))
        : normalized;

    if (source === "offers") {
        if (options.apply && options.limit) {
            throw new Error("No se permite aplicar Ofertas con --limit: la sincronización debe leer la lista completa.");
        }

        const comparison = await previewOfferRows(selected);
        const applied = options.apply
            ? await saveOfferRows(normalized)
            : { created: 0, updated: 0, cleared: 0 };

        return {
            sheetRows: rows.length,
            usableRows: normalized.length,
            selectedRows: selected.length,
            ...applied,
            matched: comparison.matched,
            unmatched: comparison.unmatched,
            unmatchedArticleCodes: comparison.unmatchedArticleCodes,
            preview: options.apply || !options.limit ? undefined : comparison.preview,
        };
    }

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
