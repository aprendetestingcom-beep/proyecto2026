# API de servicios de limpieza para hoteles

API REST en **Node.js + Express 5 + MySQL/MariaDB** que expone un CRUD completo para las
cuatro tablas definidas en los archivos `.sql` del proyecto:

| Tabla           | Recurso               | Clave primaria   |
| --------------- | --------------------- | ---------------- |
| `administrador` | `/api/administrador`  | `idAdministrador`|
| `clientes`      | `/api/clientes`       | `idHotel`        |
| `personal`      | `/api/personal`       | `idPersonal`     |
| `servicios`     | `/api/servicios`      | `id_tarea`       |

## Requisitos

- Node.js 18 o superior
- Acceso a MySQL/MariaDB en `cursotesting.com.ar:3306`, base de datos `Daniel`

## Puesta en marcha

1. La base `Daniel` ya está creada en el servidor del curso con las cuatro tablas.
   Si en cambio se trabaja con una base local, crearla e importar `administrador.sql`,
   `clientes.sql`, `personal.sql` y `servicios.sql`.

2. Revisar el archivo `.env` (ya incluido) con las credenciales del servidor:

   ```env
   PORT=3000
   DB_HOST=cursotesting.com.ar
   DB_PORT=3306
   DB_USER=bases
   DB_PASSWORD=la_provista_por_la_catedra
   DB_NAME=Daniel
   DB_POOL_SIZE=10
   ```

3. Instalar dependencias, verificar la conexión y arrancar:

   ```bash
   npm install
   npm run db:test     # comprueba conexión, versión, tablas y conteos
   npm run db:migrate  # aplica la migración 2026-11-23 (idempotente)
   npm start
   # modo desarrollo con recarga automática:
   npm run dev
   ```

   La API queda en `http://localhost:3000`.

## Estructura del proyecto

```
├── index.js                       # Arranque del servidor
├── .env / .env.example            # Configuración
├── scripts/
│   ├── test-connection.js         # Test de conexión a la base
│   ├── migrate-2026-11-23.js      # Migración de esquema (credenciales de clientes y catálogo)
│   ├── seed.js                    # Carga 10 registros de prueba por tabla
│   ├── test-helpers.js            # Utilidades comunes de testing
│   ├── test-administrador.js      # 10 pruebas de la API administrador
│   ├── test-clientes.js           # 10 pruebas de la API clientes
│   ├── test-personal.js           # 10 pruebas de la API personal
│   └── test-servicios.js          # 9 pruebas de la API servicios
├── migraciones/
│   └── 2026-11-23.sql             # DDL de la migración (referencia)
├── testing.txt                    # Alcance y detalle de las pruebas
└── src/
    ├── app.js                     # Express, middlewares y montaje de rutas
    ├── config/db.js               # Pool de conexiones mysql2
    ├── routes/
    │   ├── index.js               # Agrupa los enrutadores
    │   ├── administrador.routes.js
    │   ├── auth.routes.js         # Login y registro
    │   ├── clientes.routes.js
    │   ├── estadisticas.routes.js # Totales para el sitio
    │   ├── personal.routes.js
    │   └── servicios.routes.js
    ├── controllers/               # Lógica CRUD de cada tabla + auth/estadísticas
    │   ├── administrador.controller.js
    │   ├── auth.controller.js
    │   ├── clientes.controller.js
    │   ├── estadisticas.controller.js
    │   ├── personal.controller.js
    │   └── servicios.controller.js
    ├── middlewares/errorHandler.js
    └── utils/                     # Validaciones, SQL, hash de claves, errores
```

## Endpoints (idénticos para las 4 tablas)

| Método   | Ruta                  | Acción                                  |
| -------- | --------------------- | --------------------------------------- |
| `GET`    | `/api/{recurso}`      | Listar registros                        |
| `GET`    | `/api/{recurso}/:id`  | Obtener un registro                     |
| `POST`   | `/api/{recurso}`      | Crear un registro                       |
| `PUT`    | `/api/{recurso}/:id`  | Reemplazar un registro (campos obligatorios) |
| `PATCH`  | `/api/{recurso}/:id`  | Actualizar parcialmente un registro     |
| `DELETE` | `/api/{recurso}/:id`  | Eliminar un registro                    |

