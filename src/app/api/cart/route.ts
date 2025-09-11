import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Cart = Record<string, number>; // { [sku]: qty }

const COOKIE_NAME = "cart";

function readCart(): Cart {
    const c = cookies().get(COOKIE_NAME)?.value;
    if (!c) return {};
    try {
        return JSON.parse(c);
    } catch {
        return {};
    }
}

function writeCart(cart: Cart) {
    cookies().set({
        name: COOKIE_NAME,
        value: JSON.stringify(cart),
        path: "/",
        // maxAge: 60 * 60 * 24 * 30, // 30 días (si querés persistencia)
    });
}

export async function GET() {
    const cart = readCart();
    return NextResponse.json({ ok: true, cart });
}

export async function PUT(request: Request) {
    const body = await request.json().catch(() => ({}));
    const sku = String(body?.sku ?? "").trim();
    const qty = Number(body?.qty);

    if (!sku || !Number.isFinite(qty) || qty < 0) {
        return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    }

    const cart = readCart();

    if (qty === 0) {
        delete cart[sku];
    } else {
        cart[sku] = qty;
    }

    writeCart(cart);
    const totalItems = Object.values(cart).reduce((a, b) => a + (Number(b) || 0), 0);

    return NextResponse.json({ ok: true, cart, totalItems });
}

export async function DELETE() {
    writeCart({});
    return NextResponse.json({ ok: true, cart: {}, totalItems: 0 });
}