// src/components/BrandsDropdown.tsx
import { prisma } from "@/lib/db";
import BrandsDropdownClient from "./BrandsDropdownClient";

type Props = {
    gradientFrom?: string;
    gradientTo?: string;
};

export default async function BrandsDropdown({ gradientFrom, gradientTo }: Props) {
    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
    });

    return (
        <BrandsDropdownClient
            brands={brands}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
        />
    );
}