# Butaca — catálogo colaborativo de películas

TP2 de Programación Web Full Stack (2026). Aplicación full stack con backend en **Express + TypeScript +
MongoDB**, frontend en **React + Vite + TypeScript**, autenticación con **Better Auth** (email/contraseña,
GitHub y Google) y un **asistente con LangChain + Gemini**. Desplegada en Render.

| | URL |
|---|---|
| Frontend (Static Site) | https://butaca-3mfi.onrender.com |
| Backend (Web Service) | https://tp2-peliculas-vewt.onrender.com (la app se usa desde el front; el back responde en `/health` y `/api/*`) |
| Repositorio | https://github.com/lauta136/tp2-peliculas |

> El backend usa el plan free de Render: si estuvo 15 minutos sin uso, el primer request tarda ~50 s.

## La app y la entidad elegida

Cada usuario lleva su lista de **películas**: las carga, las puntúa y marca cuáles ya vio. El catálogo es
público y muestra las películas de todos; cada una queda a nombre de quien la cargó.

Entidad `Movie` (recurso `/api/movies`):

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | texto | obligatorio, máx. 150 |
| `director` | texto | obligatorio, máx. 100 |
| `genre` | texto (enum) | `Accion`, `Animacion`, `Ciencia ficcion`, `Comedia`, `Documental`, `Drama`, `Fantasia`, `Romance`, `Suspenso`, `Terror`, `Otro` |
| `releaseDate` | fecha | obligatoria, entre 1888 y 2100 |
| `durationMinutes` | número entero | 1 a 600 |
| `rating` | número | 0 a 10 |
| `watched` | booleano | por defecto `false` |
| `synopsis` | texto | opcional, máx. 1000 |
| `posterUrl` | texto (URL) | opcional |
| `ownerId` / `ownerName` | texto | los pone el backend con el usuario de la sesión, nunca el cliente |

## Roles y permisos

Implementa el opcional **"cada usuario ve / edita solo sus propios registros"**, con el criterio
confirmado con el profesor:

| Acción | Sin sesión | `user` (por defecto al registrarse) | `admin` |
|---|---|---|---|
| Ver el catálogo y el detalle | ✅ | ✅ | ✅ |
| Ver solo mis películas (`?mine=true`) | ❌ 401 | ✅ | ✅ |
| Crear película (queda a su nombre) | ❌ 401 | ✅ | ✅ |
| Editar / eliminar película **propia** | ❌ 401 | ✅ | ✅ |
| Editar / eliminar película **ajena** | ❌ 401 | ❌ 403 | ✅ |
| Ver estadísticas del catálogo (`/api/movies/stats`) | ❌ 401 | ❌ 403 | ✅ |
| Gestionar usuarios (crear, cambiar rol, eliminar) | ❌ 401 | ❌ 403 | ✅ |

- La consigna base pide escritura solo para admin con `authMiddleware` + `requireRole("admin")`. Con el
  opcional de registros propios, el user también crea y edita lo suyo, así que las rutas de escritura usan
  `authMiddleware` + `requireRole("user", "admin")` y el controller chequea la propiedad con
  `canModifyMovie` (dueño o admin, si no **403**).
- Lo que es solo de admin usa `authMiddleware` + `requireRole("admin")`: `GET /api/movies/stats`
  (estadísticas del catálogo que muestra el panel de admin) — ver `backend/src/routes/movies.routes.ts`.
- La gestión de usuarios usa el plugin `admin` de Better Auth (`authClient.admin.setRole`, `createUser`,
  `removeUser`), que solo acepta requests de usuarios con rol `admin`.
- En el front, `/admin` está protegida por rol: un usuario común ve la pantalla **"Sin permisos"**.

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| admin | `admin@peliculas.test` | `AdminPeliculas2026` |
| user | `user@peliculas.test` | `UserPeliculas2026` |

Los crea `npm run seed` (ver abajo), junto con 12 películas de ejemplo repartidas entre los dos.

## API

Base: `/api`. Errores siempre como `{ "error": { "message": "...", "details": { "campo": ["..."] } } }`.

### Películas

| Método | Ruta | Rol requerido | Respuestas |
|---|---|---|---|
| GET | `/api/movies` | público (`mine=true` requiere sesión) | 200, 400, 401 |
| GET | `/api/movies/stats` | `admin` | 200, 401, 403 |
| GET | `/api/movies/:id` | público | 200, 400 (id inválido), 404 |
| POST | `/api/movies` | `user` o `admin` | 201, 400, 401 |
| PUT | `/api/movies/:id` | `user` (solo propias) o `admin` | 200, 400, 401, 403, 404 |
| PATCH | `/api/movies/:id` | `user` (solo propias) o `admin` | 200, 400, 401, 403, 404 |
| DELETE | `/api/movies/:id` | `user` (solo propias) o `admin` | 204, 400, 401, 403, 404 |

Query params de `GET /api/movies`: `search` (título, director o sinopsis), `genre`, `watched` (`true`/`false`),
`mine` (`true`), `sortBy` (`createdAt`, `title`, `releaseDate`, `rating`, `durationMinutes`),
`sortOrder` (`asc`/`desc`), `page` y `limit` (máx. 50). Responde `{ data, meta: { total, page, limit, totalPages } }`.

`POST` y `PUT` exigen todos los campos obligatorios; `PATCH` acepta cualquier subconjunto (al menos uno).
`PUT` reemplaza la película: un campo opcional que no viene (ej. `posterUrl`) se borra; con `PATCH` queda
como estaba (para sacar el póster con `PATCH`, mandar `"posterUrl": ""`). Todos se validan con Zod y
devuelven **400** con el error de cada campo.

### Otros

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| POST | `/api/agent/chat` | `user` o `admin` | Asistente LangChain (eventos SSE: tools usadas, respuesta y fin) |
| GET | `/api/config` | público | Qué logins sociales y si el asistente están habilitados |
| GET | `/health` | público | Estado del servidor |
| * | `/api/auth/*` | — | Better Auth: `sign-up/email`, `sign-in/email`, `sign-in/social`, `sign-out`, `get-session`, `callback/github`, `callback/google` |
| * | `/api/auth/admin/*` | `admin` | Plugin admin: `list-users`, `create-user`, `set-role`, `remove-user` |

## Asistente (LangChain + Gemini)

Ruta `/chat` del front (requiere sesión). Un agente de LangChain (`createAgent`, loop ReAct) con Gemini y
cinco tools: `list_movies`, `get_movie`, `create_movie`, `update_movie` y `delete_movie`. Las tools usan
el **mismo service** que la API REST, y las de escritura chequean los permisos adentro de la tool con el
usuario de la sesión, que llega en `runtime.context` (el modelo no lo ve ni lo puede falsificar): un `user`
no puede editar películas ajenas aunque se lo pida al asistente. La respuesta llega por SSE: primero qué tools
está usando y después el texto. A Gemini se lo llama sin streaming, porque el SDK que usa `@langchain/google-genai`
falla al parsear el streaming de los modelos 3.x.

Ejemplos: *"¿cuáles son las 3 mejores películas de ciencia ficción?"*, *"marcá Dune como vista"*,
*"agregá Whiplash, de Damien Chazelle, drama, 2014, 106 minutos, un 9"*.

Si falta `GEMINI_API_KEY` el servidor arranca igual, el link al asistente no se muestra y
`/api/agent/chat` responde 503.

## Opcionales implementados

- **Paginación, filtros y búsqueda** en el listado (el estado vive en la URL: se puede compartir y F5 lo mantiene).
- **Registros propios**: cada usuario crea, edita y elimina solo sus películas (página *Mis películas*).
- **Login con Google** además de GitHub.
- **Página de admin para cambiar roles** (`authClient.admin.setRole`), crear y eliminar usuarios.
- **Agente con LangChain** (clases 14 y 15), con Gemini.

## Estructura

```
backend/
  src/
    agent/          agente LangChain: llm, prompt, contexto y tools
    config/db.ts    conexión a Mongo (mongoose)
    controllers/    capa HTTP
    lib/            auth (Better Auth), permisos, helpers
    middlewares/    authMiddleware, optionalAuth, requireRole, validateBody/validateQuery
    models/         Movie (mongoose)
    routes/         /api/movies, /api/agent, /api/config
    schemas/        Zod
    services/       lógica de negocio (la comparten la API y el agente)
  scripts/seed.ts   usuarios de prueba + películas de ejemplo
frontend/
  src/
    components/     MovieCard, MovieForm, MovieManager (ABM), filtros, paginación
    layouts/        Layout con navegación, AuthLayout
    lib/            axios, cliente de Better Auth, SSE, permisos
    pages/          Home, MovieDetail, Login, Register, MyMovies, Profile, Chat, admin/*
    router/         rutas públicas, privadas y por rol (ProtectedRoute)
    schemas/        Zod para React Hook Form
    store/          RTK Query
```

## Correr en local

Requisitos: Node 22 o superior y una base MongoDB que sea **replica set**, porque Better Auth usa
transacciones. Sirve un cluster gratis de Atlas o un `mongod --replSet rs0` local.

```bash
# 1. Backend
cd backend
cp .env.example .env     # completar las variables (ver tabla)
npm install
npm run seed             # crea los usuarios de prueba y las películas de ejemplo
npm run agent:chat -- "¿cuál es la mejor película?"   # opcional: prueba el asistente desde la terminal
npm run dev              # http://localhost:3000

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Se entra siempre por **http://localhost:5173**: Vite reenvía `/api` al backend (proxy en
`vite.config.ts`), igual que el rewrite de Render en producción. Así la cookie de sesión es del mismo
origen y no hace falta CORS.

### Variables de entorno (`backend/.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | no | Puerto del backend (local 3000; Render la inyecta sola) |
| `NODE_ENV` | no | `development` / `production` |
| `MONGODB_URI` | sí | URI de MongoDB (Atlas: `mongodb+srv://usuario:contraseña@.../peliculas`) |
| `BETTER_AUTH_SECRET` | sí | Secreto de sesiones: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `BETTER_AUTH_URL` | sí | URL pública del **front** (local `http://localhost:5173`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | para GitHub | OAuth App de GitHub |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | para Google | OAuth Client de Google |
| `GEMINI_API_KEY` | para el asistente | Key de https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | no | Modelo de Gemini (por defecto `gemini-3.5-flash-lite`; el plan gratis tiene una cuota diaria por modelo) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | para el seed | Usuario admin de prueba |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | para el seed | Usuario común de prueba |

Si faltan las variables de GitHub o Google, ese botón de login no aparece y el resto funciona igual.

## Deploy en Render

### 1. MongoDB Atlas

*Network Access → Add IP Address → `0.0.0.0/0`* (las IPs de Render cambian).

### 2. Backend: New → Web Service

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Variables: todas las de la tabla anterior con `NODE_ENV=production` y `BETTER_AUTH_URL=https://<front>.onrender.com`.
`--include=dev` hace falta porque con `NODE_ENV=production` npm saltea `typescript`, que es devDependency.

### 3. Frontend: New → Static Site

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

**Redirects/Rewrites**, en este orden:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://<back>.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

La primera hace que el front llame a la API por `/api` (no directo a la URL del back). La segunda hace que
F5 en cualquier ruta de React Router (ej. `/admin`) devuelva la app y no un 404.

### 4. OAuth de producción

- **GitHub** (*Settings → Developer settings → OAuth Apps*): Homepage `https://<front>.onrender.com` y
  Redirect URIs `https://<front>.onrender.com/api/auth/callback/github` y
  `http://localhost:5173/api/auth/callback/github`. GitHub ahora acepta varias Redirect URIs por app, así que
  una sola sirve para local y producción.
- **Google** (*Google Cloud Console → APIs y servicios → Credenciales → ID de cliente OAuth, aplicación web*):
  origen autorizado `https://<front>.onrender.com`, URI de redirección
  `https://<front>.onrender.com/api/auth/callback/google` (y las mismas con `http://localhost:5173` para local).
  En *Público* la app tiene que estar **publicada (En producción)**, no en modo prueba, para que pueda entrar
  cualquier cuenta. Para publicar, Google pide en *Desarrollo de la marca* la página principal, el dominio
  autorizado y un link a la política de privacidad: la app la tiene en `/privacidad`. Con los scopes básicos
  (`openid`, `email`, `profile`) y sin logo, Google no exige verificación.

### 5. Datos de prueba en producción

Con `MONGODB_URI` apuntando a Atlas: `cd backend && npm run seed` (desde local o desde el *Shell* del
servicio en Render).

## Seguridad

- Ningún secreto en el repositorio: `.env` está en `.gitignore` y `backend/.env.example` solo tiene nombres de variables.
- El dueño de una película sale de la sesión, nunca del body.
- Los filtros de búsqueda se arman campo por campo desde input validado y se escapan las regex.
- Sesiones en Mongo (revocables) con cookie `httpOnly` del mismo origen.
