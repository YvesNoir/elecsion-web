"use client";
import { useState } from "react";
import { slugify } from "@/lib/slug";

export default function SearchBar({ placeholder = "Buscar", className = "" }: { placeholder?: string; className?: string }) {
    const [q, setQ] = useState("");

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const s = slugify(q || "");
        if (!s) return;
        window.location.href = `/buscar/${s}`;
    }

    return (
        <form onSubmit={onSubmit} className={`w-full ${className}`}>
            <div className="relative w-full">
                <input
                    className="w-full h-11 pl-4 pr-11 rounded-full bg-white text-sm placeholder-brand-silver/80 ring-2 ring-white/40 focus:ring-brand-light focus:outline-none"
                    placeholder={placeholder}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <button
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white text-brand-primary ring-1 ring-white/60 grid place-items-center hover:text-brand-dark"
                    aria-label="Buscar"
                    type="submit"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21l-3.8-3.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </form>
    );
}