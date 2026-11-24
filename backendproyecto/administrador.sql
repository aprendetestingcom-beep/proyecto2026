-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 19-11-2026 a las 17:54:40
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
-- Estructura de tabla para la tabla `administrador`
--

CREATE TABLE `administrador` (
  `idAdministrador` int(11) NOT NULL COMMENT 'Identificador unico del administrador (PK, autoincremental)',
  `Apellido y Nombre` varchar(200) NOT NULL COMMENT 'Apellido(s) y nombre completo del administrador',
  `Email` varchar(150) NOT NULL COMMENT 'Correo electronico institucional, unico por administrador',
  `N°Móvil` varchar(30) DEFAULT NULL COMMENT 'Numero de movil con prefijo internacional; admite +, espacios y guiones (opcional)',
  `Usuario` varchar(80) NOT NULL COMMENT 'Nombre de usuario para inicio de sesion, unico',
  `Clave` varchar(255) NOT NULL COMMENT 'Hash seguro de la contrasena (bcrypt/argon2); nunca se guarda en texto plano',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha y hora de alta del registro',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha y hora de la ultima modificacion del registro'
) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `administrador`
--
ALTER TABLE `administrador`
  ADD PRIMARY KEY (`idAdministrador`),
  ADD UNIQUE KEY `UQ_administrador_Email` (`Email`),
  ADD UNIQUE KEY `UQ_administrador_Usuario` (`Usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `administrador`
--
ALTER TABLE `administrador`
  MODIFY `idAdministrador` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador unico del administrador (PK, autoincremental)';
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
