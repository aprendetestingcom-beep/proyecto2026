'use strict';

const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { hashPassword } = require('../src/utils/password');
const { buildInsert } = require('../src/utils/sql');

// Código corto para que emails, usuarios y NIF no choquen si se ejecuta más de una vez.
const batch = Date.now().toString(36).toUpperCase().slice(-5).padEnd(5, '0');
const passwordForAll = 'Proyecto2026';

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Daniel',
  charset: 'utf8mb4',
  connectTimeout: 15000
};

const administradores = [
  ['María Gómez', 'maria.gomez', '+54 9 11 4001-0001', 'mgomez'],
  ['Carlos Fernández', 'carlos.fernandez', '+54 9 11 4001-0002', 'cfernandez'],
  ['Lucía Rodríguez', 'lucia.rodriguez', '+54 9 11 4001-0003', 'lrodriguez'],
  ['Javier Martínez', 'javier.martinez', '+54 9 11 4001-0004', 'jmartinez'],
  ['Sofía López', 'sofia.lopez', '+54 9 11 4001-0005', 'slopez'],
  ['Diego Sánchez', 'diego.sanchez', '+54 9 11 4001-0006', 'dsanchez'],
  ['Valentina Pérez', 'valentina.perez', '+54 9 11 4001-0007', 'vperez'],
  ['Matías Romero', 'matias.romero', '+54 9 11 4001-0008', 'mromero'],
  ['Camila Díaz', 'camila.diaz', '+54 9 11 4001-0009', 'cdiaz'],
  ['Nicolás Torres', 'nicolas.torres', '+54 9 11 4001-0010', 'ntorres']
];

const clientes = [
  ['Hotel Plaza Norte', 'Av. Corrientes 1234, CABA', 'Laura Méndez', '30-71000001-1'],
  ['Hotel del Sol', 'Av. Colón 850, Mar del Plata', 'Roberto Álvarez', '30-71000002-2'],
  ['Hotel Los Andes', 'San Martín 456, Mendoza', 'Paula Ríos', '30-71000003-3'],
  ['Hotel Costa Azul', 'Bv. Marítimo 120, Pinamar', 'Facundo Vera', '30-71000004-4'],
  ['Hotel Central', 'Sarmiento 780, Rosario', 'Mariela Castro', '30-71000005-5'],
  ['Hotel Jardín', 'Belgrano 230, Salta', 'Hernán Molina', '30-71000006-6'],
  ['Hotel Patagonia', 'Av. Argentina 1500, Neuquén', 'Silvina Herrera', '30-71000007-7'],
  ['Hotel Miramar', 'Alvear 89, Córdoba', 'Andrés Benítez', '30-71000008-8'],
  ['Hotel Aurora', 'Rivadavia 340, Tucumán', 'Natalia Sosa', '30-71000009-9'],
  ['Hotel Paraíso', 'Mitre 1120, Bahía Blanca', 'Gonzalo Medina', '30-71000010-0']
];

const personal = [
  ['Ana Silva', '2025-03-10', 1],
  ['Bruno Acosta', '2024-11-05', 0],
  ['Carla Ibáñez', '2025-06-18', 1],
  ['Daniel Ruiz', '2023-09-22', 0],
  ['Elena Farías', '2025-01-30', 1],
  ['Franco Giménez', '2024-07-14', 0],
  ['Gabriela Núñez', '2025-08-03', 1],
  ['Hugo Peralta', '2023-12-11', 0],
  ['Inés Cabrera', '2025-02-27', 1],
  ['Julián Ríos', '2024-05-19', 0]
];

