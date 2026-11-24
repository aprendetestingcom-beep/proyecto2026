# Pautas de trabajo — Proyecto Limpieza

Contexto para agentes de IA (y para el equipo). Aplica a todo lo que está dentro de
`frontendproyecto/limpieza`. Leer completo antes de tocar código.

## 1. Ubicación y stack

```
proyectofinal/
├── backendproyecto/          API REST (Express 5 + mysql2) + esquemas .sql
└── frontendproyecto/
    └── limpieza/             Frontend (React 19 + Vite 8) ← este directorio
```

- **Frontend:** React 19, Vite 8, JavaScript con `.jsx`, Babel + React Compiler, lint con oxlint.
- **Backend:** Express 5, mysql2, dotenv, cors, CommonJS, tests con `node --test`.
- **Dev server del frontend:** `http://localhost:3005` (puerto fijo, `strictPort`).

### Comandos

| Dónde | Comando | Qué hace |
| --- | --- | --- |
| `limpieza/` | `npm run dev` | Levanta Vite en `localhost:3005` |
| `limpieza/` | `npm run lint` | Pasa oxlint |
| `limpieza/` | `npm run build` | Build de producción |
| `backendproyecto/` | `npm run dev` | API con `node --watch` |
| `backendproyecto/` | `npm test` | Tests de las cuatro tablas |
| `backendproyecto/` | `npm run db:test` · `db:seed` | Probar conexión · cargar datos |
| `backendproyecto/` | `npm run db:migrate` | Aplicar la migración de esquema (idempotente) |

## 2. Sobre las bases de datos

Las bases de datos están en MySql.

Las bases de datos y las API's se encuentran en la carpeta `backendproyecto` (hermana de
`frontendproyecto`) y las bases reales en el servidor de https://cursotesting.com.ar

Si modificás una tabla, hacé copia del archivo .sql en la carpeta local `backendproyecto`

Esquemas versionados: `administrador.sql`, `clientes.sql`, `personal.sql`, `servicios.sql`.

## 3. Sobre las buenas prácticas

- **Separación de Responsabilidades**: Nunca mezcles la lógica de la base de datos con las rutas de Express ni con los componentes visuales de React.
- **Consultas Preparadas (Prepared Statements)**: Prohibido concatenar variables directamente en las consultas SQL. Siempre usa parámetros seguros para evitar inyecciones SQL.
- **Manejo de Secretos**: Las credenciales de base de datos, puertos y claves secretas van en archivos .env y nunca se suben a Git (.gitignore).
- **Validación de Entradas**: Validar siempre lo que el usuario envía tanto en el frontend como en el backend.
- **Consistencia de Estilos**: Mantén clases de CSS limpias, semánticas y bien estructuradas en archivos dedicados.

## 4. Estructura del frontend

```
src/
├── components/   Componentes reutilizables (Navbar, AuthModal…)
├── pages/        Vistas por rol (Home, AdminHome…)
├── services/     Acceso a la API (http.js, auth.js, servicios.js, estadisticas.js)
├── App.jsx
├── main.jsx
└── *.css         Estilos globales y de la app
```
Utilizá los íconos de lucide-react.

Reglas de ubicación:

- Componente reutilizable → `src/components/`. Pantalla completa → `src/pages/`.
- Toda llamada a la API va en `src/services/`; los componentes no hacen `fetch` directo (usan el cliente único `http.js`).
- Un componente nuevo, un archivo de estilos propio: nada de estilos inline ni de mezclar CSS de pantallas distintas.

## 5. Estado actual (no asumir de más)

- El frontend **ya consume la API** de `backendproyecto`: servicios publicados y totales en la Home, login y registro de clientes. No hay usuarios, servicios ni números hardcodeados.
- Autenticación: `POST /api/auth/login` (administrador por `Email` o `Usuario`, cliente por `Email`) y `POST /api/auth/register` (alta en `clientes` con `Clave` hasheada con scrypt). La sesión en `localStorage` solo guarda datos públicos; todavía no hay token ni rutas protegidas.
- Cada tarjeta de servicio de la Home abre un modal con `servicios.caracteristicas`; el administrador edita ese texto, el nombre y la visibilidad desde su panel (`PATCH /api/servicios/:id`).
- La URL base de la API va en `.env` como `VITE_API_URL` (ver `.env.example`); nunca hardcodeada en `src/`.
- Esquema vigente: `clientes.Email`/`Clave` y `servicios.nombre`/`publicado`/`icono`. Se aplican con `npm run db:migrate` y el DDL queda en `backendproyecto/migraciones/`.
- `limpieza/` tiene `.gitignore` pero **no está inicializado como repositorio git**.

## 6. Qué no hacer

- No commitear `.env` ni credenciales, ni pegarlas en el código.
- No concatenar SQL: siempre parámetros.
- No poner lógica de base de datos en componentes React ni en `src/services` (ahí solo se llama a la API).
- No editar `node_modules` ni archivos generados.
- No dejar el repo con errores de `npm run lint`.