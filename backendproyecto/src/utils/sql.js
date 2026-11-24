'use strict';

const { escapeId } = require('mysql2');

/**
 * Arma un INSERT con identificadores escapados y valores parametrizados.
 * @param {string} table
 * @param {Record<string, unknown>} data
 * @returns {{ sql: string, params: unknown[] }}
 */
function buildInsert(table, data) {
  const columns = Object.keys(data);
  const sql = `INSERT INTO ${escapeId(table)} (${columns.map(escapeId).join(', ')}) VALUES (${columns
    .map(() => '?')
    .join(', ')})`;
  return { sql, params: columns.map((column) => data[column]) };
}

/**
 * Arma un UPDATE con identificadores escapados y valores parametrizados.
 * @param {string} table
 * @param {string} idColumn
 * @param {number} id
 * @param {Record<string, unknown>} data
 * @returns {{ sql: string, params: unknown[] }}
 */
function buildUpdate(table, idColumn, id, data) {
  const columns = Object.keys(data);
  const sql = `UPDATE ${escapeId(table)} SET ${columns
    .map((column) => `${escapeId(column)} = ?`)
    .join(', ')} WHERE ${escapeId(idColumn)} = ?`;
  return { sql, params: [...columns.map((column) => data[column]), id] };
}

module.exports = { buildInsert, buildUpdate };
