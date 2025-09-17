// src/components/Header.tsx
import Link from "next/link";
import { getSession } from "@/lib/session";
import CartToggleButton from "@/components/cart/CartToggleButton";
import SearchButton from "@/components/SearchButton";

type HeaderProps = {
    className?: string;
};

export default async function Header({ className }: HeaderProps) {
    const session = await getSession();
    const navLink =
        "inline-flex items-center gap-1 px-2 py-1 text-sm text-[#1C1C1C] hover:text-[#384A93] transition-colors";

    return (
        <header className={`w-full bg-white border-b border-[#E5E5E5] ${className ?? ""}`}>
            <div className="mx-auto w-full max-w-[1500px] px-6">
                <div className="grid grid-cols-3 items-center h-16">
                    {/* Izquierda */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/" className={navLink}>Inicio</Link>
                        <Link href="/catalogo" className={navLink}>Catálogo</Link>
                        <SearchButton />
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

                        {/* Botón que ABRE el drawer del carrito */}
                        <CartToggleButton />
                    </div>
                </div>
            </div>
        </header>
    );
}