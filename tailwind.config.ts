import type { Config } from "tailwindcss";

const config = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ["Manrope", "sans-serif"],
                heading: ['"M PLUS Rounded 1c"', "sans-serif"],
                serif: ["Lora", "serif"],
                mono: ['"Ubuntu Mono"', "ui-monospace", "monospace"],
            },
        },
    },
    plugins: [],
} satisfies Config;

export default config;
