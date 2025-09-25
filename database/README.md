# Database Setup

Este directorio contiene los backups de la base de datos de producción para poder replicar el proyecto en otra PC.

## Archivos disponibles:

- `backups/production_backup.sql` - Backup completo de la base de datos con todos los datos de producción

## Configurar la base de datos en una nueva PC:

### 1. Instalar dependencias del proyecto
```bash
npm install
```

### 2. Generar el cliente de Prisma
```bash
npx prisma generate
```

### 3. Crear nueva base de datos desde el backup
```bash
# Opción A: Usar el backup SQL (RECOMENDADO)
sqlite3 prisma/dev.db < database/backups/production_backup.sql

# Opción B: Ejecutar migraciones y seed (base de datos vacía)
npx prisma migrate dev
npm run db:seed
```

### 4. Verificar la instalación
```bash
# Abrir Prisma Studio para ver los datos
npx prisma studio

# O verificar con un query simple
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Product;"
```

## Crear nuevos backups:

```bash
# Crear backup SQL
sqlite3 prisma/dev.db ".dump" > database/backups/backup_$(date +%Y%m%d).sql

# Crear copia directa del archivo
cp prisma/dev.db database/backups/backup_$(date +%Y%m%d).db
```

## Notas importantes:

- El archivo `production_backup.sql` contiene todos los productos, marcas, usuarios y configuraciones actuales
- Este backup fue creado el 25/09/2025 y contiene más de 1000 productos
- Si necesitas datos más actualizados, genera un nuevo backup antes de copiar a otra PC