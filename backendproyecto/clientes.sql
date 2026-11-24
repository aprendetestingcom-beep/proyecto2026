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
--   * Se agregaron `Email` y `Clave` (hash scrypt) para el acceso de clientes.
--   * `Email` es único cuando está informado; `Clave` nunca se guarda en texto plano.
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
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `idHotel` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico del cliente (hotel) dentro del sistema (PK)',
  `Nombre` varchar(150) NOT NULL COMMENT 'Nombre comercial o razon social del hotel cliente',
  `Domicilio` varchar(255) NOT NULL COMMENT 'Direccion postal del hotel cliente',
  `Responsable` varchar(150) NOT NULL COMMENT 'Persona de contacto responsable del hotel cliente',
  `Email` varchar(150) DEFAULT NULL COMMENT 'Correo de acceso al portal del cliente; unico cuando existe',
  `Clave` varchar(255) DEFAULT NULL COMMENT 'Hash scrypt de la contrasena del portal; nunca se guarda en texto plano',
  `NIF` varchar(20) NOT NULL COMMENT 'Identificacion fiscal (NIF/CUIT/CIF) del hotel; unica por cliente',
  PRIMARY KEY (`idHotel`),
  UNIQUE KEY `UQ_clientes_NIF` (`NIF`),
  UNIQUE KEY `UQ_clientes_Email` (`Email`),
  KEY `idx_clientes_nombre` (`Nombre`),
  CONSTRAINT `CHK_clientes_Nombre` CHECK (char_length(trim(`Nombre`)) > 0),
  CONSTRAINT `CHK_clientes_NIF` CHECK (char_length(trim(`NIF`)) >= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Clientes de la cadena: hoteles con datos comerciales, domicilio, responsable y NIF unico';

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
