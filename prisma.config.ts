// prisma.config.ts
import fs from "node:fs";
import { config as loadEnv } from "dotenv";

// En desarrollo Next.js prioriza .env.local. Mantener el mismo origen para
// Prisma evita que sus comandos apunten accidentalmente a la base SQLite vieja.
loadEnv({ path: fs.existsSync(".env.local") ? ".env.local" : ".env" });

import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "./prisma/schema.prisma",
    migrations: {
        seed: "ts-node prisma/seed.ts",
    },
});
