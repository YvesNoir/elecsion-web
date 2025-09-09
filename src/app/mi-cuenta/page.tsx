import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
    title: "Mi cuenta | Elecsion",
};

function roleLabel(role?: string) {
    switch (role) {
        case "ADMIN":
            return "Admin";
        case "SELLER":
            return "Vendedor";
        case "CLIENT":
            return "Cliente";
        default:
            return "—";
    }
}

export default async function AccountPage() {
    const session = await getSession();
    const email = session?.user?.email ?? "—";
    const role = roleLabel(session?.user?.role as string | undefined);

    if (!session?.user) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Mi cuenta</h1>
                <div className="rounded-lg border bg-white p-6">
                    <p className="text-[#646464]">
                        No has iniciado sesión.
                    </p>
                    <div className="mt-4">
                        <Link
                            href="/login?next=/mi-cuenta"
                            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-[#1C1C1C] hover:bg-[#f5f5f7]"
                        >
                            Ingresar
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Mi cuenta</h1>

            <div className="rounded-lg border bg-white p-6">
                <dl className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-[#646464]">Email</dt>
                        <dd className="mt-1 font-medium text-[#1C1C1C]">{email}</dd>
                    </div>

                    <div>
                        <dt className="text-sm text-[#646464]">Tipo de usuario</dt>
                        <dd className="mt-1 font-medium text-[#1C1C1C]">{role}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}