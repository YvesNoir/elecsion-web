// src/app/catalogo/page.tsx
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import CatalogClient from "@/components/catalog/CatalogClient";

export const revalidate = 30;

type Props = {
    // En Next 15 searchParams es async
    searchParams: Promise<{ brand?: string; page?: string }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
    const params = await searchParams;
    const session = await getSession();
    const currentSlug = (params?.brand ?? "").toLowerCase().trim();
    const currentPage = parseInt(params?.page ?? "1", 10);
    const productsPerPage = 30;
    const skip = (currentPage - 1) * productsPerPage;

    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: { 
                select: { 
                    products: {
                        where: { isActive: true, isDeleted: false }
                    } 
                } 
            },
        },
    });

    const selectedBrand = brands.find((b) => b.slug === currentSlug) ?? null;

    // Obtener el total de productos para la paginación
    const totalProducts = selectedBrand
        ? await prisma.product.count({
            where: { brandId: selectedBrand.id, isActive: true, isDeleted: false },
        })
        : await prisma.product.count({
            where: { isActive: true, isDeleted: false },
        });

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const rawProducts = selectedBrand
        ? await prisma.product.findMany({
            where: { brandId: selectedBrand.id, isActive: true, isDeleted: false },
            orderBy: [{ sku: "asc" }, { name: "asc" }],
            skip,
            take: productsPerPage,
            select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                priceBase: true,  // Prisma.Decimal
                currency: true,
                taxRate: true,    // Prisma.Decimal | null
                stockQty: true,   // Prisma.Decimal | null
                brand: {
                    select: {
                        name: true,
                        slug: true,
                    }
                },
            },
        })
        : await prisma.product.findMany({
            where: { isActive: true, isDeleted: false },
            orderBy: [{ sku: "asc" }, { name: "asc" }],
            skip,
            take: productsPerPage,
            select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                priceBase: true,  // Prisma.Decimal
                currency: true,
                taxRate: true,    // Prisma.Decimal | null
                stockQty: true,   // Prisma.Decimal | null
                brand: {
                    select: {
                        name: true,
                        slug: true,
                    }
                },
            },
        });

    // <<<<<<<<<< IMPORTANTÍSIMO: serializamos a number >>>>>>>>>>
    const products = rawProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        priceBase: p.priceBase ? Number(p.priceBase) : 0,
        currency: p.currency ?? "ARS",
        taxRate: p.taxRate === null ? null : Number(p.taxRate),
        stockQty: p.stockQty === null ? null : Number(p.stockQty),
        brand: p.brand,
    }));

    return (
        <CatalogClient 
            brands={brands}
            products={products}
            selectedBrand={selectedBrand}
            currentSlug={currentSlug}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            productsPerPage={productsPerPage}
            isLoggedIn={!!session?.user}
        />
    );
}