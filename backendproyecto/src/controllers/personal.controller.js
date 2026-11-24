'use strict';

const { pool } = require('../config/db');
const { HttpError } = require('../utils/errors');
const { buildInsert, buildUpdate } = require('../utils/sql');
const {
  has,
  pick,
  assertPresent,
  assertNotEmpty,
  parseId,
  toRequiredString,
  toInteger,
  toBooleanFlag,
  toDateOnly,
  parsePagination,
  parseSearch
} = require('../utils/validation');

const TABLE = 'personal';
const ID_COLUMN = 'idPersonal';

const EDITABLE_FIELDS = ['Apellido_y_Nombre', 'Fecha_de_Ingreso', 'Tarea_Cumplida', 'idHotel'];
const REQUIRED_ON_CREATE = ['Apellido_y_Nombre', 'Fecha_de_Ingreso', 'idHotel'];

const SELECT_FIELDS = [
  '`idPersonal`',
  '`Apellido_y_Nombre`',
  '`Fecha_de_Ingreso`',
  '`Tarea_Cumplida`',
  '`idHotel`'
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

  if (has(data, 'Apellido_y_Nombre')) {
    payload.Apellido_y_Nombre = toRequiredString(
      data.Apellido_y_Nombre,
      'Apellido_y_Nombre',
      { maxLength: 150 }
    );
  }
  if (has(data, 'Fecha_de_Ingreso')) {
    payload.Fecha_de_Ingreso = toDateOnly(data.Fecha_de_Ingreso, 'Fecha_de_Ingreso');
  }
  if (has(data, 'Tarea_Cumplida')) {
    payload.Tarea_Cumplida = toBooleanFlag(data.Tarea_Cumplida, 'Tarea_Cumplida');
  }
  if (has(data, 'idHotel')) {
    payload.idHotel = toInteger(data.idHotel, 'idHotel', { min: 1 });
  }

  assertNotEmpty(payload);
  return payload;
}

/**
 * Filtro opcional ?idHotel= para listar el personal de un hotel.
 * @param {Record<string, unknown>} query
 * @returns {{ sql: string, params: unknown[] }}
 */
function hotelFilter(query) {
  if (query.idHotel === undefined || query.idHotel === '') {
    return { sql: '', params: [] };
  }
  const idHotel = toInteger(query.idHotel, 'idHotel', { min: 1 });
  return { sql: '`idHotel` = ?', params: [idHotel] };
}

/** GET /api/personal */
async function list(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const search = parseSearch(req.query.search);
  const filter = hotelFilter(req.query);

  const conditions = [];
  const filters = [];

  if (search) {
    conditions.push('`Apellido_y_Nombre` LIKE ?');
    filters.push(`%${search}%`);
  }
  if (filter.sql) {
    conditions.push(filter.sql);
    filters.push(...filter.params);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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

/** GET /api/personal/:id */
async function getById(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    throw new HttpError(404, `No existe un empleado con ${ID_COLUMN} = ${id}`);
  }

  res.json({ data: rows[0] });
}

/** POST /api/personal */
async function create(req, res) {
  const payload = normalize(req.body);
  if (!Object.prototype.hasOwnProperty.call(payload, 'Tarea_Cumplida')) {
    payload.Tarea_Cumplida = 0;
  }

  const { sql, params } = buildInsert(TABLE, payload);
  const [result] = await pool.execute(sql, params);

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [result.insertId]
  );

  res.status(201).location(`/api/personal/${result.insertId}`).json({ data: rows[0] });
}

/** PUT /api/personal/:id */
async function replace(req, res) {
  return save(req, res, { partial: false });
}

/** PATCH /api/personal/:id */
async function update(req, res) {
  return save(req, res, { partial: true });
}

async function save(req, res, { partial }) {
  const id = parseId(req.params.id, ID_COLUMN);
  const payload = normalize(req.body, { partial });
  const { sql, params } = buildUpdate(TABLE, ID_COLUMN, id, payload);
  const [result] = await pool.execute(sql, params);

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un empleado con ${ID_COLUMN} = ${id}`);
  }

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  res.json({ data: rows[0] });
}

/** DELETE /api/personal/:id */
async function remove(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [result] = await pool.execute(
    `DELETE FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ?`,
    [id]
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un empleado con ${ID_COLUMN} = ${id}`);
  }

  res.status(204).send();
}

module.exports = { list, getById, create, replace, update, remove };
