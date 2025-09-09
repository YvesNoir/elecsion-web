export function json(data: any, init?: ResponseInit) {
    const body = JSON.stringify(
        data,
        (_k, v) => {
            // BigInt -> number
            if (typeof v === "bigint") return Number(v);
            // Prisma Decimal -> number (tiene toNumber)
            if (v && typeof v === "object" && typeof (v as any).toNumber === "function") {
                try { return (v as any).toNumber(); } catch { return Number(v); }
            }
            return v;
        }
    );
    return new Response(body, {
        ...(init || {}),
        headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}