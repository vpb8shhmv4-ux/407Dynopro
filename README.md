# 407Dynopro — Web

Prototipo funcional de la web de **407Dynopro** (Performance 4x4, Florida).
React + Vite + Tailwind CSS. Todo el estado vive en memoria: no hay backend.

## Qué incluye

- **Vista Cliente**: buscador "Shop by Vehicle" (año / marca / modelo) y flujo de
  configuración en cascada — Stages de suspensión 1–4, rines y cauchos con
  compatibilidad por Stage, performance packages, armor, y el módulo final
  "Ármalo tú mismo" con resumen dinámico del build.
- **Panel Administrativo**: edición en vivo de todo el catálogo (vehículos,
  Stages, rines, performance, armor), color de acento, imágenes y consola de leads.

Se cambia de vista con el menú superior (etiqueta "dev preview").

## Correr en local

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abre la URL que imprime la terminal (normalmente http://localhost:5173).

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ para revisar el build
```

## Publicar en GitHub Pages

1. Crea un repo en GitHub y sube el proyecto:

   ```bash
   git init
   git add .
   git commit -m "407Dynopro web"
   git branch -M main
   git remote add origin https://github.com/USUARIO/REPO.git
   git push -u origin main
   ```

2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` compila y publica en cada push a `main`.
   La URL queda en `https://USUARIO.github.io/REPO/`.

`vite.config.js` usa `base: "./"` (rutas relativas), así que funciona igual en
GitHub Pages, Netlify, Vercel o un dominio propio, sin tocar configuración.

Para Netlify/Vercel: build command `npm run build`, publish directory `dist`.

## Estructura

```
index.html               # documento raíz
src/main.jsx             # punto de entrada de React
src/index.css            # directivas de Tailwind + reset
src/App.jsx              # toda la aplicación (store, vista cliente, admin)
src/assets/hero-truck.webp
```

## Notas técnicas

- **El estado no persiste.** Al recargar, el catálogo vuelve a sus valores por
  defecto y los leads se pierden. Para producción hay que conectar los `setX`
  del store contra una API o base de datos.
- Los datos por defecto están arriba de `src/App.jsx`: `DEFAULT_VEHICLES`,
  `DEFAULT_STAGES`, `DEFAULT_WHEELS`, `DEFAULT_PERFORMANCE`, `DEFAULT_ARMOR`.
- Los cursores (llave inglesa y tuerca) son SVG inline. Safari históricamente
  ignora los cursores SVG y cae al cursor por defecto.
- La foto del hero se importa como módulo, así Vite le pone hash y respeta el
  `base` en cualquier hosting.
