// prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Admin
    const admin = await prisma.user.upsert({
        where: { email: "admin@elecsion.com" },
        update: {},
        create: {
            email: "admin@elecsion.com",
            name: "Admin",
            role: UserRole.ADMIN,
            isActive: true,
        },
    });

    // Seller
    const seller = await prisma.user.upsert({
        where: { email: "vendedor@elecsion.com" },
        update: {},
        create: {
            email: "vendedor@elecsion.com",
            name: "Vendedor Demo",
            role: UserRole.SELLER,
            isActive: true,
        },
    });

    // Client asignado a ese seller
    const client = await prisma.user.upsert({
        where: { email: "cliente@empresa.com" },
        update: { assignedSellerId: seller.id, isActive: true },
        create: {
            email: "cliente@empresa.com",
            name: "Cliente Demo",
            role: UserRole.CLIENT,
            isActive: true,
            assignedSellerId: seller.id,
        },
    });

    console.log({ admin, seller, client });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });