'use strict';

const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Pool de conexiones a MySQL/MariaDB.
 * Los nombres de las columnas de la base se devuelven tal cual están definidos
 * en los .sql (incluidos los que tienen espacios o acentos).
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Daniel',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // DECIMAL como número (ej. facturacion) y fechas como string 'YYYY-MM-DD HH:mm:ss'
  decimalNumbers: true,
  dateStrings: true
});

/**
 * Comprueba la conexión al iniciar el servidor.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log(
      `[db] Conexión OK -> ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'Daniel'}`
    );
    return true;
  } catch (error) {
    console.error(`[db] No se pudo conectar a la base de datos: ${error.message}`);
    return false;
  }
}

module.exports = { pool, testConnection };
