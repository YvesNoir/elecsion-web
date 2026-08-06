import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import CatalogClient from "@/components/catalog/CatalogClient";
import {
    getTangoBrandNameBySlug,
    getTangoBrands,
    mapTangoProduct,
    TANGO_WEB_PRICE_LIST_CODE,
} from "@/lib/products-tango";

export const revalidate = 30;

type Props = {
    searchParams: Promise<{ brand?: string; page?: string; search?: string }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
    const params = await searchParams;
    const session = await getSession();
    const currentSlug = (params?.brand ?? "").toLowerCase().trim();
    const searchTerm = (params?.search ?? "").trim();
    const currentPage = parseInt(params?.page ?? "1", 10);
    const productsPerPage = 30;
    const skip = (currentPage - 1) * productsPerPage;
    const selectedBrandName = currentSlug ? await getTangoBrandNameBySlug(currentSlug) : null;
    const brands = await getTangoBrands();
    const selectedBrand = brands.find((brand) => brand.slug === currentSlug) ?? null;

    const baseFilter = {
        priceListCode: TANGO_WEB_PRICE_LIST_CODE,
        isActive: true,
        ...(selectedBrandName ? { brandName: selectedBrandName } : {}),
        ...(searchTerm ? {
            OR: [
                { articleCode: { contains: searchTerm, mode: "insensitive" as const } },
                { synonym: { contains: searchTerm, mode: "insensitive" as const } },
                { description: { contains: searchTerm, mode: "insensitive" as const } },
                { brandName: { contains: searchTerm, mode: "insensitive" as const } },
            ],
        } : {}),
    };

    const [totalProducts, rawProducts] = await Promise.all([
        prisma.productsTango.count({ where: baseFilter }),
        prisma.productsTango.findMany({
            where: baseFilter,
            orderBy: [{ articleCode: "asc" }],
            skip,
            take: productsPerPage,
            select: {
                articleCode: true,
                synonym: true,
                description: true,
                price: true,
                currency: true,
                stockQty: true,
                taxRate: true,
                brandName: true,
            },
        }),
    ]);

    const products = rawProducts.map(mapTangoProduct);
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    return (
        <CatalogClient
            brands={brands}
            products={products}
            selectedBrand={selectedBrand}
            currentSlug={currentSlug}
            searchTerm={searchTerm}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            productsPerPage={productsPerPage}
            isLoggedIn={!!session?.user}
        />
    );
}
