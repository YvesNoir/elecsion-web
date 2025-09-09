// src/components/Header.tsx
import Link from "next/link";
import { getSession } from "@/lib/session";
import CartDropdown from "@/components/cart/CartDropdown";
import CatalogToggleButton from "@/components/catalog/CatalogToggleButton";

type HeaderProps = {
    /** agrega clases si querés fijarlo, sombras, etc. */
    className?: string;
};

const navLinkCls =
    "inline-flex items-center gap-1 px-2 py-1 text-sm text-[#1C1C1C] hover:text-[#384A93] transition-colors";

export default async function Header({ className }: HeaderProps) {
    const session = await getSession();
    const navLink =
        "text-sm text-[#1C1C1C] hover:text-[#384A93] transition-colors";

    return (
        <header className={`w-full bg-white border-b border-[#E5E5E5] ${className ?? ""}`}>
            {/* Contenido centrado pero barra full-bleed */}
            <div className="mx-auto w-full max-w-[1500px] px-6">
                {/* 3 zonas: izquierda (links), centro (logo), derecha (cuenta/carrito) */}
                <div className="grid grid-cols-3 items-center h-16">
                    {/* Izquierda */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/" className={navLink}>Inicio</Link>
                        <Link href="/catalogo" className={navLink}>Catálogo</Link>
                        <Link href="/buscar" className={navLink}>Buscar</Link>
                    </nav>

                    {/* Centro (logo) */}
                    <div className="flex justify-center">
                        <Link href="/" aria-label="Elecsion">
                            <img src="/logo-elecsion.svg" alt="Elecsion" className="h-8 w-auto" />
                        </Link>
                    </div>

                    {/* Derecha */}
                    <div className="flex justify-end items-center gap-6">
                        <Link
                            href={session?.user ? "/mi-cuenta" : "/login"}
                            className={navLink}
                        >
                            {session?.user ? "Mi cuenta" : "Ingresar"}
                        </Link>

                        {/* Si querés el mini-carrito al hover, usamos el dropdown como trigger.
               Si preferís sólo un link, reemplaza todo el CartDropdown por:
               <Link href="/carrito" className={navLink}>Carrito</Link> */}
                        <CartDropdown
                            trigger={<Link href="/carrito" className={navLink}>Carrito</Link>}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}