### Listados: paginación y búsqueda

Todos los `GET` de colección aceptan:

- `limit`: cantidad de registros (1 a 200, por defecto 50)
- `offset`: registros a omitir (por defecto 0)
- `search`: texto libre sobre los campos principales de la tabla

`GET /api/personal` además acepta `idHotel` para filtrar el personal de un hotel.
`GET /api/servicios` acepta `publicado` (0/1) y `orden` (`asc`/`desc`, por defecto
`desc`); el sitio público usa `?publicado=1&orden=asc`.

Respuesta de listado:

```json
{
  "data": [ { "...": "..." } ],
  "meta": { "total": 25, "limit": 50, "offset": 0 }
}
```

Las respuestas individuales usan `{ "data": { ... } }`. `DELETE` responde `204 No Content`.

## Autenticación y estadísticas

| Método | Ruta                 | Acción                                                        |
| ------ | -------------------- | ------------------------------------------------------------- |
| `POST` | `/api/auth/login`    | Inicia sesión como administrador o cliente                    |
| `POST` | `/api/auth/register` | Registra un cliente nuevo en la tabla `clientes`              |
| `GET`  | `/api/estadisticas`  | Totales reales (clientes, personal, tareas y servicios)       |

### Login

Acepta `{ "email": "...", "password": "..." }`. El `email` puede ser el `Email`
o el `Usuario` de un administrador; si no coincide con ningún administrador se
busca un cliente por `Email`. Responde `{ "data": { id, nombre, email, rol } }`
con `rol` `ADMIN` o `CLIENTE`. Ante credenciales inválidas responde `401` con el
mismo mensaje en ambos casos (no revela si el correo existe).

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "maria.gomez.w3lq1@cursotesting.com", "password": "Proyecto2026" }'
```

### Registro de clientes

Acepta `{ "nombre", "institucion", "domicilio", "nif", "email", "password" }`.
Crea la fila en `clientes` (`Responsable`, `Nombre`, `Domicilio`, `NIF`, `Email`)
y guarda la contraseña hasheada con scrypt en `Clave` (mínimo 8 caracteres).
Devuelve `201` con el usuario público. `409` si el email ya existe en
`administrador` o `clientes`, o si el NIF ya está registrado.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana Pérez",
    "institucion": "Hotel Sol",
    "domicilio": "Av. Siempre Viva 742",
    "nif": "20-12345678-9",
    "email": "ana@hotelsol.com",
    "password": "Secreta123"
  }'
```

## Ejemplos

### Clientes

```bash
# Listar / buscar
curl "http://localhost:3000/api/clientes?search=hotel&limit=10&offset=0"

# Crear
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "Nombre": "Hotel Sol",
    "Domicilio": "Av. Siempre Viva 742",
    "Responsable": "Ana Pérez",
    "NIF": "20-12345678-9"
  }'

# Obtener uno
curl http://localhost:3000/api/clientes/1

# Actualizar parcialmente
curl -X PATCH http://localhost:3000/api/clientes/1 \
  -H "Content-Type: application/json" \
  -d '{ "Responsable": "Luis Gómez" }'

# Eliminar
curl -X DELETE http://localhost:3000/api/clientes/1
```

### Administrador

Los nombres de columna se conservan tal como están en la base
(`Apellido y Nombre`, `N°Móvil`). La `Clave` se recibe en texto plano y se guarda
hasheada con **scrypt**, y nunca se devuelve en las respuestas.

```bash
curl -X POST http://localhost:3000/api/administrador \
  -H "Content-Type: application/json" \
  -d '{
    "Apellido y Nombre": "Gómez María",
    "Email": "maria@hotel.com",
    "N°Móvil": "+54 9 11 5555-5555",
    "Usuario": "mgomez",
    "Clave": "Secreta123"
  }'
```

### Personal

```bash
curl -X POST http://localhost:3000/api/personal \
  -H "Content-Type: application/json" \
  -d '{
    "Apellido_y_Nombre": "Rodríguez Juan",
    "Fecha_de_Ingreso": "2026-01-15",
    "Tarea_Cumplida": false,
    "idHotel": 1
  }'
```

### Servicios

