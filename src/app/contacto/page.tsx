// src/app/contacto/page.tsx
import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
    title: "Contáctanos | Elecsion",
    description: "Contactanos - Talcahuano 1544, Villa Madero, Buenos Aires",
};

export default function ContactoPage() {
    const address = "Talcahuano 1544, Villa Madero, Buenos Aires";
    const phoneDisplay = "2099-6983";          // como lo querés ver
    const phoneTel = "+541120996983";          // formato tel: (estimado)
    const email = "ventas@elecsion.com";

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 text-[#1C1C1C]">
            <h1 className="text-2xl font-semibold mb-2">Contactanos</h1>
            <p className="text-gray-600 mb-6">
                Estamos para ayudarte. Escribinos o visitanos en nuestra sucursal.
            </p>

            {/* Datos + Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Datos */}
                <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <h2 className="font-semibold mb-3">Información de contacto</h2>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                {/* Ubicación */}
                                <span className="mt-0.5 inline-grid h-6 w-6 place-items-center rounded-full bg-[#384A93] text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
                                <div>
                                    <div className="font-medium">Ubicación</div>
                                    <div className="text-gray-600">{address}</div>
                                </div>
                            </li>

                            <li className="flex items-start gap-3">
                                {/* Teléfono */}
                                <span className="mt-0.5 inline-grid h-6 w-6 place-items-center rounded-full bg-[#384A93] text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 3.2 2 2 0 0 1 4 1h2a2 2 0 0 1 2 1.7c.1.7.3 1.4.5 2.1.2.6 0 1.2-.4 1.6l-1 1a16 16 0 0 0 6 6l1-1c.4-.4 1-.6 1.6-.4.7.2 1.4.4 2.1.5A2 2 0 0 1 22 16.9Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
                                <div>
                                    <div className="font-medium">Teléfono</div>
                                    <div className="text-gray-600">
                                        <a href={`tel:${phoneTel}`} className="hover:text-[#384A93]">{phoneDisplay}</a>
                                    </div>
                                </div>
                            </li>

                            <li className="flex items-start gap-3">
                                {/* Email */}
                                <span className="mt-0.5 inline-grid h-6 w-6 place-items-center rounded-full bg-[#384A93] text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m20 0-10 7L2 6m20 0H2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
                                <div>
                                    <div className="font-medium">Email</div>
                                    <div className="text-gray-600">
                                        <a href={`mailto:${email}`} className="hover:text-[#384A93]">{email}</a>
                                    </div>
                                </div>
                            </li>
                        </ul>

                        {/* Acciones rápidas */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <a href={`tel:${phoneTel}`} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                                Llamar
                            </a>
                            <a href={`mailto:${email}`} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                                Enviar email
                            </a>
                            <a
                                href="https://wa.me/541168665846"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Mapa */}
                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <div className="px-4 pt-4">
                            <h2 className="font-semibold">Ubicación</h2>
                            <p className="text-sm text-gray-600">{address}</p>
                        </div>
                        <div className="mt-3">
                            <iframe
                                title="Mapa Elecsion"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                                width="100%"
                                height="320"
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div className="bg-white p-1">
                    <h2 className="font-semibold mb-3">Escribinos</h2>
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}