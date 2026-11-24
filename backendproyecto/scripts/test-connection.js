'use strict';

const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EXPECTED_TABLES = ['administrador', 'clientes', 'personal', 'servicios'];

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Daniel',
  connectTimeout: 15000,
  charset: 'utf8mb4'
};

(async () => {
  console.log(
    `Conectando a ${config.host}:${config.port}/${config.database} como "${config.user}"...`
  );

  let connection;

  try {
    connection = await mysql.createConnection(config);

    const [infoRows] = await connection.query(
      'SELECT VERSION() AS version, DATABASE() AS base, CURRENT_USER() AS usuario, NOW() AS fecha_servidor'
    );
    const info = infoRows[0];

    console.log('OK: conexión establecida');
    console.log(`  Servidor : ${info.version}`);
    console.log(`  Base     : ${info.base}`);
    console.log(`  Usuario  : ${info.usuario}`);
    console.log(`  Hora     : ${info.fecha_servidor}`);

    const [tableRows] = await connection.query(
      `SELECT TABLE_NAME AS nombre
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME`,
      [config.database]
    );
    const existing = tableRows.map((row) => row.nombre);

    console.log(`  Tablas   : ${existing.length > 0 ? existing.join(', ') : '(ninguna)'}`);

    let missing = 0;
    console.log('\nConteo de registros por tabla:');
    for (const table of EXPECTED_TABLES) {
      if (!existing.includes(table)) {
        console.log(`  - ${table}: NO EXISTE`);
        missing += 1;
        continue;
      }
      const [countRows] = await connection.query(
        `SELECT COUNT(*) AS total FROM \`${table}\``
      );
      console.log(`  - ${table}: ${countRows[0].total} registro(s)`);
    }

    if (missing > 0) {
      console.error(`\nATENCIÓN: faltan ${missing} tabla(s) esperada(s).`);
      process.exitCode = 1;
      return;
    }

    console.log('\nTest de conexión finalizado correctamente.');
  } catch (error) {
    console.error('\nERROR: no se pudo conectar con la base de datos');
    console.error(`  Código : ${error.code || 'sin código'}`);
    console.error(`  Detalle: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
})();
