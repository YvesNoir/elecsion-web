"use client";

import { useRouter } from 'next/navigation';
import ProductsTable from './ProductsTable';

type Product = {
    id: string;
    sku: string | null;
    name: string;
    priceBase: number;
    stockQty: number;
    taxRate: number | null;
    isActive: boolean;
    isDeleted?: boolean;
    brand: {
        name: string;
    } | null;
};

type ProductsPageClientProps = {
    products: Product[];
};

export default function ProductsPageClient({ products }: ProductsPageClientProps) {
    const router = useRouter();

    const handleImportSuccess = () => {
        // Recargar la página para obtener los datos actualizados
        router.refresh();
    };

    return (
        <ProductsTable 
            products={products} 
            onImportSuccess={handleImportSuccess}
        />
    );
}