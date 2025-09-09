"use client";
import { useCatalogStore } from "@/store/catalog";

export default function CatalogToggleButton() {
    const toggle = useCatalogStore((s) => s.toggle);
    return (
        <button onClick={() => toggle(true)} className="text-[#1C1C1C] hover:text-[#384A93]">
            Catálogo
        </button>
    );
}