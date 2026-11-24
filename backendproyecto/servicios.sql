-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Servidor: cursotesting.com.ar:3306
-- Tiempo de generación: 23-11-2026
-- Versión del servidor: 10.11.13-MariaDB-0ubuntu0.24.04.1
-- Versión de PHP: 8.2.29
--
-- Cambios del 2026-11-23:
--   * Se agregaron `nombre`, `publicado` e `icono` para publicar el catálogo de
--     servicios en el sitio (antes estaba hardcodeado en React).
--   * Las filas históricas quedan con publicado = 0 (registros operativos).
--   * Migración aplicada con: npm run db:migrate (backendproyecto)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `Daniel`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_tarea` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico de la tarea/servicio de limpieza (PK, autoincremental)',
  `nombre` varchar(120) DEFAULT NULL COMMENT 'Nombre corto del servicio (catalogo visible en el sitio)',
  `publicado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = se muestra en el sitio publico; 0 = registro operativo interno',
  `icono` varchar(40) DEFAULT NULL COMMENT 'Clave del icono a mostrar en el sitio (building, sparkles, health, layers, trash, package)',
  `descripcion` text NOT NULL COMMENT 'Descripcion detallada del servicio de limpieza realizado',
  `productos_utilizar` text DEFAULT NULL COMMENT 'Listado de productos e insumos utilizados o requeridos (opcional)',
  `caracteristicas` text DEFAULT NULL COMMENT 'Descripcion ampliada que se muestra en el modal del sitio; editable desde el panel de administracion',
  `estadistica_tareas_realizadas` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cantidad de tareas realizadas en el servicio; contador para estadisticas',
  `facturacion` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto facturado por el servicio en moneda local (no admite negativos)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora de creacion del registro',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha y hora de la ultima modificacion del registro',
  PRIMARY KEY (`id_tarea`),
  KEY `idx_servicios_facturacion` (`facturacion`),
  KEY `idx_servicios_estadistica` (`estadistica_tareas_realizadas`),
  CONSTRAINT `CHK_servicios_facturacion` CHECK (`facturacion` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Servicios de limpieza por hotel: descripcion, insumos, tareas, facturacion y auditoria';

--
-- Catálogo publicado en el sitio (lo consume GET /api/servicios?publicado=1)
--

INSERT INTO `servicios`
  (`nombre`, `publicado`, `icono`, `descripcion`, `productos_utilizar`, `caracteristicas`, `estadistica_tareas_realizadas`, `facturacion`)
VALUES
  ('Limpieza de oficinas', 1, 'building', 'Rutinas diarias y mantenimiento profundo para espacios de trabajo, con horarios adaptados a la actividad de cada institución.', 'Detergente neutro, desinfectante, paños de microfibra, aspiradora', 'Incluye la limpieza diaria de puestos de trabajo, salas de reuniones, recepción, cocinas y sanitarios, con reposición de consumibles.\n• Turnos de mañana, tarde o noche según la actividad de la oficina.\n• Equipos estables con supervisión semanal y planilla de control por sector.\n• Tratamiento diferenciado de superficies de alto contacto: picaportes, teclados y barandas.\n• Coordinación con el responsable de instalaciones para no interrumpir reuniones ni atención al público.', 0, 0.00),
  ('Desinfección profunda', 1, 'sparkles', 'Tratamiento de superficies de alto contacto y áreas críticas con protocolos validados y productos habilitados.', 'Amonio cuaternario, alcohol 70%, guantes, pulverizadores', 'Operativo puntual o periódico para reducir la carga microbiana en ambientes críticos.\n• Aplicación por aspersión o paño húmedo según el tipo de superficie.\n• Productos habilitados y fichas de seguridad disponibles para el cliente.\n• Protocolo validado para oficinas, aulas, consultorios y áreas comunes.\n• Informe final con superficies tratadas, productos usados y tiempo de reingreso.', 0, 0.00),
  ('Limpieza hospitalaria', 1, 'health', 'Operativos especializados para clínicas, sanatorios y centros de salud, con personal capacitado en bioseguridad.', 'Desinfectante hospitalario, descartables, bolsas rojas', 'Dirigido a clínicas, sanatorios, laboratorios y centros de diagnóstico.\n• Personal capacitado en bioseguridad y manejo de residuos patogénicos.\n• Clasificación por áreas crítica, semicrítica y no crítica, con insumos exclusivos por zona.\n• Rutinas de desinfección terminal y refuerzos ante aislamientos.\n• Supervisión con listas de verificación y trazabilidad por habitación o consultorio.', 0, 0.00),
  ('Mantenimiento de pisos', 1, 'layers', 'Pulido, hidrolavado y protección de superficies en halls, pasillos y espacios de gran circulación.', 'Hidrolavadora, cera acrílica, pad de pulido', 'Tratamiento integral de superficies de alto tránsito según el material.\n• Hidrolavado, decapado, pulido y cristalizado de mármol, granito, mosaico y hormigón.\n• Aplicación de ceras y protectores de bajo olor, con tiempos de secado coordinados.\n• Recuperación de juntas y zócalos; opción de trabajos nocturnos o por etapas.\n• Presupuesto por metro cuadrado con relevamiento previo del estado del piso.', 0, 0.00),
  ('Gestión de residuos', 1, 'trash', 'Recolección, clasificación y retiro de residuos según normativa vigente, con trazabilidad por sector.', 'Bolsas diferenciadas, contenedores, guantes', 'Organización del circuito de residuos de la institución, desde la generación hasta el retiro.\n• Separación en origen con contenedores y cartelería por tipo de residuo.\n• Planillas de trazabilidad por sector y frecuencia de retiro.\n• Coordinación con operadores habilitados para residuos comunes y patogénicos.\n• Capacitación breve al personal del cliente sobre el circuito interno.', 0, 0.00),
  ('Insumos y consumibles', 1, 'package', 'Provisión de papel, jabón, alcohol en gel y descartables para que la operación nunca se interrumpa.', 'Papel higiénico, jabón líquido, alcohol en gel, toallas', 'Provisión programada de los insumos que sostienen la operación diaria.\n• Papel higiénico, toallas, jabón líquido, alcohol en gel y descartables.\n• Reposición por calendario o por umbral mínimo de stock, sin costo de envío en CABA.\n• Productos con registro y opciones de bajo impacto ambiental.\n• Facturación mensual consolidada por institución.', 0, 0.00);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
