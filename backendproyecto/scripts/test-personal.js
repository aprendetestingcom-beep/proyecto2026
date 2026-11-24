'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../src/config/db');
const { uniqueCode, startApi, request, assertStatus, cleanup } = require('./test-helpers');

const code = uniqueCode();

let api;
let baseUrl;
let hotelId;
let personalId;
let secondaryId;
const created = [];

before(async () => {
  api = await startApi();
  baseUrl = api.baseUrl;

  // Hotel de apoyo: personal.idHotel es una relación lógica, se necesita un id válido.
  const hotel = await request(baseUrl, 'POST', '/api/clientes', {
    Nombre: `Test Hotel para Personal ${code}`,
    Domicilio: 'Calle Soporte 100',
    Responsable: 'Responsable Soporte',
    NIF: `PER-${code}`
  });
  assert.equal(
    hotel.status,
    201,
    `No se pudo crear el hotel de apoyo: ${JSON.stringify(hotel.body)}`
  );
  hotelId = hotel.body.data.idHotel;
  created.push({ resource: 'clientes', id: hotelId });
});

after(async () => {
  if (baseUrl) await cleanup(baseUrl, created);
  if (api) await api.close();
  await pool.end();
});

function personalPayload(overrides = {}) {
  return {
    Apellido_y_Nombre: `Test Empleado ${code}`,
    Fecha_de_Ingreso: '2025-05-15',
    Tarea_Cumplida: true,
    idHotel: hotelId,
    ...overrides
  };
}

async function createPersonal(overrides = {}) {
  const response = await request(baseUrl, 'POST', '/api/personal', personalPayload(overrides));
  if (response.status === 201) {
    created.push({ resource: 'personal', id: response.body.data.idPersonal });
  }
  return response;
}

test('PER-01 POST /api/personal crea un registro', async () => {
  const response = await createPersonal();
  const data = assertStatus(response, 201, 'POST /api/personal').data;

  personalId = data.idPersonal;
  assert.ok(Number.isInteger(personalId));
  assert.equal(data.Apellido_y_Nombre, `Test Empleado ${code}`);
  assert.equal(data.Fecha_de_Ingreso, '2025-05-15');
  assert.equal(data.Tarea_Cumplida, 1);
  assert.equal(data.idHotel, hotelId);
});

test('PER-02 POST /api/personal aplica Tarea_Cumplida = 0 por defecto', async () => {
  const response = await createPersonal({
    Apellido_y_Nombre: `Test Empleado Secundario ${code}`,
    Tarea_Cumplida: undefined
  });
  const data = assertStatus(response, 201, 'POST /api/personal sin Tarea_Cumplida').data;

  secondaryId = data.idPersonal;
  assert.equal(data.Tarea_Cumplida, 0);
});

test('PER-03 GET /api/personal lista y busca', async () => {
  const body = assertStatus(
    await request(baseUrl, 'GET', `/api/personal?search=${code}&limit=50&offset=0`),
    200,
    'GET /api/personal'
  );

  assert.ok(body.meta.total >= 2);
  assert.ok(body.data.some((row) => row.idPersonal === personalId));
  assert.ok(body.data.some((row) => row.idPersonal === secondaryId));
});

test('PER-04 GET /api/personal filtra por idHotel', async () => {
  const body = assertStatus(
    await request(baseUrl, 'GET', `/api/personal?idHotel=${hotelId}&limit=50`),
    200,
    'GET /api/personal?idHotel'
  );

  assert.ok(body.data.length >= 2);
  assert.ok(body.data.every((row) => row.idHotel === hotelId));
  assert.ok(body.data.some((row) => row.idPersonal === personalId));
});

test('PER-05 GET /api/personal/:id obtiene un registro', async () => {
  const body = assertStatus(
    await request(baseUrl, 'GET', `/api/personal/${personalId}`),
    200,
    'GET /api/personal/:id'
  );

  assert.equal(body.data.idPersonal, personalId);
  assert.equal(body.data.idHotel, hotelId);
});

test('PER-06 PUT /api/personal/:id reemplaza todos los campos', async () => {
  const body = assertStatus(
    await request(baseUrl, 'PUT', `/api/personal/${personalId}`, {
      Apellido_y_Nombre: `Test Empleado ${code} Editado`,
      Fecha_de_Ingreso: '2025-06-01',
      Tarea_Cumplida: false,
      idHotel: hotelId
    }),
    200,
    'PUT /api/personal/:id'
  );

  assert.equal(body.data.Apellido_y_Nombre, `Test Empleado ${code} Editado`);
  assert.equal(body.data.Fecha_de_Ingreso, '2025-06-01');
  assert.equal(body.data.Tarea_Cumplida, 0);
});

test('PER-07 PATCH /api/personal/:id actualiza parcialmente', async () => {
  const body = assertStatus(
    await request(baseUrl, 'PATCH', `/api/personal/${personalId}`, { Tarea_Cumplida: true }),
    200,
    'PATCH /api/personal/:id'
  );

  assert.equal(body.data.Tarea_Cumplida, 1);
  assert.equal(body.data.Fecha_de_Ingreso, '2025-06-01', 'no debe modificar otros campos');
});

test('PER-08 POST /api/personal valida fecha, hotel y booleano', async () => {
  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/personal',
      personalPayload({
        Apellido_y_Nombre: `Test Fecha Inválida ${code}`,
        Fecha_de_Ingreso: '2025-02-30'
      })
    ),
    400,
    'Fecha inválida'
  );

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/personal',
      personalPayload({ Apellido_y_Nombre: `Test Sin Hotel ${code}`, idHotel: undefined })
    ),
    400,
    'Falta idHotel'
  );

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/personal',
      personalPayload({ Apellido_y_Nombre: `Test Booleano Inválido ${code}`, Tarea_Cumplida: 'tal vez' })
    ),
    400,
    'Booleano inválido'
  );
});

test('PER-09 GET /api/personal/:id valida identificadores inválidos', async () => {
  assertStatus(await request(baseUrl, 'GET', '/api/personal/0'), 400, 'ID cero');
  assertStatus(await request(baseUrl, 'GET', '/api/personal/abc'), 400, 'ID no numérico');
});

test('PER-10 DELETE /api/personal/:id elimina y luego responde 404', async () => {
  assertStatus(
    await request(baseUrl, 'DELETE', `/api/personal/${personalId}`),
    204,
    'DELETE /api/personal/:id'
  );

  assertStatus(
    await request(baseUrl, 'GET', `/api/personal/${personalId}`),
    404,
    'GET después de eliminar'
  );

  assertStatus(
    await request(baseUrl, 'DELETE', `/api/personal/${personalId}`),
    404,
    'DELETE repetido'
  );
});
