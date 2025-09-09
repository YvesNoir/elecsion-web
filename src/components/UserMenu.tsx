// src/components/UserMenu.tsx
"use client";
type Props = { session: { name: string; role: "ADMIN"|"CLIENT"|"VENDOR"; email: string } | null };

export default function UserMenu({ session }: Props) {
    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.reload();
    }
    if (!session) {
        return (
            <a href="/login" className="text-sm border rounded-md px-3 py-1">
                Iniciar sesión
            </a>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm truncate max-w-[140px]">Hola, <b>{session.name || session.email}</b></span>
            <button onClick={logout} className="text-sm border rounded-md px-3 py-1">
                Salir
            </button>
        </div>
    );
}