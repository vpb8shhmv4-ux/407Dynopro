import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" -> rutas relativas. Funciona igual en GitHub Pages de proyecto
// (usuario.github.io/repo/), en Netlify, Vercel o en un dominio propio.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
