# limpieza

Homepage institucional del servicio de limpieza, construida con React y Vite.

## Desarrollo

```bash
npm install
npm run dev
```

El servidor de desarrollo se inicia en `http://localhost:3005` y abre el navegador automáticamente.

## Tipografías

La interfaz usa **Playfair Display** para títulos y **Manrope** para el texto general.
Ambas se cargan desde Google Fonts; si no hay conexión, se utilizan las fuentes serif
y sans del sistema como respaldo.

## Scripts

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera la versión de producción en `dist`.
- `npm run preview`: sirve localmente la versión de producción.
- `npm run lint`: ejecuta Oxlint.

## Acceso de prueba

La aplicación no tiene backend: la autenticación y las cuentas registradas se guardan
en `localStorage` con fines de demostración. Las cuentas disponibles son:

| Rol           | Correo               | Contraseña  |
| ------------- | -------------------- | ----------- |
| Administrador | `admin@limpieza.com` | `admin123`  |
| Cliente       | `cliente@limpieza.com` | `cliente123` |

- Al ingresar como **Administrador** se muestra la pantalla de administración.
- Al ingresar como **Cliente** (o registrarse) la homepage muestra el nombre del cliente
  en el navbar.

## GitHub MCP (OpenCode)

`opencode.json` configura el servidor MCP remoto de GitHub
(`https://api.githubcopilot.com/mcp/`) para consultar el repositorio desde OpenCode.

1. Completá `GITHUB_PERSONAL_ACCESS_TOKEN` en `.env` con un token personal
   ([Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens))
   con scope `repo`.
2. El plugin `.opencode/plugins/github-env/index.js` lee ese token del `.env` y lo
   inyecta en el header `Authorization`, porque OpenCode no carga `.env` por sí solo.
3. Verificá la conexión con `opencode mcp list` (debe decir `connected`).

El `.env` está ignorado por git; el token nunca se versiona.

## Estructura

```
src/
  components/   Navbar, modal de acceso e iconos
  pages/        Home y pantalla de administración
  services/     Autenticación local de demostración
```
