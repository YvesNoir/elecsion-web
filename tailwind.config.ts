// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/app/**/*.{ts,tsx,mdx}",
        "./src/components/**/*.{ts,tsx}",
        "./src/pages/**/*.{ts,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: "#384A93",   // principal
                    accent:  "#8493D0",   // secundario
                    ink:     "#1C1C1C",   // texto base
                    gray:    "#646464",
                    silver:  "#B5B5B5",
                },
            },
            borderColor: {
                DEFAULT: "#E5E7EB",
            },
        },
    },
    darkMode: "class",
    plugins: [],
} satisfies Config;