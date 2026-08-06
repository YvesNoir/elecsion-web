import dotenv from "dotenv";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

// Next carga .env.local automáticamente; los scripts de Node no lo hacen.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const prisma = new PrismaClient();

type Args = {
  apply: boolean;
  limit: number;
  pageSize: number;
};

type TangoRow = {
  articleCode: string;
  description: string;
  additionalDescription: string | null;
  priceListCode: string;
  priceListDescription: string | null;
  price: Prisma.Decimal;
  currency: string;
  includesVat: boolean | null;
  includesTaxes: boolean | null;
  rawData: Prisma.InputJsonValue;
};

function readArgs(): Args {
  const args = process.argv.slice(2);
  const getNumber = (name: string, fallback: number) => {
    const value = args.find((arg) => arg.startsWith(`${name}=`))?.split("=")[1];
    const parsed = value ? Number(value) : fallback;
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  };

  return {
    apply: args.includes("--apply"),
    limit: getNumber("--limit", 0),
    pageSize: getNumber("--page-size", Number(process.env.TANGO_PRODUCTS_PAGE_SIZE ?? 100)),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function tokenKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const wanted = tokenKey(candidate);
    const match = entries.find(([key]) => tokenKey(key) === wanted);
    if (match && match[1] !== null && match[1] !== undefined && match[1] !== "") {
      return match[1];
    }
  }
  return undefined;
}

function text(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}

function decimal(value: unknown): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  if (typeof value === "number") return new Prisma.Decimal(value);

  const raw = String(value ?? "0")
    .trim()
    .replace(/[^0-9,.-]/g, "");
  const normalized = raw.includes(",") && raw.includes(".")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? new Prisma.Decimal(parsed) : new Prisma.Decimal(0);
}

function booleanValue(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const normalized = tokenKey(String(value));
  if (["si", "s", "true", "1", "yes"].includes(normalized)) return true;
  if (["no", "n", "false", "0"].includes(normalized)) return false;
  return null;
}

function asJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeRow(value: unknown): TangoRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;

  const articleCode = text(pick(row, [
    "CodigoArticulo", "Código de artículo", "Codigo de articulo", "ArticleCode", "SKUCode", "SKU",
  ]));
  if (!articleCode) return null;

  const priceListCode = text(pick(row, [
    "CodigoLista", "Código de lista", "Codigo de lista", "PriceListCode", "ListCode",
  ])) ?? "default";

  return {
    articleCode,
    description: text(pick(row, [
      "DescripcionArticulo", "Descripción de artículo", "Descripcion de articulo", "Description", "ArticleDescription",
    ])) ?? articleCode,
    additionalDescription: text(pick(row, [
      "DescripcionAdicional", "Descripción adicional", "Descripcion adicional", "AdditionalDescription",
    ])),
    priceListCode,
    priceListDescription: text(pick(row, [
      "DescripcionLista", "Descripción de lista", "Descripcion de lista", "PriceListDescription", "ListDescription",
    ])),
    price: decimal(pick(row, ["Precio", "Price", "UnitPrice"])),
    currency: text(pick(row, ["Moneda", "Currency", "CurrencyDescription"])) ?? "ARS",
    includesVat: booleanValue(pick(row, ["IncluyeIvaLista", "Incluye IVA de lista", "IncludesVat", "IncludeVat"])),
    includesTaxes: booleanValue(pick(row, ["IncluyeImpuestos", "Incluye impuestos", "IncludesTaxes", "IncludeTaxes"])),
    rawData: asJsonValue(row),
  };
}

function responseRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const object = payload as Record<string, unknown>;
  for (const key of ["Data", "data", "Items", "items", "Rows", "rows", "Results", "results"]) {
    if (Array.isArray(object[key])) return object[key];
  }
  return [];
}

function responseHasMore(payload: unknown, rowCount: number, pageSize: number): boolean {
  if (!payload || typeof payload !== "object") return rowCount >= pageSize;
  const object = payload as Record<string, unknown>;
  const paging = (object.Paging ?? object.paging) as Record<string, unknown> | undefined;
  const moreData = paging?.MoreData ?? paging?.moreData;
  if (typeof moreData === "boolean") return moreData;

  const totalPages = Number(paging?.PageCount ?? paging?.pageCount ?? paging?.TotalPages ?? paging?.totalPages);
  const currentPage = Number(paging?.PageIndex ?? paging?.pageIndex ?? paging?.PageNumber ?? paging?.pageNumber);
  if (Number.isFinite(totalPages) && Number.isFinite(currentPage) && totalPages > 0) {
    return currentPage < totalPages;
  }
  return rowCount >= pageSize;
}

