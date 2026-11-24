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
  toEmail,
  parsePagination,
  parseSearch
} = require('../utils/validation');

const TABLE = 'clientes';
const ID_COLUMN = 'idHotel';

// `Clave` se recibe en texto plano y se guarda hasheada (scrypt).
const EDITABLE_FIELDS = ['Nombre', 'Domicilio', 'Responsable', 'Email', 'Clave', 'NIF'];
const REQUIRED_ON_CREATE = ['Nombre', 'Domicilio', 'Responsable', 'NIF'];

// El hash de la clave nunca se devuelve en las respuestas.
const SELECT_FIELDS = [
  '`idHotel`',
  '`Nombre`',
  '`Domicilio`',
  '`Responsable`',
  '`Email`',
  '`NIF`'
].join(', ');

/**
 * @param {Record<string, unknown>} body
 * @param {{ partial?: boolean }} [options]
 * @returns {Record<string, unknown>}
 */
function normalize(body, { partial = false } = {}) {
  const data = pick(body, EDITABLE_FIELDS);

  if (!partial) assertPresent(data, REQUIRED_ON_CREATE);

  const payload = {};

  if (has(data, 'Nombre')) {
    payload.Nombre = toRequiredString(data.Nombre, 'Nombre', { maxLength: 150 });
  }
  if (has(data, 'Domicilio')) {
    payload.Domicilio = toRequiredString(data.Domicilio, 'Domicilio', { maxLength: 255 });
  }
  if (has(data, 'Responsable')) {
    payload.Responsable = toRequiredString(data.Responsable, 'Responsable', { maxLength: 150 });
  }
  if (has(data, 'Email')) {
    payload.Email = toEmail(data.Email, 'Email');
  }
  if (has(data, 'Clave')) {
    const plain = toRequiredString(data.Clave, 'Clave', { minLength: 8, maxLength: 200 });
    payload.Clave = hashPassword(plain);
  }
  if (has(data, 'NIF')) {
    payload.NIF = toRequiredString(data.NIF, 'NIF', { maxLength: 20 });
  }

  assertNotEmpty(payload);
  return payload;
}

/** GET /api/clientes */
async function list(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const search = parseSearch(req.query.search);

  const where = search
    ? 'WHERE `Nombre` LIKE ? OR `Domicilio` LIKE ? OR `Responsable` LIKE ? OR `NIF` LIKE ? OR `Email` LIKE ?'
    : '';
  const filters = search ? Array(5).fill(`%${search}%`) : [];

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

/** GET /api/clientes/:id */
async function getById(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    throw new HttpError(404, `No existe un cliente con ${ID_COLUMN} = ${id}`);
  }

  res.json({ data: rows[0] });
}

/** POST /api/clientes */
async function create(req, res) {
  const payload = normalize(req.body);
  const { sql, params } = buildInsert(TABLE, payload);
  const [result] = await pool.execute(sql, params);

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [result.insertId]
  );

  res.status(201).location(`/api/clientes/${result.insertId}`).json({ data: rows[0] });
}

/** PUT /api/clientes/:id */
async function replace(req, res) {
  return save(req, res, { partial: false });
}

/** PATCH /api/clientes/:id */
async function update(req, res) {
  return save(req, res, { partial: true });
}

async function save(req, res, { partial }) {
  const id = parseId(req.params.id, ID_COLUMN);
  const payload = normalize(req.body, { partial });
  const { sql, params } = buildUpdate(TABLE, ID_COLUMN, id, payload);
  const [result] = await pool.execute(sql, params);

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un cliente con ${ID_COLUMN} = ${id}`);
  }

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  res.json({ data: rows[0] });
}

/** DELETE /api/clientes/:id */
async function remove(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [result] = await pool.execute(
    `DELETE FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ?`,
    [id]
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un cliente con ${ID_COLUMN} = ${id}`);
  }

  res.status(204).send();
}

module.exports = { list, getById, create, replace, update, remove };
