import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea admin
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Solo administradores pueden crear usuarios" }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, password, phone, role, assignedSellerId } = body;

        // Validaciones
        const errors: Record<string, string> = {};

        if (!name || name.trim().length < 2) {
            errors.name = "El nombre debe tener al menos 2 caracteres";
        }

        if (!email || !email.includes("@")) {
            errors.email = "Email inválido";
        }

        if (!password || password.length < 6) {
            errors.password = "La contraseña debe tener al menos 6 caracteres";
        }

        if (!role || !["CLIENT", "SELLER", "ADMIN"].includes(role)) {
            errors.role = "Rol inválido";
        }

        // Verificar si el email ya existe
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });
            
            if (existingUser) {
                errors.email = "Este email ya está registrado";
            }
        }

        // Si hay errores, retornar
        if (Object.keys(errors).length > 0) {
            return NextResponse.json({ errors }, { status: 400 });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Crear el usuario
        const userData: any = {
            name: name.trim(),
            email: email.toLowerCase(),
            passwordHash,
            phone: phone?.trim() || null,
            role,
            isActive: true,
        };

        // Si es cliente y se asignó un vendedor
        if (role === "CLIENT" && assignedSellerId) {
            // Verificar que el vendedor/admin existe
            const seller = await prisma.user.findUnique({
                where: { 
                    id: assignedSellerId,
                    role: { in: ["SELLER", "ADMIN"] }
                }
            });

            if (seller) {
                userData.assignedSellerId = assignedSellerId;
            }
        }

        const newUser = await prisma.user.create({
            data: userData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                assignedSeller: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({ user: newUser }, { status: 201 });

    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}