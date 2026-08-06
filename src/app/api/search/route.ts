import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { searchProducts } from "@/lib/search";
import { json } from "@/lib/json";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 50);
    const offset = (page - 1) * pageSize;

    try {
        const session = await getSession();
        const results = await searchProducts(q, pageSize, offset);

        // Log de búsqueda (si falla, no rompemos la respuesta)
        prisma.searchQueryLog.create({
            data: { userId: session?.user?.id ?? null, query: q, resultsCount: results.total },
        }).catch(() => { /* noop */ });

        return json(results, { status: 200 });
    } catch (err: unknown) {
        console.error("GET /api/search error:", err);
        return json({
            error: "Internal error",
            detail: err instanceof Error ? err.message : String(err),
        }, { status: 500 });
    }
}
