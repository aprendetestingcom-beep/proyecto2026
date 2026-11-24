-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 19-11-2026 a las 17:55:33
-- Versión del servidor: 10.11.13-MariaDB-0ubuntu0.24.04.1
-- Versión de PHP: 8.2.29

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
-- Estructura de tabla para la tabla `personal`
--

CREATE TABLE `personal` (
  `idPersonal` int(10) UNSIGNED NOT NULL COMMENT 'Identificador unico del empleado (PK, autoincremental)',
  `Apellido_y_Nombre` varchar(150) NOT NULL COMMENT 'Apellido(s) y nombre completo del empleado; indexado para busquedas por nombre',
  `Fecha_de_Ingreso` date NOT NULL COMMENT 'Fecha de alta del empleado en la empresa (formato YYYY-MM-DD)',
  `Tarea_Cumplida` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Estado de la tarea asignada: 1 = cumplida, 0 = pendiente (BOOLEAN en MySQL)',
  `idHotel` int(10) UNSIGNED NOT NULL COMMENT 'Hotel al que esta asignado el empleado (clave foranea logica hacia la tabla hoteles)'
) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `personal`
--
ALTER TABLE `personal`
  ADD PRIMARY KEY (`idPersonal`),
  ADD KEY `idx_personal_id_hotel` (`idHotel`),
  ADD KEY `idx_personal_apellido_nombre` (`Apellido_y_Nombre`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `personal`
--
ALTER TABLE `personal`
  MODIFY `idPersonal` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico del empleado (PK, autoincremental)';
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