function buildUrl(pageSize: number, pageIndex: number): string {
  const baseUrl = requiredEnv("TANGO_API_BASE_URL").replace(/\/$/, "");
  const template = requiredEnv("TANGO_PRODUCTS_ENDPOINT_TEMPLATE");
  const values: Record<string, string> = {
    process: process.env.TANGO_PRODUCTS_PROCESS?.trim() || "20091",
    pageSize: String(pageSize),
    pageIndex: String(pageIndex),
    view: process.env.TANGO_PRODUCTS_VIEW?.trim() ?? "",
    company: requiredEnv("TANGO_COMPANY"),
  };

  const rendered = template.replace(/\{(process|pageSize|pageIndex|view|company)\}/g, (_, key: string) => values[key]);
  return /^https?:\/\//i.test(rendered) ? rendered : `${baseUrl}${rendered.startsWith("/") ? "" : "/"}${rendered}`;
}

async function fetchPage(pageSize: number, pageIndex: number): Promise<unknown> {
  const url = buildUrl(pageSize, pageIndex);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.TANGO_API_TIMEOUT_MS ?? 30000));

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ApiAuthorization: requiredEnv("TANGO_API_TOKEN"),
        Company: requiredEnv("TANGO_COMPANY"),
      },
      signal: controller.signal,
    });

    const body = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error(`Tango respondió algo que no es JSON (HTTP ${response.status})`);
    }

    if (!response.ok) throw new Error(`Tango respondió HTTP ${response.status}: ${body.slice(0, 500)}`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function saveRows(rows: TangoRow[]): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += 100) {
    const batch = rows.slice(offset, offset + 100);
    await prisma.$transaction(
      batch.map((row) => prisma.productsTango.upsert({
        where: {
          articleCode_priceListCode: {
            articleCode: row.articleCode,
            priceListCode: row.priceListCode,
          },
        },
        update: {
          description: row.description,
          additionalDescription: row.additionalDescription,
          priceListDescription: row.priceListDescription,
          price: row.price,
          currency: row.currency,
          includesVat: row.includesVat,
          includesTaxes: row.includesTaxes,
          rawData: row.rawData,
          fetchedAt: new Date(),
        },
        create: {
          ...row,
          fetchedAt: new Date(),
        },
      })),
    );
  }
}

async function main() {
  const args = readArgs();
  const rows: TangoRow[] = [];
  let pageIndex = 1;
  let hasMore = true;

  console.log(args.apply ? "Modo APPLY: se guardarán registros en products_tango." : "Modo PRUEBA: no se escribirá en la base de datos.");

  while (hasMore && (args.limit === 0 || rows.length < args.limit)) {
    const remaining = args.limit > 0 ? Math.max(1, args.limit - rows.length) : args.pageSize;
    const pageSize = Math.min(args.pageSize, remaining);
    const payload = await fetchPage(pageSize, pageIndex);
    const pageRows = responseRows(payload);
    const normalized = pageRows.map(normalizeRow).filter((row): row is TangoRow => row !== null);
    rows.push(...normalized);
    hasMore = responseHasMore(payload, pageRows.length, pageSize);
    console.log(`Página ${pageIndex}: ${pageRows.length} registros recibidos, ${normalized.length} utilizables.`);
    pageIndex++;
    if (pageRows.length === 0) break;
  }

  const finalRows = args.limit > 0 ? rows.slice(0, args.limit) : rows;
  console.log(`Total obtenido: ${finalRows.length}`);
  console.log("Muestra:", finalRows.slice(0, 3).map((row) => ({
    articleCode: row.articleCode,
    description: row.description,
    priceListCode: row.priceListCode,
    price: row.price.toString(),
    currency: row.currency,
  })));

  if (args.apply && finalRows.length > 0) {
    await saveRows(finalRows);
    console.log(`Guardados/actualizados: ${finalRows.length} en products_tango.`);
  }
}

main()
  .catch((error) => {
    console.error("Error sincronizando productos de Tango:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
