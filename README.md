# Proyecto 2026 — Sistema de Limpieza de Hoteles (Neoland)

Repositorio del proyecto final. El desarrollo se separa por ramas para que cada
parte evolucione de forma independiente y se pueda integrar a `main` cuando esté
lista.

## Ramas

| Rama | Contenido |
| --- | --- |
| `main` | Rama principal (documentación y punto de integración). |
| `frontend` | Aplicación web en React + Vite (`frontendproyecto/limpieza`). |
| `backend` | API REST (pendiente). |

## Estructura

```
frontendproyecto/
└── limpieza/        Frontend React 19 + Vite 8
```

## Frontend

```bash
cd frontendproyecto/limpieza
npm install
npm run dev      # http://localhost:3005
npm run lint
npm run build
```

La URL de la API se configura en `.env` a partir de `.env.example`.
