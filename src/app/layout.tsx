// src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Montserrat } from "next/font/google";
import { CartProvider } from "@/store/cart";   // named import
import CartDrawerWrapper from "@/components/cart/CartDrawerWrapper";
import SessionProvider from "@/components/SessionProvider";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// Forzamos render dinámico en toda la app para evitar builds fallidos por falta de DB en prerender
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
        <body
            className={`${montserrat.className} ${montserrat.variable} font-sans min-h-screen flex flex-col bg-white text-[#1C1C1C] antialiased`}
        >
        <SessionProvider>
            <CartProvider>
                <Header />

                {/* <- el drawer debe estar montado para que el botón lo pueda abrir */}
                <CartDrawerWrapper />

                <main className="flex-1 bg-white">
                    <div
                        className="mx-auto w-full px-6 py-8"
                        style={{ maxWidth: "var(--page-container-max, 1500px)" }}
                    >
                        {children}
                    </div>
                </main>

                <Footer />

                {/* Botón flotante de WhatsApp */}
                <WhatsAppFloat />
            </CartProvider>
        </SessionProvider>
        </body>
        </html>
    );
}
