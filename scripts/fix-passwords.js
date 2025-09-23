const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserPasswords() {
    try {
        console.log('🔍 Buscando usuarios sin contraseña...');
        
        // Buscar usuarios que no tienen contraseña o tienen contraseña vacía
        const usersWithoutPassword = await prisma.user.findMany({
            where: {
                OR: [
                    { passwordHash: null },
                    { passwordHash: '' }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true
            }
        });

        console.log(`📊 Encontrados ${usersWithoutPassword.length} usuarios sin contraseña:`);
        
        usersWithoutPassword.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - Password: ${user.passwordHash ? 'exists' : 'null/empty'}`);
        });

        if (usersWithoutPassword.length === 0) {
            console.log('✅ Todos los usuarios ya tienen contraseña asignada.');
            return;
        }

        console.log('🔐 Hasheando contraseña por defecto "123456"...');
        const defaultPassword = '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        console.log('📝 Actualizando usuarios...');
        
        for (const user of usersWithoutPassword) {
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hashedPassword }
            });
            console.log(`   ✅ ${user.name} (${user.email}) - Contraseña asignada: ${defaultPassword}`);
        }

        console.log(`🎉 Se han actualizado ${usersWithoutPassword.length} usuarios exitosamente.`);
        console.log('⚠️  Recuerda que todos estos usuarios ahora tienen la contraseña: 123456');
        console.log('💡 Se recomienda que cambien sus contraseñas usando la nueva funcionalidad de cambio de contraseña.');

    } catch (error) {
        console.error('❌ Error actualizando contraseñas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserPasswords();