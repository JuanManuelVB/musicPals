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

El dominio identifica la procedencia mediante `DataSource`: `demo`, `spotify-api`,
`spotify-zip`, `ytmusic-zip` y `combined`. Los datos de ejemplo permanecen aislados en `src/mocks/`; la API de
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

### YouTube Music

Hay dos formas de cargar datos, igual que con Spotify:

- **Iniciar sesión con Google** (Ajustes → Conectar YouTube Music). Usa YouTube Data API
  con el permiso `youtube.readonly` y muestra tus canciones con «Me gusta», los artistas
  que más aparecen en ellas y tus listas. Google no ofrece el historial de reproducciones
  por API. Configuración, en Google Cloud Console:
  1. Crea un proyecto y habilita **YouTube Data API v3**.
  2. Configura la pantalla de consentimiento OAuth (modo de prueba) y añade como
     usuarios de prueba las cuentas que vayan a iniciar sesión.
  3. Crea un ID de cliente OAuth de tipo **Aplicación web** y añade en *Orígenes de
     JavaScript autorizados* `http://127.0.0.1:5173` y el dominio de producción (sin
     ruta). No hace falta URI de redirección ni client secret: se usa Google Identity
     Services con ventana emergente.
  4. Pon el ID en `VITE_GOOGLE_CLIENT_ID`. El token dura una hora y no se renueva solo.
- **Historial de Google Takeout**, para estadísticas de escucha. YouTube Music no tiene
  una API pública con el historial, así que se importa desde Google Takeout: selecciona «YouTube y YouTube Music» → historial, con formato
**JSON**, e importa el ZIP (o directamente `watch-history.json`) en Ajustes. Solo se
cuentan las entradas de YouTube Music; los vídeos normales se ignoran. Takeout no
incluye la duración escuchada ni el álbum, así que el tiempo se estima en 3,5 minutos
por reproducción.

Cada plataforma tiene su color (`spotify-400` y `ytmusic-400` en `src/index.css`). El
selector de fuente permite ver Spotify, YouTube Music o «Ambas»; en la vista combinada
artistas y canciones se unen por nombre y cada fila, gráfico y resumen muestra el
reparto por plataforma.
