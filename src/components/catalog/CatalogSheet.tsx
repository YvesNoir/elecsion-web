import { prisma } from "@/lib/db";
import CatalogSheetClient from "./CatalogSheetClient";

export default async function CatalogSheet() {
    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
    });

    const data = brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        count: b._count.products,
    }));

    return <CatalogSheetClient brands={data} />;
}