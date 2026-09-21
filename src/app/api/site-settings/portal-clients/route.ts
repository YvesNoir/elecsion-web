import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { normalizePortalClientsUrl, PORTAL_CLIENTS_URL_KEY } from "@/lib/site-settings";

export async function GET() {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: PORTAL_CLIENTS_URL_KEY },
            select: { value: true },
        });

        return NextResponse.json(
            { url: normalizePortalClientsUrl(setting?.value) },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        console.error("Error leyendo la URL del Portal clientes:", error);
        return NextResponse.json({ url: null }, { status: 200 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await getSession();
    const updatedById = session?.user?.id;

    if (session?.user?.role !== "ADMIN" || !updatedById) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const value = normalizePortalClientsUrl(body.url);

        if (!value) {
            return NextResponse.json(
                { error: "Ingresá una URL externa válida." },
                { status: 400 },
            );
        }

        const setting = await prisma.siteSetting.upsert({
            where: { key: PORTAL_CLIENTS_URL_KEY },
            create: {
                key: PORTAL_CLIENTS_URL_KEY,
                value,
                updatedById,
            },
            update: {
                value,
                updatedById,
            },
            select: {
                key: true,
                value: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            setting: {
                ...setting,
                updatedAt: setting.updatedAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error guardando la URL del Portal clientes:", error);
        return NextResponse.json({ error: "No se pudo guardar la URL." }, { status: 500 });
    }
}
