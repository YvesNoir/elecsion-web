// src/components/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="w-full bg-[#e1e8f4]">
            <div className="mx-auto w-full max-w-[1500px] px-6 py-10">
                <div className="grid gap-8 md:grid-cols-3 text-sm">
                    {/* Primera columna: Información del negocio */}
                    <div>
                        <div className="font-semibold text-[#1C1C1C] mb-3">Elecsion</div>
                        <div className="space-y-2 text-[#646464]">
                            <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <div>Av. Corrientes 1234</div>
                                    <div>Buenos Aires, Argentina</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                <a href="mailto:info@elecsion.com" className="hover:text-[#384A93]">
                                    info@elecsion.com
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                <span>(011) 4567-8910</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>Lun–Vie 9:00–18:00h</span>
                            </div>
                        </div>
                    </div>

                    {/* Segunda columna: Links útiles */}
                    <div>
                        <div className="font-semibold text-[#1C1C1C] mb-3">Links útiles</div>
                        <ul className="space-y-2">
                            <li><Link href="/catalogo" className="text-[#646464] hover:text-[#384A93]">Sobre nosotros</Link></li>
                            <li><Link href="/catalogo" className="text-[#646464] hover:text-[#384A93]">Medios de envíos</Link></li>
                            <li><Link href="/catalogo" className="text-[#646464] hover:text-[#384A93]">Términos y condiciones</Link></li>
                            <li><Link href="/catalogo" className="text-[#646464] hover:text-[#384A93]">Política de privacidad</Link></li>
                        </ul>
                    </div>

                    {/* Tercera columna: ¿Tienes dudas? */}
                    <div>
                        <div className="font-semibold text-[#1C1C1C] mb-3">¿Tienes dudas?</div>
                        <ul className="space-y-2">
                            <li><Link href="/faq" className="text-[#646464] hover:text-[#384A93]">FAQs</Link></li>
                            <li><Link href="/contacto" className="text-[#646464] hover:text-[#384A93]">Contacto</Link></li>
                            <li><Link href="/legales" className="text-[#646464] hover:text-[#384A93]">Legales</Link></li>
                            <li><Link href="/soporte" className="text-[#646464] hover:text-[#384A93]">Soporte técnico</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-between">
                    <div className="text-xs text-[#9b9b9b]">
                        © {new Date().getFullYear()} Elecsion — Derechos reservados
                    </div>
                    <Image 
                        src="/elecsion-logo-black.svg" 
                        alt="Elecsion" 
                        width={120}
                        height={48}
                        className="w-30 h-auto"
                    />
                </div>
            </div>
        </footer>
    );
}