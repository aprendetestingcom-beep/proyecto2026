'use strict';

const { pool } = require('../config/db');

/**
 * Totales reales que alimentan el panel público del sitio.
 * Se resuelven en una sola consulta con subconsultas independientes.
 */
const QUERY = `
  SELECT
    (SELECT COUNT(*) FROM \`clientes\`) AS clientes,
    (SELECT COUNT(*) FROM \`personal\`) AS personal,
    (SELECT COUNT(*) FROM \`servicios\` WHERE \`publicado\` = 1) AS serviciosPublicados,
    (SELECT COALESCE(SUM(\`estadistica_tareas_realizadas\`), 0) FROM \`servicios\`) AS tareasRealizadas,
    (SELECT COALESCE(SUM(\`facturacion\`), 0) FROM \`servicios\`) AS facturacionTotal
`;

/** GET /api/estadisticas */
async function resumen(req, res) {
  const [rows] = await pool.query(QUERY);
  const row = rows[0];

  res.json({
    data: {
      clientes: Number(row.clientes),
      personal: Number(row.personal),
      serviciosPublicados: Number(row.serviciosPublicados),
      tareasRealizadas: Number(row.tareasRealizadas),
      facturacionTotal: Number(row.facturacionTotal)
    }
  });
}

module.exports = { resumen };
