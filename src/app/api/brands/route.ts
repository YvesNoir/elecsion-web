// src/app/api/brands/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            where: {
                isActive: true,  // Solo marcas activas
                products: {
                    some: {
                        isActive: true,
                        isDeleted: false
                    }
                }
            },
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        products: {
                            where: {
                                isActive: true,
                                isDeleted: false
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json({ brands });

    } catch (error) {
        console.error("Error fetching brands:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}