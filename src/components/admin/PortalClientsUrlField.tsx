"use client";

import { FormEvent, useState } from "react";
import { normalizePortalClientsUrl } from "@/lib/site-settings";

type Props = {
    initialUrl: string;
};

export default function PortalClientsUrlField({ initialUrl }: Props) {
    const [url, setUrl] = useState(initialUrl);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const saveUrl = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = normalizePortalClientsUrl(url);

        if (!value) {
            setMessage({ type: "error", text: "Ingresá una URL externa válida." });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch("/api/site-settings/portal-clients", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: value }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "No se pudo guardar la URL.");

            setUrl(data.setting.value);
            setMessage({ type: "success", text: "URL guardada correctamente." });
            window.dispatchEvent(new CustomEvent("portal-clients-url-updated", { detail: { url: data.setting.value } }));
        } catch {
            setMessage({ type: "error", text: "No se pudo guardar la URL. Intentá nuevamente." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="rounded-lg border border-[#B5B5B5]/40 bg-white">
            <div className="border-b border-[#B5B5B5]/40 px-5 py-4">
                <h2 className="font-medium text-[#1C1C1C]">Botón Portal clientes</h2>
                <p className="mt-1 text-sm text-[#646464]">
                    Definí la URL de destino que usará el botón del menú principal.
                </p>
            </div>

            <form onSubmit={saveUrl} className="space-y-3 p-5">
                <label htmlFor="portal-clients-url" className="block text-sm font-medium text-[#1C1C1C]">
                    URL de destino
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        id="portal-clients-url"
                        type="text"
                        inputMode="url"
                        value={url}
                        onChange={(event) => {
                            setUrl(event.target.value);
                            setMessage(null);
                        }}
                        disabled={isSaving}
                        className="min-w-0 flex-1 rounded-md border border-[#B5B5B5] px-3 py-2 text-sm text-[#1C1C1C] outline-none transition-colors placeholder:text-[#999] focus:border-[#384A93] focus:ring-2 focus:ring-[#384A93]/15"
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-md bg-[#384A93] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3d7a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? "Guardando…" : "Guardar URL"}
                    </button>
                </div>
                <p className="text-xs text-[#646464]">
                    Ingresá una URL externa completa.
                </p>
                {message && (
                    <p className={`text-sm ${message.type === "success" ? "text-green-700" : "text-red-600"}`}>
                        {message.text}
                    </p>
                )}
            </form>
        </section>
    );
}
