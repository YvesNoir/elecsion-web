import { NextResponse } from "next/server";
import { getTangoBrands } from "@/lib/products-tango";

export async function GET() {
    try {
        return NextResponse.json({ brands: await getTangoBrands() });
    } catch (error) {
        console.error("Error fetching Tango brands:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
