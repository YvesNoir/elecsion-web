// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const admin = /^\/admin(\/|$)/;
const seller = /^\/vendedor(\/|$)/;

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (!admin.test(pathname) && !seller.test(pathname)) return NextResponse.next();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        const url = new URL("/login", req.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    const role = token.role as string | undefined;

    if (admin.test(pathname) && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
    }
    if (seller.test(pathname) && role !== "SELLER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/vendedor/:path*"] };
