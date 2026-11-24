'use strict';

/**
 * Migración 2026-11-23
 * ---------------------
 * 1. `clientes`: agrega `Email` y `Clave` (hash scrypt) para el acceso de clientes
 *    al portal. Son opcionales a nivel de base para no romper altas administrativas
 *    creadas desde el CRUD; el alta pública (/api/auth/register) siempre las exige.
 * 2. `servicios`: agrega `nombre`, `publicado` e `icono` para poder publicar un
 *    catálogo de servicios en el sitio (deja de estar hardcodeado en React).
 *
 * El script es idempotente: se puede volver a ejecutar sin efectos secundarios.
 *
 * Uso: npm run db:migrate
 */

const { pool } = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');

// Contraseña temporal para los clientes históricos (se documenta en el README).
const TEMP_PASSWORD = 'Proyecto2026';

const CATALOGO = [
  {
    nombre: 'Limpieza de oficinas',
    icono: 'building',
    descripcion:
      'Rutinas diarias y mantenimiento profundo para espacios de trabajo, con horarios adaptados a la actividad de cada institución.',
    productos_utilizar:
      'Detergente neutro, desinfectante, paños de microfibra, aspiradora',
    caracteristicas: `Incluye la limpieza diaria de puestos de trabajo, salas de reuniones, recepción, cocinas y sanitarios, con reposición de consumibles.
• Turnos de mañana, tarde o noche según la actividad de la oficina.
• Equipos estables con supervisión semanal y planilla de control por sector.
• Tratamiento diferenciado de superficies de alto contacto: picaportes, teclados y barandas.
• Coordinación con el responsable de instalaciones para no interrumpir reuniones ni atención al público.`
  },
  {
    nombre: 'Desinfección profunda',
    icono: 'sparkles',
    descripcion:
      'Tratamiento de superficies de alto contacto y áreas críticas con protocolos validados y productos habilitados.',
    productos_utilizar: 'Amonio cuaternario, alcohol 70%, guantes, pulverizadores',
    caracteristicas: `Operativo puntual o periódico para reducir la carga microbiana en ambientes críticos.
• Aplicación por aspersión o paño húmedo según el tipo de superficie.
• Productos habilitados y fichas de seguridad disponibles para el cliente.
• Protocolo validado para oficinas, aulas, consultorios y áreas comunes.
• Informe final con superficies tratadas, productos usados y tiempo de reingreso.`
  },
  {
    nombre: 'Limpieza hospitalaria',
    icono: 'health',
    descripcion:
      'Operativos especializados para clínicas, sanatorios y centros de salud, con personal capacitado en bioseguridad.',
    productos_utilizar: 'Desinfectante hospitalario, descartables, bolsas rojas',
    caracteristicas: `Dirigido a clínicas, sanatorios, laboratorios y centros de diagnóstico.
• Personal capacitado en bioseguridad y manejo de residuos patogénicos.
• Clasificación por áreas crítica, semicrítica y no crítica, con insumos exclusivos por zona.
• Rutinas de desinfección terminal y refuerzos ante aislamientos.
• Supervisión con listas de verificación y trazabilidad por habitación o consultorio.`
  },
  {
    nombre: 'Mantenimiento de pisos',
    icono: 'layers',
    descripcion:
      'Pulido, hidrolavado y protección de superficies en halls, pasillos y espacios de gran circulación.',
    productos_utilizar: 'Hidrolavadora, cera acrílica, pad de pulido',
    caracteristicas: `Tratamiento integral de superficies de alto tránsito según el material.
• Hidrolavado, decapado, pulido y cristalizado de mármol, granito, mosaico y hormigón.
• Aplicación de ceras y protectores de bajo olor, con tiempos de secado coordinados.
• Recuperación de juntas y zócalos; opción de trabajos nocturnos o por etapas.
• Presupuesto por metro cuadrado con relevamiento previo del estado del piso.`
  },
  {
    nombre: 'Gestión de residuos',
    icono: 'trash',
    descripcion:
      'Recolección, clasificación y retiro de residuos según normativa vigente, con trazabilidad por sector.',
    productos_utilizar: 'Bolsas diferenciadas, contenedores, guantes',
    caracteristicas: `Organización del circuito de residuos de la institución, desde la generación hasta el retiro.
• Separación en origen con contenedores y cartelería por tipo de residuo.
• Planillas de trazabilidad por sector y frecuencia de retiro.
• Coordinación con operadores habilitados para residuos comunes y patogénicos.
• Capacitación breve al personal del cliente sobre el circuito interno.`
  },
  {
    nombre: 'Insumos y consumibles',
    icono: 'package',
    descripcion:
      'Provisión de papel, jabón, alcohol en gel y descartables para que la operación nunca se interrumpa.',
    productos_utilizar: 'Papel higiénico, jabón líquido, alcohol en gel, toallas',
    caracteristicas: `Provisión programada de los insumos que sostienen la operación diaria.
• Papel higiénico, toallas, jabón líquido, alcohol en gel y descartables.
• Reposición por calendario o por umbral mínimo de stock, sin costo de envío en CABA.
• Productos con registro y opciones de bajo impacto ambiental.
• Facturación mensual consolidada por institución.`
  }
];

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(connection, table, index) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, index]
  );
  return rows.length > 0;
}

