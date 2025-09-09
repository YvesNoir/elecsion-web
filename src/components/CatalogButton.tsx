// src/components/CatalogToggleButton.tsx
"use client";

export default function CatalogButton({ className }: { className?: string }) {
    return (
        <button
            type="button"
            className={className ?? "text-[#1C1C1C] hover:underline"}
            onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event("catalog:toggle"));
            }}
        >
            Catálogo
        </button>
    );
}