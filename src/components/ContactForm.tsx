"use client";

import { useState } from "react";

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const payload = {
            name: fd.get("name")?.toString() ?? "",
            email: fd.get("email")?.toString() ?? "",
            phone: fd.get("phone")?.toString() ?? "",
            message: fd.get("message")?.toString() ?? "",
        };
        if (!payload.name || !payload.email || !payload.message) {
            alert("Completá nombre, email y mensaje.");
            return;
        }
        setStatus("sending");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Request failed");
            setStatus("ok");
            e.currentTarget.reset();
        } catch (err) {
            setStatus("error");
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <div>
                <label className="block mb-1 font-medium">Nombre</label>
                <input
                    name="name"
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#384A93]/30"
                    placeholder="Tu nombre"
                    required
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                        name="email"
                        type="email"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#384A93]/30"
                        placeholder="tu@correo.com"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Teléfono</label>
                    <input
                        name="phone"
                        type="tel"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#384A93]/30"
                        placeholder="(011) xxxx-xxxx"
                    />
                </div>
            </div>
            <div>
                <label className="block mb-1 font-medium">Mensaje</label>
                <textarea
                    name="message"
                    rows={5}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#384A93]/30"
                    placeholder="¿En qué podemos ayudarte?"
                    required
                />
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={status === "sending"}
                    className="rounded-md bg-[#384A93] text-white px-4 py-2 hover:bg-[#2e3d7a] disabled:opacity-50"
                >
                    {status === "sending" ? "Enviando..." : "Enviar"}
                </button>
                {status === "ok" && <span className="text-green-700">¡Mensaje enviado!</span>}
                {status === "error" && <span className="text-red-600">Ocurrió un error. Probá de nuevo.</span>}
            </div>
        </form>
    );
}