async function migrateClientes(connection) {
  if (!(await columnExists(connection, 'clientes', 'Email'))) {
    await connection.query(
      "ALTER TABLE `clientes` ADD COLUMN `Email` varchar(150) DEFAULT NULL COMMENT 'Correo de acceso al portal del cliente; unico cuando existe' AFTER `Responsable`"
    );
    console.log('[migrate] clientes.Email agregada');
  }

  if (!(await columnExists(connection, 'clientes', 'Clave'))) {
    await connection.query(
      "ALTER TABLE `clientes` ADD COLUMN `Clave` varchar(255) DEFAULT NULL COMMENT 'Hash scrypt de la contrasena del portal; nunca se guarda en texto plano' AFTER `Email`"
    );
    console.log('[migrate] clientes.Clave agregada');
  }

  if (!(await indexExists(connection, 'clientes', 'UQ_clientes_Email'))) {
    await connection.query('ALTER TABLE `clientes` ADD UNIQUE KEY `UQ_clientes_Email` (`Email`)');
    console.log('[migrate] clientes.UQ_clientes_Email creado');
  }

  // Credenciales para los clientes históricos (contraseña temporal documentada).
  const [sinCredenciales] = await connection.query(
    'SELECT `idHotel` FROM `clientes` WHERE `Email` IS NULL OR `Clave` IS NULL'
  );

  if (sinCredenciales.length > 0) {
    const hash = hashPassword(TEMP_PASSWORD);
    for (const row of sinCredenciales) {
      await connection.execute(
        'UPDATE `clientes` SET `Email` = ?, `Clave` = ? WHERE `idHotel` = ?',
        [`cliente${row.idHotel}@limpiezainstitucional.com.ar`, hash, row.idHotel]
      );
    }
    console.log(`[migrate] credenciales temporales asignadas a ${sinCredenciales.length} clientes`);
  }
}

async function migrateServicios(connection) {
  if (!(await columnExists(connection, 'servicios', 'nombre'))) {
    await connection.query(
      "ALTER TABLE `servicios` ADD COLUMN `nombre` varchar(120) DEFAULT NULL COMMENT 'Nombre corto del servicio (catalogo visible en el sitio)' AFTER `id_tarea`"
    );
    console.log('[migrate] servicios.nombre agregada');
  }

  if (!(await columnExists(connection, 'servicios', 'publicado'))) {
    await connection.query(
      "ALTER TABLE `servicios` ADD COLUMN `publicado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = se muestra en el sitio publico; 0 = registro operativo interno' AFTER `nombre`"
    );
    console.log('[migrate] servicios.publicado agregada');
  }

  if (!(await columnExists(connection, 'servicios', 'icono'))) {
    await connection.query(
      "ALTER TABLE `servicios` ADD COLUMN `icono` varchar(40) DEFAULT NULL COMMENT 'Clave del icono a mostrar en el sitio (building, sparkles, health, layers, trash, package)' AFTER `publicado`"
    );
    console.log('[migrate] servicios.icono agregada');
  }

  if (!(await columnExists(connection, 'servicios', 'caracteristicas'))) {
    await connection.query(
      "ALTER TABLE `servicios` ADD COLUMN `caracteristicas` text DEFAULT NULL COMMENT 'Descripcion ampliada que se muestra en el modal del sitio; editable desde el panel de administracion' AFTER `descripcion`"
    );
    console.log('[migrate] servicios.caracteristicas agregada');
  }

  // Las filas históricas son tareas operativas: se les completa el nombre y se
  // dejan fuera del sitio público.
  const [backfill] = await connection.query(
    'UPDATE `servicios` SET `nombre` = LEFT(`descripcion`, 120) WHERE `nombre` IS NULL'
  );
  if (backfill.affectedRows > 0) {
    console.log(`[migrate] nombre completado en ${backfill.affectedRows} servicios históricos`);
  }

  // Texto ampliado del catálogo (solo si todavía no fue cargado a mano).
  let conCaracteristicas = 0;
  for (const servicio of CATALOGO) {
    const [result] = await connection.execute(
      "UPDATE `servicios` SET `caracteristicas` = ? WHERE `nombre` = ? AND (`caracteristicas` IS NULL OR `caracteristicas` = '')",
      [servicio.caracteristicas, servicio.nombre]
    );
    conCaracteristicas += result.affectedRows;
  }
  if (conCaracteristicas > 0) {
    console.log(`[migrate] descripción ampliada cargada en ${conCaracteristicas} servicios`);
  }

  // Solo se carga el catálogo en una base sin servicios publicados: si el
  // administrador renombró o despublicó filas, la migración no debe duplicarlas.
  const [[{ publicados }]] = await connection.query(
    'SELECT COUNT(*) AS publicados FROM `servicios` WHERE `publicado` = 1'
  );

  if (Number(publicados) > 0) {
    console.log('[migrate] el catálogo ya está publicado: no se insertan servicios nuevos');
    return;
  }

  let insertados = 0;
  for (const servicio of CATALOGO) {
    const [existing] = await connection.execute(
      'SELECT `id_tarea` FROM `servicios` WHERE `nombre` = ? LIMIT 1',
      [servicio.nombre]
    );
    if (existing.length > 0) continue;

    await connection.execute(
      `INSERT INTO \`servicios\`
        (\`nombre\`, \`publicado\`, \`icono\`, \`descripcion\`, \`productos_utilizar\`, \`caracteristicas\`, \`estadistica_tareas_realizadas\`, \`facturacion\`)
       VALUES (?, 1, ?, ?, ?, ?, 0, 0)`,
      [
        servicio.nombre,
        servicio.icono,
        servicio.descripcion,
        servicio.productos_utilizar,
        servicio.caracteristicas
      ]
    );
    insertados += 1;
  }

  if (insertados > 0) {
    console.log(`[migrate] ${insertados} servicios de catálogo publicados`);
  }
}

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await migrateClientes(connection);
    await migrateServicios(connection);
    await connection.commit();
    console.log('[migrate] migración aplicada correctamente');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[migrate] error:', error.message);
  process.exit(1);
});
