// src/components/SearchBox.tsx
"use client";
import { useState } from "react";
import { slugify } from "@/lib/slug";

export default function SearchBox() {
    const [q, setQ] = useState("");

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const s = slugify(q || "");
        if (!s) return;
        window.location.href = `/buscar/${s}`;
    }

    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Buscar productos… (ej: tomacorriente sica 10a)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />
            <button className="border rounded-md px-3 py-2 text-sm">Buscar</button>
        </form>
    );
}