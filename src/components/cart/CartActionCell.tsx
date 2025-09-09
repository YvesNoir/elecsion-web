"use client";

import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

type Props = {
    productId: string;
    name: string;
    price: number;
    slug: string;
    className?: string;
};

export default function CartActionCell({
                                           productId,
                                           name,
                                           price,
                                           slug,
                                           className,
                                       }: Props) {
    return (
        <td className={className ?? "px-3 py-2"}>
            <div className="flex items-center gap-2 justify-end">
                <Link
                    href={`/producto/${slug}`}
                    className="inline-flex h-8 items-center rounded-md border border-[#B5B5B5]/60 px-3 text-sm text-[#1C1C1C] hover:bg-[#f5f5f7] whitespace-nowrap"
                >
                    Ver detalle
                </Link>

                <AddToCartButton
                    productId={productId}
                    name={name}
                    price={price}
                    className="btn-primary"
                />
            </div>
        </td>
    );
}