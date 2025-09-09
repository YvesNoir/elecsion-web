// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full bg-white border-t border-[#E5E5E5]">
            <div className="mx-auto w-full max-w-[1500px] px-6 py-10">
                <div className="grid gap-8 md:grid-cols-3 text-sm">
                    <div>
                        <div className="font-semibold text-[#1C1C1C] mb-2">Elecsion</div>
                        <p className="text-[#646464]">
                            Distribuidora de productos eléctricos y ferretería.
                            <br />Atención: Lun–Vie 9–18h
                        </p>
                    </div>

                    <div>
                        <div className="font-semibold text-[#1C1C1C] mb-2">Navegación</div>
                        <ul className="space-y-1">
                            <li><Link href="/" className="text-[#646464] hover:text-[#384A93]">Inicio</Link></li>
                            <li><Link href="/buscar" className="text-[#646464] hover:text-[#384A93]">Buscar</Link></li>
                            <li><Link href="/carrito" className="text-[#646464] hover:text-[#384A93]">Carrito</Link></li>
                            <li><Link href="/login" className="text-[#646464] hover:text-[#384A93]">Ingresar</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="font-semibold text-[#1C1C1C] mb-2">Contacto</div>
                        <ul className="space-y-1 text-[#646464]">
                            <li>Email: <a href="mailto:info@elecsion.com" className="hover:text-[#384A93]">info@elecsion.com</a></li>
                            <li>Tel: (011) 1234-5678</li>
                            <li>Ubicación: Buenos Aires</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 text-xs text-[#9b9b9b]">
                    © {new Date().getFullYear()} Elecsion — Derechos reservados
                </div>
            </div>
        </footer>
    );
}