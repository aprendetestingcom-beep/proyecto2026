-- =====================================================================
-- Migración 2026-11-23
-- Base: Daniel (MySQL/MariaDB)
--
-- Objetivo:
--   1. `clientes`: credenciales de acceso al portal (Email/Clave scrypt).
--   2. `servicios`: catálogo publicable (nombre/publicado/icono) para que el
--      sitio deje de tener los servicios hardcodeados en React.
--
-- Nota: la carga de la Clave (hash scrypt) y la asignación de credenciales
-- temporales a los clientes existentes no se pueden hacer en SQL puro; se
-- resuelven con `npm run db:migrate` (scripts/migrate-2026-11-23.js).
-- Este archivo deja el DDL por escrito y es idempotente a nivel de columnas.
-- =====================================================================

-- 1. Credenciales de clientes ------------------------------------------------
ALTER TABLE `clientes`
  ADD COLUMN `Email` varchar(150) DEFAULT NULL
    COMMENT 'Correo de acceso al portal del cliente; unico cuando existe' AFTER `Responsable`,
  ADD COLUMN `Clave` varchar(255) DEFAULT NULL
    COMMENT 'Hash scrypt de la contrasena del portal; nunca se guarda en texto plano' AFTER `Email`,
  ADD UNIQUE KEY `UQ_clientes_Email` (`Email`);

-- 2. Catálogo de servicios ---------------------------------------------------
ALTER TABLE `servicios`
  ADD COLUMN `nombre` varchar(120) DEFAULT NULL
    COMMENT 'Nombre corto del servicio (catalogo visible en el sitio)' AFTER `id_tarea`,
  ADD COLUMN `publicado` tinyint(1) NOT NULL DEFAULT 0
    COMMENT '1 = se muestra en el sitio publico; 0 = registro operativo interno' AFTER `nombre`,
  ADD COLUMN `icono` varchar(40) DEFAULT NULL
    COMMENT 'Clave del icono a mostrar en el sitio (building, sparkles, health, layers, trash, package)' AFTER `publicado`,
  ADD COLUMN `caracteristicas` text DEFAULT NULL
    COMMENT 'Descripcion ampliada que se muestra en el modal del sitio; editable desde el panel de administracion' AFTER `descripcion`;

-- 3. Backfill de las filas históricas ---------------------------------------
UPDATE `servicios`
   SET `nombre` = LEFT(`descripcion`, 120)
 WHERE `nombre` IS NULL;
