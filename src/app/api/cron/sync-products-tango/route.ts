import { NextRequest, NextResponse } from "next/server";
import { syncProductsTangoFromSheet } from "@/lib/products-tango-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const authorization = request.headers.get("authorization");

    if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const result = await syncProductsTangoFromSheet({ apply: true });
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error("Error en cron de products_tango:", error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : "Error sincronizando productos" },
            { status: 500 },
        );
    }
}
