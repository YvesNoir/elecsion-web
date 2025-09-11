// prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Hash de la contraseña "123456" para todos los usuarios
    const passwordHash = await bcrypt.hash("123456", 12);

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: "admin@elecsion.com" },
        update: { passwordHash, phone: "+5491150011001" },
        create: {
            email: "admin@elecsion.com",
            name: "Admin",
            phone: "+5491150011001",
            role: UserRole.ADMIN,
            isActive: true,
            passwordHash,
        },
    });

    // Seller
    const seller = await prisma.user.upsert({
        where: { email: "vendedor@elecsion.com" },
        update: { passwordHash, phone: "+5491150011002" },
        create: {
            email: "vendedor@elecsion.com",
            name: "Vendedor Demo",
            phone: "+5491150011002",
            role: UserRole.SELLER,
            isActive: true,
            passwordHash,
        },
    });

    // Client asignado a ese seller
    const client = await prisma.user.upsert({
        where: { email: "cliente@empresa.com" },
        update: { assignedSellerId: seller.id, isActive: true, passwordHash, phone: "+5491150011003" },
        create: {
            email: "cliente@empresa.com",
            name: "Cliente Demo",
            phone: "+5491150011003",
            role: UserRole.CLIENT,
            isActive: true,
            assignedSellerId: seller.id,
            passwordHash,
        },
    });

    console.log({ admin, seller, client });

    // Crear marcas
    console.log('🏷️ Creando marcas...');
    const brands = await Promise.all([
        prisma.brand.upsert({
            where: { slug: "schneider-electric" },
            update: {},
            create: {
                name: "Schneider Electric",
                slug: "schneider-electric",
                code: 1001
            }
        }),
        prisma.brand.upsert({
            where: { slug: "siemens" },
            update: {},
            create: {
                name: "Siemens",
                slug: "siemens",
                code: 1002
            }
        }),
        prisma.brand.upsert({
            where: { slug: "abb" },
            update: {},
            create: {
                name: "ABB",
                slug: "abb",
                code: 1003
            }
        }),
        prisma.brand.upsert({
            where: { slug: "legrand" },
            update: {},
            create: {
                name: "Legrand",
                slug: "legrand",
                code: 1004
            }
        }),
        prisma.brand.upsert({
            where: { slug: "philips" },
            update: {},
            create: {
                name: "Philips",
                slug: "philips",
                code: 1005
            }
        })
    ]);

    // Crear categorías principales
    console.log('📂 Creando categorías...');
    const electricalCategory = await prisma.category.upsert({
        where: { slug: "material-electrico" },
        update: {},
        create: {
            name: "Material Eléctrico",
            slug: "material-electrico"
        }
    });

    const hardwareCategory = await prisma.category.upsert({
        where: { slug: "ferreteria" },
        update: {},
        create: {
            name: "Ferretería",
            slug: "ferreteria"
        }
    });

    const lightingCategory = await prisma.category.upsert({
        where: { slug: "iluminacion" },
        update: {},
        create: {
            name: "Iluminación",
            slug: "iluminacion"
        }
    });

    // Crear subcategorías
    const switchesCategory = await prisma.category.upsert({
        where: { slug: "interruptores" },
        update: {},
        create: {
            name: "Interruptores",
            slug: "interruptores",
            parentId: electricalCategory.id
        }
    });

    const outletsCategory = await prisma.category.upsert({
        where: { slug: "tomacorrientes" },
        update: {},
        create: {
            name: "Tomacorrientes",
            slug: "tomacorrientes",
            parentId: electricalCategory.id
        }
    });

    const cablesCategory = await prisma.category.upsert({
        where: { slug: "cables" },
        update: {},
        create: {
            name: "Cables",
            slug: "cables",
            parentId: electricalCategory.id
        }
    });

    // Crear productos de muestra
    console.log('📦 Creando productos...');
    const products = await Promise.all([
        // Interruptores
        prisma.product.upsert({
            where: { slug: "interruptor-simple-schneider" },
            update: {},
            create: {
                name: "Interruptor Simple 10A",
                slug: "interruptor-simple-schneider",
                sku: "SCH-INT-001",
                description: "Interruptor simple de 10A, color blanco, línea residencial",
                brandId: brands[0].id, // Schneider
                categoryId: switchesCategory.id,
                priceBase: 8500.00,
                currency: "ARS",
                stockQty: 150,
                unit: "unidad",
                isActive: true,
                attributes: {
                    "color": "Blanco",
                    "amperaje": "10A",
                    "tension": "220V",
                    "material": "Plástico ABS"
                }
            }
        }),
        prisma.product.upsert({
            where: { slug: "interruptor-doble-legrand" },
            update: {},
            create: {
                name: "Interruptor Doble 10A Legrand",
                slug: "interruptor-doble-legrand",
                sku: "LEG-INT-002",
                description: "Interruptor doble de 10A, serie Valena Next, color blanco",
                brandId: brands[3].id, // Legrand
                categoryId: switchesCategory.id,
                priceBase: 12750.00,
                currency: "ARS",
                stockQty: 85,
                unit: "unidad",
                isActive: true,
                attributes: {
                    "color": "Blanco",
                    "amperaje": "10A",
                    "tension": "220V",
                    "serie": "Valena Next"
                }
            }
        }),

        // Tomacorrientes
        prisma.product.upsert({
            where: { slug: "tomacorriente-schuko-abb" },
            update: {},
            create: {
                name: "Tomacorriente Schuko 16A ABB",
                slug: "tomacorriente-schuko-abb",
                sku: "ABB-TOM-001",
                description: "Tomacorriente Schuko con puesta a tierra, 16A, 250V",
                brandId: brands[2].id, // ABB
                categoryId: outletsCategory.id,
                priceBase: 15300.00,
                currency: "ARS",
                stockQty: 120,
                unit: "unidad",
                isActive: true,
                attributes: {
                    "tipo": "Schuko",
                    "amperaje": "16A",
                    "tension": "250V",
                    "puesta_tierra": true
                }
            }
        }),

        // Cables
        prisma.product.upsert({
            where: { slug: "cable-unipolar-2-5mm" },
            update: {},
            create: {
                name: "Cable Unipolar 2.5mm² x 100m",
                slug: "cable-unipolar-2-5mm",
                sku: "CAB-UNI-250",
                description: "Cable unipolar de 2.5mm², aislación PVC, rollo de 100 metros",
                categoryId: cablesCategory.id,
                priceBase: 45600.00,
                currency: "ARS",
                stockQty: 25,
                unit: "rollo",
                isActive: true,
                attributes: {
                    "seccion": "2.5mm²",
                    "longitud": "100m",
                    "aislacion": "PVC",
                    "color": "Azul"
                }
            }
        }),

        // Iluminación
        prisma.product.upsert({
            where: { slug: "lampara-led-philips-9w" },
            update: {},
            create: {
                name: "Lámpara LED 9W Luz Cálida Philips",
                slug: "lampara-led-philips-9w",
                sku: "PHI-LED-009",
                description: "Lámpara LED de 9W, luz cálida 3000K, equivale a 60W incandescente",
                brandId: brands[4].id, // Philips
                categoryId: lightingCategory.id,
                priceBase: 3200.00,
                currency: "ARS",
                stockQty: 200,
                unit: "unidad",
                isActive: true,
                attributes: {
                    "potencia": "9W",
                    "equivalencia": "60W",
                    "temperatura_color": "3000K",
                    "tipo_luz": "Cálida",
                    "base": "E27"
                }
            }
        }),

        // Disyuntores
        prisma.product.upsert({
            where: { slug: "disyuntor-diferencial-siemens" },
            update: {},
            create: {
                name: "Disyuntor Diferencial 25A Siemens",
                slug: "disyuntor-diferencial-siemens",
                sku: "SIE-DIS-025",
                description: "Disyuntor diferencial bipolar 25A, sensibilidad 30mA, curva C",
                brandId: brands[1].id, // Siemens
                categoryId: electricalCategory.id,
                priceBase: 28900.00,
                currency: "ARS",
                stockQty: 45,
                unit: "unidad",
                isActive: true,
                attributes: {
                    "amperaje": "25A",
                    "polos": 2,
                    "sensibilidad": "30mA",
                    "curva": "C"
                }
            }
        })
    ]);

    console.log(`✅ Seed completado: ${brands.length} marcas, 6 categorías, ${products.length} productos creados`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });