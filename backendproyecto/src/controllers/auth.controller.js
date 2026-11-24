'use strict';

const { pool } = require('../config/db');
const { HttpError } = require('../utils/errors');
const { hashPassword, verifyPassword } = require('../utils/password');
const { buildInsert } = require('../utils/sql');
const { pick, assertPresent, toRequiredString, toEmail } = require('../utils/validation');

const MIN_PASSWORD_LENGTH = 8;

/**
 * Datos que el frontend puede recibir. Nunca incluye el hash de la clave.
 * @param {Record<string, any>} row
 * @returns {{ id: number, nombre: string, email: string, rol: 'ADMIN' | 'CLIENTE', institucion?: string }}
 */
function toPublicAdmin(row) {
  return {
    id: row.idAdministrador,
    nombre: row['Apellido y Nombre'],
    email: row.Email,
    rol: 'ADMIN'
  };
}

/**
 * @param {Record<string, any>} row
 * @returns {{ id: number, nombre: string, email: string, rol: 'ADMIN' | 'CLIENTE', institucion?: string }}
 */
function toPublicCliente(row) {
  return {
    id: row.idHotel,
    nombre: row.Responsable,
    email: row.Email,
    rol: 'CLIENTE',
    institucion: row.Nombre
  };
}

/**
 * Busca un administrador por email o por nombre de usuario.
 * @param {string} identifier
 * @returns {Promise<Record<string, any> | undefined>}
 */
async function findAdmin(identifier) {
  const [rows] = await pool.execute(
    'SELECT `idAdministrador`, `Apellido y Nombre`, `Email`, `Usuario`, `Clave` FROM `administrador` WHERE `Email` = ? OR `Usuario` = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows[0];
}

/**
 * Busca un cliente con acceso al portal por email.
 * @param {string} email
 * @returns {Promise<Record<string, any> | undefined>}
 */
async function findCliente(email) {
  const [rows] = await pool.execute(
    'SELECT `idHotel`, `Nombre`, `Responsable`, `Email`, `Clave` FROM `clientes` WHERE `Email` = ? LIMIT 1',
    [email]
  );
  return rows[0];
}

/** POST /api/auth/login */
async function login(req, res) {
  const data = pick(req.body, ['email', 'password']);
  assertPresent(data, ['email', 'password']);

  const identifier = toRequiredString(data.email, 'email', { maxLength: 150 }).toLowerCase();
  const password = toRequiredString(data.password, 'password', { maxLength: 200 });

  const admin = await findAdmin(identifier);
  if (admin && verifyPassword(password, admin.Clave)) {
    return res.json({ data: toPublicAdmin(admin) });
  }

  const cliente = await findCliente(identifier);
  if (cliente && cliente.Clave && verifyPassword(password, cliente.Clave)) {
    return res.json({ data: toPublicCliente(cliente) });
  }

  // Mismo mensaje para usuario inexistente y clave incorrecta (no revela cuál falló).
  throw new HttpError(401, 'Correo o contraseña incorrectos');
}

/**
 * Comprueba que el email no esté tomado en ninguna de las tablas con acceso.
 * @param {string} email
 */
async function assertEmailDisponible(email) {
  const [[admin]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM `administrador` WHERE `Email` = ?',
    [email]
  );
  const [[cliente]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM `clientes` WHERE `Email` = ?',
    [email]
  );

  if (Number(admin.total) > 0 || Number(cliente.total) > 0) {
    throw new HttpError(409, 'Ya existe una cuenta registrada con ese correo electrónico');
  }
}

/**
 * El NIF identifica al cliente (hotel): no puede repetirse.
 * @param {string} nif
 */
async function assertNifDisponible(nif) {
  const [[cliente]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM `clientes` WHERE `NIF` = ?',
    [nif]
  );

  if (Number(cliente.total) > 0) {
    throw new HttpError(409, 'Ya existe un cliente registrado con ese NIF/CUIT');
  }
}

/** POST /api/auth/register */
async function register(req, res) {
  const data = pick(req.body, [
    'nombre',
    'institucion',
    'domicilio',
    'nif',
    'email',
    'password'
  ]);
  assertPresent(data, ['nombre', 'institucion', 'domicilio', 'nif', 'email', 'password']);

  const payload = {
    Responsable: toRequiredString(data.nombre, 'nombre', { maxLength: 150 }),
    Nombre: toRequiredString(data.institucion, 'institucion', { maxLength: 150 }),
    Domicilio: toRequiredString(data.domicilio, 'domicilio', { maxLength: 255 }),
    NIF: toRequiredString(data.nif, 'nif', { minLength: 6, maxLength: 20 }),
    Email: toEmail(data.email, 'email'),
    Clave: hashPassword(
      toRequiredString(data.password, 'password', {
        minLength: MIN_PASSWORD_LENGTH,
        maxLength: 200
      })
    )
  };

  await assertEmailDisponible(payload.Email);
  await assertNifDisponible(payload.NIF);

  const { sql, params } = buildInsert('clientes', payload);
  const [result] = await pool.execute(sql, params);

  res
    .status(201)
    .location(`/api/clientes/${result.insertId}`)
    .json({
      data: {
        id: result.insertId,
        nombre: payload.Responsable,
        email: payload.Email,
        rol: 'CLIENTE',
        institucion: payload.Nombre
      }
    });
}

module.exports = { login, register, MIN_PASSWORD_LENGTH };
