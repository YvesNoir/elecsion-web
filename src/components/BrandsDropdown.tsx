// src/components/BrandsDropdown.tsx
import BrandsDropdownClient from "./BrandsDropdownClient";
import { getTangoBrands } from "@/lib/products-tango";

type Props = {
    gradientFrom?: string;
    gradientTo?: string;
};

export default async function BrandsDropdown({ gradientFrom, gradientTo }: Props) {
    const brands = await getTangoBrands();

    return (
        <BrandsDropdownClient
            brands={brands}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
        />
    );
}
