"use client";
import { create } from "zustand";

type CatalogState = {
    open: boolean;
    toggle: (v?: boolean) => void;
    openCatalog: () => void;
    closeCatalog: () => void;
};

export const useCatalogStore = create<CatalogState>((set) => ({
    open: false,
    toggle: (v) => set((s) => ({ open: typeof v === "boolean" ? v : !s.open })),
    openCatalog: () => set({ open: true }),
    closeCatalog: () => set({ open: false }),
}));

// debug opcional
if (typeof window !== "undefined") (window as any).catalogStore = useCatalogStore;