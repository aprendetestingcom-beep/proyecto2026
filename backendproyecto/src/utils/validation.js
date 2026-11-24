'use strict';

const { HttpError } = require('./errors');

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined;
}

/**
 * Devuelve solo las claves permitidas de un objeto.
 * @param {unknown} source
 * @param {string[]} allowed
 * @returns {Record<string, unknown>}
 */
function pick(source, allowed) {
  const result = {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return result;
  for (const key of allowed) {
    if (has(source, key)) result[key] = source[key];
  }
  return result;
}

/**
 * Verifica que los campos indicados estén presentes y no sean null/undefined.
 * @param {Record<string, unknown>} data
 * @param {string[]} fields
 */
function assertPresent(data, fields) {
  const missing = fields.filter((field) => !has(data, field) || data[field] === null);
  if (missing.length > 0) {
    throw new HttpError(400, 'Faltan campos obligatorios', { missing });
  }
}

/**
 * Verifica que el body tenga al menos un campo editable.
 * @param {Record<string, unknown>} data
 */
function assertNotEmpty(data) {
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, 'No se enviaron campos para crear o actualizar el registro');
  }
}

/**
 * Convierte un valor en entero positivo (para claves primarias).
 * @param {unknown} value
 * @param {string} [name]
 * @returns {number}
 */
function parseId(value, name = 'id') {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 4294967295) {
    throw new HttpError(400, `El identificador "${name}" debe ser un entero positivo`);
  }
  return number;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @param {{ minLength?: number, maxLength?: number }} [options]
 * @returns {string}
 */
function toRequiredString(value, field, options = {}) {
  const { minLength = 1, maxLength = 255 } = options;
  if (value === undefined || value === null) {
    throw new HttpError(400, `El campo "${field}" es obligatorio`);
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new HttpError(400, `El campo "${field}" debe ser texto`);
  }
  const text = String(value).trim();
  if (text.length < minLength) {
    throw new HttpError(400, `El campo "${field}" debe tener al menos ${minLength} caracteres`);
  }
  if (text.length > maxLength) {
    throw new HttpError(400, `El campo "${field}" no puede superar los ${maxLength} caracteres`);
  }
  return text;
}

/**
 * Campo de texto opcional. Devuelve null si viene vacío.
 * @param {unknown} value
 * @param {string} field
 * @param {number} maxLength
 * @returns {string | null}
 */
function toOptionalString(value, field, maxLength = 255) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new HttpError(400, `El campo "${field}" debe ser texto`);
  }
  const text = String(value).trim();
  if (text === '') return null;
  if (text.length > maxLength) {
    throw new HttpError(400, `El campo "${field}" no puede superar los ${maxLength} caracteres`);
  }
  return text;
}

/**
 * Entero con rango configurable.
 * @param {unknown} value
 * @param {string} field
 * @param {{ min?: number, max?: number, defaultValue?: number }} [options]
 * @returns {number}
 */
function toInteger(value, field, options = {}) {
  const { min = 0, max = 4294967295, defaultValue } = options;
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new HttpError(400, `El campo "${field}" es obligatorio`);
  }
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new HttpError(400, `El campo "${field}" debe ser un número entero`);
  }
  if (number < min || number > max) {
    throw new HttpError(400, `El campo "${field}" debe estar entre ${min} y ${max}`);
  }
  return number;
}

/**
 * Decimal no negativo, redondeado a 2 decimales (DECIMAL(10,2)).
 * @param {unknown} value
 * @param {string} field
 * @param {{ min?: number, max?: number, defaultValue?: number }} [options]
 * @returns {number}
 */
function toDecimal(value, field, options = {}) {
  const { min = 0, max = 99999999.99, defaultValue } = options;
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new HttpError(400, `El campo "${field}" es obligatorio`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new HttpError(400, `El campo "${field}" debe ser un número válido`);
  }
  if (number < min || number > max) {
    throw new HttpError(400, `El campo "${field}" debe estar entre ${min} y ${max}`);
  }
  return Math.round(number * 100) / 100;
}

/**
 * Convierte múltiples representaciones de booleanos a 0/1 (TINYINT(1)).
 * @param {unknown} value
 * @param {string} field
 * @param {0 | 1} defaultValue
 * @returns {0 | 1}
 */
function toBooleanFlag(value, field, defaultValue = 0) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (value === true || value === 1 || value === '1') return 1;
  if (value === false || value === 0 || value === '0') return 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'si', 'sí'].includes(normalized)) return 1;
    if (['false', 'no'].includes(normalized)) return 0;
  }
  throw new HttpError(400, `El campo "${field}" debe ser verdadero/falso (1/0)`);
}

/**
 * Valida una fecha en formato YYYY-MM-DD.
 * @param {unknown} value
 * @param {string} field
 * @returns {string}
 */
function toDateOnly(value, field) {
  if (value === undefined || value === null || value === '') {
    throw new HttpError(400, `El campo "${field}" es obligatorio`);
  }
  const text = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    throw new HttpError(400, `El campo "${field}" debe tener el formato YYYY-MM-DD`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isValid) {
    throw new HttpError(400, `El campo "${field}" no es una fecha válida`);
  }
  return text;
}

/**
 * Valida un correo electrónico de forma básica.
 * @param {unknown} value
 * @param {string} field
 * @returns {string}
 */
function toEmail(value, field) {
  const email = toRequiredString(value, field, { maxLength: 150 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, `El campo "${field}" no es un correo electrónico válido`);
  }
  return email.toLowerCase();
}

/**
 * Normaliza los parámetros de paginación (?limit y ?offset).
 * @param {Record<string, unknown>} query
 * @returns {{ limit: number, offset: number }}
 */
function parsePagination(query = {}) {
  let limit = DEFAULT_PAGE_SIZE;
  let offset = 0;

  if (query.limit !== undefined && query.limit !== '') {
    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new HttpError(400, `El parámetro "limit" debe ser un entero entre 1 y ${MAX_PAGE_SIZE}`);
    }
  }

  if (query.offset !== undefined && query.offset !== '') {
    offset = Number(query.offset);
    if (!Number.isInteger(offset) || offset < 0) {
      throw new HttpError(400, 'El parámetro "offset" debe ser un entero mayor o igual a 0');
    }
  }

  return { limit, offset };
}

/**
 * Texto de búsqueda opcional para filtros LIKE.
 * @param {unknown} value
 * @returns {string}
 */
function parseSearch(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw new HttpError(400, 'El parámetro "search" debe ser texto');
  }
  return value.trim().slice(0, 100);
}

module.exports = {
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
  toDateOnly,
  toEmail,
  parsePagination,
  parseSearch
};
