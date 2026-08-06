import CatalogSheetClient from "./CatalogSheetClient";
import { getTangoBrands } from "@/lib/products-tango";

export default async function CatalogSheet() {
    const brands = await getTangoBrands();

    const data = brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        count: b._count.products,
    }));

    return <CatalogSheetClient brands={data} />;
}