const servicios = [
  [
    'Limpieza profunda de habitaciones del piso 1',
    'Detergente, desinfectante, paños de microfibra',
    12,
    185000.0
  ],
  [
    'Limpieza de lobby y recepción',
    'Lustramuebles, limpiavidrios, aspiradora',
    8,
    92000.5
  ],
  [
    'Desinfección de baños del piso 2',
    'Lavandina, guantes, cepillos',
    15,
    134500.0
  ],
  [
    'Limpieza de alfombras y sillones',
    'Shampoo para alfombras, aspiradora',
    6,
    78000.0
  ],
  [
    'Limpieza de cocina y comedor',
    'Desengrasante, esponjas, paños',
    9,
    110000.0
  ],
  [
    'Cambio de blancos y tendidos',
    'Sábanas, toallas, fundas',
    40,
    210000.0
  ],
  [
    'Limpieza de pasillos y escaleras',
    'Trapeador, balde, detergente',
    10,
    65000.0
  ],
  [
    'Mantenimiento de cristales',
    'Limpiavidrios, secadores, paños',
    14,
    120000.0
  ],
  [
    'Sanitización de áreas comunes',
    'Alcohol, aspersores, barbijos',
    20,
    175500.75
  ],
  [
    'Limpieza de salón de eventos',
    'Cera, aspiradora, paños',
    7,
    98000.0
  ]
];

(async () => {
  console.log(
    `Conectando a ${config.host}:${config.port}/${config.database} como "${config.user}"...`
  );

  let connection;

  try {
    connection = await mysql.createConnection(config);

    console.log(`Insertando 10 registros por tabla (lote ${batch})...\n`);
    await connection.beginTransaction();

    const adminIds = [];
    for (const [nombre, mail, movil, usuario] of administradores) {
      const payload = {
        'Apellido y Nombre': nombre,
        Email: `${mail}.${batch.toLowerCase()}@cursotesting.com`,
        'N°Móvil': movil,
        Usuario: `${usuario}_${batch.toLowerCase()}`,
        Clave: hashPassword(passwordForAll)
      };
      const { sql, params } = buildInsert('administrador', payload);
      const [result] = await connection.execute(sql, params);
      adminIds.push(result.insertId);
    }

    const clienteIds = [];
    for (let i = 0; i < clientes.length; i += 1) {
      const [nombre, domicilio, responsable, nif] = clientes[i];
      const { sql, params } = buildInsert('clientes', {
        Nombre: nombre,
        Domicilio: domicilio,
        Responsable: responsable,
        NIF: `${nif}-${batch}`
      });
      const [result] = await connection.execute(sql, params);
      clienteIds.push(result.insertId);
    }

    const personalIds = [];
    for (let i = 0; i < personal.length; i += 1) {
      const [nombre, fechaIngreso, tareaCumplida] = personal[i];
      const { sql, params } = buildInsert('personal', {
        Apellido_y_Nombre: nombre,
        Fecha_de_Ingreso: fechaIngreso,
        Tarea_Cumplida: tareaCumplida,
        idHotel: clienteIds[i]
      });
      const [result] = await connection.execute(sql, params);
      personalIds.push(result.insertId);
    }

    const servicioIds = [];
    for (const [descripcion, productos, estadistica, facturacion] of servicios) {
      const { sql, params } = buildInsert('servicios', {
        descripcion,
        productos_utilizar: productos,
        estadistica_tareas_realizadas: estadistica,
        facturacion
      });
      const [result] = await connection.execute(sql, params);
      servicioIds.push(result.insertId);
    }

    await connection.commit();

    console.log(`administrador: ${adminIds.length} insertados -> IDs ${adminIds.join(', ')}`);
    console.log(`clientes: ${clienteIds.length} insertados -> IDs ${clienteIds.join(', ')}`);
    console.log(`personal: ${personalIds.length} insertados -> IDs ${personalIds.join(', ')}`);
    console.log(`servicios: ${servicioIds.length} insertados -> IDs ${servicioIds.join(', ')}`);

    console.log('\nConteo final por tabla:');
    for (const table of ['administrador', 'clientes', 'personal', 'servicios']) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      console.log(`  - ${table}: ${rows[0].total} registro(s)`);
    }

    console.log(`\nContraseña de todos los administradores de prueba: ${passwordForAll}`);
    console.log('Datos de prueba insertados correctamente.');
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('No se pudo revertir la transacción:', rollbackError.message);
      }
    }
    console.error('\nERROR: no se pudieron insertar los datos');
    console.error(`  Código : ${error.code || 'sin código'}`);
    console.error(`  Detalle: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
})();
