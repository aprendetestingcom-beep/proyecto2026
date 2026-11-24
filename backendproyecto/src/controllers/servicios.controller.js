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
  toOptionalString,
  toInteger,
  toDecimal,
  toBooleanFlag,
  parsePagination,
  parseSearch
} = require('../utils/validation');

const TABLE = 'servicios';
const ID_COLUMN = 'id_tarea';

const EDITABLE_FIELDS = [
  'nombre',
  'publicado',
  'icono',
  'descripcion',
  'productos_utilizar',
  'caracteristicas',
  'estadistica_tareas_realizadas',
  'facturacion'
];
const REQUIRED_ON_CREATE = ['descripcion'];

const SELECT_FIELDS = [
  '`id_tarea`',
  '`nombre`',
  '`publicado`',
  '`icono`',
  '`descripcion`',
  '`productos_utilizar`',
  '`caracteristicas`',
  '`estadistica_tareas_realizadas`',
  '`facturacion`',
  '`created_at`',
  '`updated_at`'
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

  if (has(data, 'nombre')) {
    payload.nombre = toOptionalString(data.nombre, 'nombre', 120);
  }
  if (has(data, 'publicado')) {
    payload.publicado = toBooleanFlag(data.publicado, 'publicado');
  }
  if (has(data, 'icono')) {
    payload.icono = toOptionalString(data.icono, 'icono', 40);
  }
  if (has(data, 'descripcion')) {
    payload.descripcion = toRequiredString(data.descripcion, 'descripcion', { maxLength: 5000 });
  }
  if (has(data, 'productos_utilizar')) {
    payload.productos_utilizar = toOptionalString(
      data.productos_utilizar,
      'productos_utilizar',
      5000
    );
  }
  if (has(data, 'caracteristicas')) {
    payload.caracteristicas = toOptionalString(data.caracteristicas, 'caracteristicas', 5000);
  }
  if (has(data, 'estadistica_tareas_realizadas')) {
    payload.estadistica_tareas_realizadas = toInteger(
      data.estadistica_tareas_realizadas,
      'estadistica_tareas_realizadas',
      { min: 0 }
    );
  }
  if (has(data, 'facturacion')) {
    payload.facturacion = toDecimal(data.facturacion, 'facturacion', { min: 0 });
  }

  assertNotEmpty(payload);
  return payload;
}

/** GET /api/servicios */
async function list(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const search = parseSearch(req.query.search);

  // ?publicado=1 devuelve solo el catálogo visible en el sitio público.
  const publicado =
    req.query.publicado === undefined || req.query.publicado === ''
      ? null
      : toBooleanFlag(req.query.publicado, 'publicado');

  // ?orden=asc|desc define el sentido del listado (por clave primaria).
  const orden = String(req.query.orden ?? '').trim().toLowerCase();
  if (!['', 'asc', 'desc'].includes(orden)) {
    throw new HttpError(400, 'El parámetro "orden" debe ser "asc" o "desc"');
  }
  const direction = orden === 'asc' ? 'ASC' : 'DESC';

  const conditions = [];
  const filters = [];

  if (search) {
    conditions.push('(`nombre` LIKE ? OR `descripcion` LIKE ? OR `productos_utilizar` LIKE ?)');
    filters.push(...Array(3).fill(`%${search}%`));
  }
  if (publicado !== null) {
    conditions.push('`publicado` = ?');
    filters.push(publicado);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` ${where} ORDER BY \`${ID_COLUMN}\` ${direction} LIMIT ? OFFSET ?`,
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

/** GET /api/servicios/:id */
async function getById(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    throw new HttpError(404, `No existe un servicio con ${ID_COLUMN} = ${id}`);
  }

  res.json({ data: rows[0] });
}

/** POST /api/servicios */
async function create(req, res) {
  const payload = normalize(req.body);
  if (!Object.prototype.hasOwnProperty.call(payload, 'estadistica_tareas_realizadas')) {
    payload.estadistica_tareas_realizadas = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(payload, 'facturacion')) {
    payload.facturacion = 0;
  }

  const { sql, params } = buildInsert(TABLE, payload);
  const [result] = await pool.execute(sql, params);

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [result.insertId]
  );

  res.status(201).location(`/api/servicios/${result.insertId}`).json({ data: rows[0] });
}

/** PUT /api/servicios/:id */
async function replace(req, res) {
  return save(req, res, { partial: false });
}

/** PATCH /api/servicios/:id */
async function update(req, res) {
  return save(req, res, { partial: true });
}

async function save(req, res, { partial }) {
  const id = parseId(req.params.id, ID_COLUMN);
  const payload = normalize(req.body, { partial });
  const { sql, params } = buildUpdate(TABLE, ID_COLUMN, id, payload);
  const [result] = await pool.execute(sql, params);

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un servicio con ${ID_COLUMN} = ${id}`);
  }

  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS} FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ? LIMIT 1`,
    [id]
  );

  res.json({ data: rows[0] });
}

/** DELETE /api/servicios/:id */
async function remove(req, res) {
  const id = parseId(req.params.id, ID_COLUMN);
  const [result] = await pool.execute(
    `DELETE FROM \`${TABLE}\` WHERE \`${ID_COLUMN}\` = ?`,
    [id]
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, `No existe un servicio con ${ID_COLUMN} = ${id}`);
  }

  res.status(204).send();
}

module.exports = { list, getById, create, replace, update, remove };
