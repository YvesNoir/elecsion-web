// src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Montserrat } from "next/font/google";
import { prisma } from "@/lib/db";

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    display: "swap",
    variable: "--font-montserrat",
});

export const metadata: Metadata = {
    title: "Elecsion",
    description: "Distribuidora de productos eléctricos y ferretería",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
    // Traer marcas para el panel lateral del catálogo
    const brandRows = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { products: true } },
        },
    });

    const brands = brandRows.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        count: b._count.products,
    }));

    return (
        <html lang="es">
        <body
            className={`${montserrat.className} ${montserrat.variable} font-sans min-h-screen flex flex-col bg-white text-[#1C1C1C] antialiased`}
        >
        <Header />

        <main className="flex-1 bg-white">
            <div className="mx-auto w-full px-6 py-8"
                 style={{ maxWidth: "var(--page-container-max, 1500px)" }}>{children}</div>
        </main>

        <Footer />
        </body>
        </html>
    );
}
