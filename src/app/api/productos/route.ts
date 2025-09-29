import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Obtener parámetros de filtro
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Construir filtros
        const whereClause: any = {
            isActive: true,
            isDeleted: false
        };

        // Agregar filtro de búsqueda si se proporciona
        if (search) {
            whereClause.OR = [
                {
                    sku: {
                        contains: search
                    }
                },
                {
                    name: {
                        contains: search
                    }
                },
                {
                    description: {
                        contains: search
                    }
                }
            ];
        }

        // Obtener productos
        const productos = await prisma.product.findMany({
            where: whereClause,
            include: {
                brand: {
                    select: {
                        name: true
                    }
                },
                category: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: [
                { sku: "asc" },
                { name: "asc" }
            ],
            take: limit,
            skip: offset
        });

        // Contar total de productos para paginación
        const total = await prisma.product.count({
            where: whereClause
        });

        return NextResponse.json({
            productos,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}