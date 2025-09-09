// prisma.config.ts
import 'dotenv/config'; // <-- carga .env automáticamente

import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "./prisma/schema.prisma",
    migrations: {
        seed: "ts-node prisma/seed.ts",
    },
});