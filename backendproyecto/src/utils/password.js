'use strict';

const crypto = require('crypto');

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Genera un hash seguro (scrypt) listo para guardar en `administrador`.`Clave`.
 * Formato: scrypt$<saltHex>$<hashHex>
 * @param {string} plainPassword
 * @returns {string}
 */
function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Verifica una contraseña contra un hash generado por hashPassword.
 * @param {string} plainPassword
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPassword(plainPassword, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const [algorithm, salt, hash] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(plainPassword, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

module.exports = { hashPassword, verifyPassword };
