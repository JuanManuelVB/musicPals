# musicPals

Estadísticas y análisis musical privado. Fase 1: SPA navegable con datos ficticios.

## Instalación

```bash
npm install react react-dom react-router clsx lucide-react recharts \
  @fontsource-variable/bricolage-grotesque @fontsource-variable/dm-sans
npm install -D vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite \
  @types/react @types/react-dom @types/node
npm run dev
```

## Convenciones

- Importa con el alias `@/` (apunta a `src/`).
- Colores y tipografías viven como tokens en `src/index.css` (bloque `@theme`).
- Los componentes reutilizables viven en `src/ui/`. No uses colores sueltos en las páginas.
- Cada sección es una carpeta en `src/features/` con su `*Page.tsx`.

## Fuentes de datos

El dominio identifica la procedencia mediante `DataSource`: `demo`, `spotify-api` y
`spotify-zip`. Los datos de ejemplo permanecen aislados en `src/mocks/`; la API de
Spotify se modela como afinidad y actividad reciente, mientras que las estadísticas
históricas exactas se reservarán para el historial extendido importado desde ZIP.

Para habilitar Spotify, copia `.env.example` a `.env` y configura un Client ID y la
URI de redirección en el Spotify Developer Dashboard. La SPA usa Authorization Code
con PKCE y no necesita client secret. Los tokens se mantienen en `sessionStorage`
durante la sesión del navegador y se eliminan al desconectar; esto evita persistirlos
en `localStorage`, aunque cualquier token en el navegador sigue estando expuesto al
contexto de la aplicación.

El importador del historial extendido acepta ZIPs con carpetas y procesa todos los
JSON cuyo nombre corresponde a un historial. Valida fechas, artista, canción y
duración, informa de registros importados/descartados y mantiene los registros solo
en memoria del navegador.
