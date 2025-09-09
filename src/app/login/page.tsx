// src/app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("cliente@empresa.com");
    const [password, setPassword] = useState(""); // vacío para los del seed
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
        });
        setLoading(false);
        if (res?.ok) router.push(callbackUrl);
        else alert("No pudimos iniciar sesión");
    }

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Ingresar</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">
                        Contraseña <span className="text-gray-500">(vacía para usuarios seed)</span>
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Opcional si el usuario no tiene password"
                    />
                </div>
                <button
                    disabled={loading}
                    className="btn-primary"
                    type="submit"
                >
                    {loading ? "Ingresando..." : "Ingresar"}
                </button>
            </form>
        </main>
    );
}