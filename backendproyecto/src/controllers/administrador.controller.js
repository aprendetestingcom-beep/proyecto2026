'use strict';

const { pool } = require('../config/db');
const { HttpError } = require('../utils/errors');
const { hashPassword } = require('../utils/password');
const { buildInsert, buildUpdate } = require('../utils/sql');
const {
  has,
  pick,
  assertPresent,
  assertNotEmpty,
  parseId,
  toRequiredString,
  toOptionalString,
  toEmail,
  parsePagination,
  parseSearch
} = require('../utils/validation');

const TABLE = 'administrador';
const ID_COLUMN = 'idAdministrador';

const EDITABLE_FIELDS = ['Apellido y Nombre', 'Email', 'N°Móvil', 'Usuario', 'Clave'];

// La contraseña (hash) nunca se devuelve en las respuestas.
const SELECT_FIELDS = [
  '`idAdministrador`',
  '`Apellido y Nombre`',
  '`Email`',
  '`N°Móvil`',
  '`Usuario`',
  '`created_at`',
  '`updated_at`'
].join(', ');

const REQUIRED_ON_CREATE = ['Apellido y Nombre', 'Email', 'Usuario', 'Clave'];

/**
 * Normaliza y valida los datos recibidos.
 * @param {Record<string, unknown>} body
 * @param {{ partial?: boolean }} [options]
 * @returns {Record<string, unknown>}
 */
function normalize(body, { partial = false } = {}) {
  const data = pick(body, EDITABLE_FIELDS);

  if (!partial) assertPresent(data, REQUIRED_ON_CREATE);

  const payload = {};

  if (has(data, 'Apellido y Nombre')) {
    payload['Apellido y Nombre'] = toRequiredString(data['Apellido y Nombre'], 'Apellido y Nombre', {
      maxLength: 200
    });
  }
  if (has(data, 'Email')) {
    payload.Email = toEmail(data.Email, 'Email');
  }
  if (has(data, 'N°Móvil')) {
    payload['N°Móvil'] = toOptionalString(data['N°Móvil'], 'N°Móvil', 30);
  }
  if (has(data, 'Usuario')) {
    payload.Usuario = toRequiredString(data.Usuario, 'Usuario', { minLength: 3, maxLength: 80 });
  }
  if (has(data, 'Clave')) {
    const plain = toRequiredString(data.Clave, 'Clave', { minLength: 8, maxLength: 200 });
    payload.Clave = hashPassword(plain);
  }

  assertNotEmpty(payload);
  return payload;
}

/** GET /api/administrador */
async function list(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const search = parseSearch(req.query.search);

  const where = search
    ? 'WHERE `Apellido y Nombre` LIKE ? OR `Email` LIKE ? OR `Usuario` LIKE ? OR `N°Móvil` LIKE ?'
    : '';
  const filters = search ? Array(4).fill(`%${search}%`) : [];

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` ${where} ORDER BY \`${ID_COLUMN}\` DESC LIMIT ? OFFSET ?`,
    [...filters, limit, offset]
  );

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM \`${TABLE}\` ${where}`,
    filters
  );

  res.json({
    data: rows,
    meta: { total: Number(countRows[0].total), limit, offset }
  });
}

/** GET /api/administrador/:id */
async function getById(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    throw new HttpError(404, `No existe un administrador con ${ID_COLUMN} = ${id}`);
  }

  res.json({ data: rows[0] });
}

/** POST /api/administrador */
async function create(req, res) {
  const payload = normalize(req.body);
  const { sql, params } = buildInsert(TABLE, payload);
  const [result] = await pool.execute(sql, params);

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [result.insertId]
  );

  res.status(201).location(`/api/administrador/${result.insertId}`).json({ data: rows[0] });
}

/** PUT /api/administrador/:id (reemplazo: exige todos los campos obligatorios) */
async function replace(req, res) {
  return save(req, res, { partial: false });
}

/** PATCH /api/administrador/:id (actualización parcial) */
async function update(req, res) {
  return save(req, res, { partial: true });
}

async function save(req, res, { partial }) {
  const id = parseId(req.params.id, ID_COLUMN);
  const payload = normalize(req.body, { partial });
  const { sql, params } = buildUpdate(TABLE, ID_COLUMN, id, payload);
  const [result] = await pool.execute(sql, params);

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un administrador con ${ID_COLUMN} = ${id}`);
  }

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  res.json({ data: rows[0] });
}

/** DELETE /api/administrador/:id */
async function remove(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [result] = await pool.execute(
    `DELETE FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ?`,
    [id]
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un administrador con ${ID_COLUMN} = ${id}`);
  }

  res.status(204).send();
}

module.exports = { list, getById, create, replace, update, remove };
