import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export const TANGO_WEB_PRICE_LIST_CODE =
    process.env.TANGO_WEB_PRICE_LIST_CODE || "WEB";

export const TANGO_OFFERS_SLUG = "oferta";
export const TANGO_OFFERS_NAME = "Ofertas";

export type TangoCatalogProduct = {
    id: string;
    articleCode: string;
    synonym: string | null;
    sku: string;
    imageCodes: string[];
    name: string;
    unit: string | null;
    priceBase: number;
    offerPrice: number | null;
    currency: string;
    stockQty: number;
    taxRate: number | null;
    brand: { name: string; slug: string } | null;
};

export function displayProductCode(synonym: string | null | undefined, articleCode: string) {
    return synonym?.trim() || articleCode.trim();
}

export function productImageCodes(synonym: string | null | undefined, articleCode: string) {
    return Array.from(new Set([synonym?.trim(), articleCode.trim()].filter(Boolean) as string[]));
}

export function tangoBrandSlug(name: string) {
    return slugify(name);
}

export function mapTangoProduct(row: {
    articleCode: string;
    synonym: string | null;
    description: string;
    price: unknown;
    offerPrice?: unknown;
    currency: string;
    stockQty: unknown;
    taxRate: unknown;
    brandName: string | null;
}): TangoCatalogProduct {
    const synonym = row.synonym?.trim() || null;
    const articleCode = row.articleCode.trim();
    const brandName = row.brandName?.trim() || null;

    return {
        id: articleCode,
        articleCode,
        synonym,
        sku: displayProductCode(synonym, articleCode),
        imageCodes: productImageCodes(synonym, articleCode),
        name: row.description,
        unit: null,
        priceBase: Number(row.price || 0),
        offerPrice: row.offerPrice === null || row.offerPrice === undefined
            ? null
            : Number(row.offerPrice),
        currency: row.currency || "ARS",
        stockQty: Number(row.stockQty || 0),
        taxRate: row.taxRate === null || row.taxRate === undefined ? null : Number(row.taxRate),
        brand: brandName ? { name: brandName, slug: tangoBrandSlug(brandName) } : null,
    };
}

export async function getTangoBrands() {
    const groups = await prisma.productsTango.groupBy({
        by: ["brandName"],
        where: {
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            isActive: true,
            brandName: { not: null },
        },
        _count: { _all: true },
        orderBy: { brandName: "asc" },
    });

    const slugOccurrences = new Map<string, number>();

    return groups
        .filter((group) => group.brandName)
        .map((group) => {
            const name = group.brandName!;
            const baseSlug = tangoBrandSlug(name);
            const occurrence = (slugOccurrences.get(baseSlug) ?? 0) + 1;
            slugOccurrences.set(baseSlug, occurrence);
            const slug = occurrence === 1 ? baseSlug : `${baseSlug}-${occurrence}`;

            return {
                id: slug,
                name,
                slug,
                _count: { products: group._count._all },
            };
        });
}

export async function getTangoOfferCount() {
    return prisma.productsTango.count({
        where: {
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            isActive: true,
            offerPrice: { not: null },
        },
    });
}

export async function getTangoCatalogBrands() {
    const [brands, offerCount] = await Promise.all([getTangoBrands(), getTangoOfferCount()]);

    return offerCount > 0
        ? [{
            id: TANGO_OFFERS_SLUG,
            name: TANGO_OFFERS_NAME,
            slug: TANGO_OFFERS_SLUG,
            _count: { products: offerCount },
        }, ...brands]
        : brands;
}

export async function getTangoBrandNameBySlug(slug: string) {
    const brands = await getTangoBrands();
    return brands.find((brand) => brand.slug === slug)?.name ?? null;
}

export async function getTangoBrandNames() {
    const brands = await getTangoBrands();
    return new Map(brands.map((brand) => [brand.slug, brand.name]));
}