```bash
curl -X POST http://localhost:3000/api/servicios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Limpieza de habitaciones",
    "publicado": 1,
    "icono": "bed",
    "descripcion": "Limpieza de habitaciones piso 3",
    "productos_utilizar": "Detergente, desinfectante, paños",
    "caracteristicas": "Incluye cambio de blancos y reposición de amenities.\n• Turnos por piso.\n• Supervisión diaria.",
    "estadistica_tareas_realizadas": 1,
    "facturacion": 45000.5
  }'
```

`caracteristicas` es la descripción ampliada que el sitio muestra en el modal de
cada servicio; el panel de administración la edita con `PATCH /api/servicios/:id`
junto con `nombre` y `publicado`.

## Validaciones y errores

- Los campos obligatorios, longitudes, fechas `YYYY-MM-DD`, enteros no negativos y
  decimales se validan antes de llegar a la base.
- Errores con formato uniforme:

  ```json
  { "error": { "message": "El campo \"Nombre\" es obligatorio" } }
  ```

- Códigos usados: `400` datos inválidos, `404` registro inexistente,
  `409` valor único duplicado (Email, Usuario o NIF), `500` error interno.

## Testing de las APIs

Cada tabla tiene su propio script de pruebas de integración contra la base real:

```bash
npm test                    # ejecuta las 39 pruebas de las 4 tablas
npm run test:administrador
npm run test:clientes
npm run test:personal
npm run test:servicios
```

Los scripts levantan la API en un puerto aleatorio, generan datos únicos,
prueban el CRUD completo, validaciones, errores 400/404/409 y limpian los
registros creados al finalizar. El alcance detallado de cada caso está en
`testing.txt`.

## Datos de prueba

La base ya incluye 10 registros de prueba en cada tabla. Para volver a cargar
10 registros adicionales por tabla:

```bash
npm run db:seed
```

El script inserta en una única transacción, genera emails/usuarios/NIF únicos por
lote y asigna cada empleado a uno de los hoteles creados. Todos los administradores
de prueba usan la contraseña `Proyecto2026` (guardada hasheada con scrypt).

| Tabla           | Contenido de prueba                                      |
| --------------- | -------------------------------------------------------- |
| `administrador` | 10 usuarios con nombres, emails y móviles de ejemplo      |
| `clientes`      | 10 hoteles con domicilio, responsable y NIF               |
| `personal`      | 10 empleados con fecha de ingreso y tarea cumplida        |
| `servicios`     | 10 servicios de limpieza con productos, cantidad y facturación |

Los clientes históricos reciben credenciales temporales al aplicar la migración:
`cliente<idHotel>@limpiezainstitucional.com.ar` con contraseña `Proyecto2026`
(guardada hasheada).

## Migraciones

`npm run db:migrate` aplica `scripts/migrate-2026-11-23.js` (idempotente). El DDL
de referencia queda en `migraciones/2026-11-23.sql`:

- `clientes`: nuevas columnas `Email` (único cuando existe) y `Clave` (hash scrypt).
- `servicios`: nuevas columnas `nombre`, `publicado` (1 = visible en el sitio),
  `icono` y `caracteristicas` (descripción ampliada del modal). Las filas
  históricas quedan con `publicado = 0` y se publican 6 servicios de catálogo.
  El catálogo solo se inserta si no hay ningún servicio publicado, para no
  duplicarlo cuando el administrador renombra filas.

Los archivos `clientes.sql` y `servicios.sql` quedaron actualizados con el esquema
vigente (incluido el catálogo publicado).

## Notas

- Las claves foráneas de los `.sql` son lógicas (no hay `FOREIGN KEY` reales), por lo
  que el API no valida la existencia del `idHotel` al crear personal; se recomienda
  hacerlo desde el frontend o agregar la restricción en la base.
- `pool.query`/`pool.execute` usan consultas parametrizadas para evitar inyección SQL.
- `clientes.Email` y `clientes.Clave` son opcionales a nivel de tabla para no romper
  altas administrativas; el alta pública (`/api/auth/register`) siempre las exige.
- Todavía no hay tokens ni rutas protegidas: la sesión vive en el frontend y cualquier
  cliente HTTP puede llamar a la API. Agregar JWT y autorización por rol es el paso
  siguiente si el proyecto lo requiere.
