'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../src/config/db');
const { uniqueCode, startApi, request, assertStatus, cleanup } = require('./test-helpers');

const code = uniqueCode();
const nif = `TEST-${code}`;

let api;
let baseUrl;
let clientId;
const created = [];

before(async () => {
  api = await startApi();
  baseUrl = api.baseUrl;
});

after(async () => {
  if (baseUrl) await cleanup(baseUrl, created);
  if (api) await api.close();
  await pool.end();
});

function clientPayload(overrides = {}) {
  return {
    Nombre: `Test Hotel ${code}`,
    Domicilio: 'Av. de Prueba 123',
    Responsable: 'Responsable de Prueba',
    NIF: nif,
    ...overrides
  };
}

async function createClient(overrides = {}) {
  const response = await request(baseUrl, 'POST', '/api/clientes', clientPayload(overrides));
  if (response.status === 201) {
    created.push({ resource: 'clientes', id: response.body.data.idHotel });
  }
  return response;
}

test('CLI-01 POST /api/clientes crea un registro', async () => {
  const response = await createClient();
  const data = assertStatus(response, 201, 'POST /api/clientes').data;

  clientId = data.idHotel;
  assert.ok(Number.isInteger(clientId));
  assert.equal(data.Nombre, `Test Hotel ${code}`);
  assert.equal(data.Domicilio, 'Av. de Prueba 123');
  assert.equal(data.Responsable, 'Responsable de Prueba');
  assert.equal(data.NIF, nif);
});

test('CLI-02 GET /api/clientes lista, busca y pagina', async () => {
  const body = assertStatus(
    await request(baseUrl, 'GET', `/api/clientes?search=${code}&limit=1&offset=0`),
    200,
    'GET /api/clientes'
  );

  assert.equal(body.meta.limit, 1);
  assert.equal(body.meta.offset, 0);
  assert.ok(body.meta.total >= 1);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].idHotel, clientId);
});

test('CLI-03 GET /api/clientes/:id obtiene un registro', async () => {
  const body = assertStatus(
    await request(baseUrl, 'GET', `/api/clientes/${clientId}`),
    200,
    'GET /api/clientes/:id'
  );

  assert.equal(body.data.idHotel, clientId);
  assert.equal(body.data.NIF, nif);
});

test('CLI-04 PUT /api/clientes/:id reemplaza todos los campos', async () => {
  const body = assertStatus(
    await request(baseUrl, 'PUT', `/api/clientes/${clientId}`, clientPayload({
      Domicilio: 'Calle Actualizada 456',
      Responsable: 'Responsable Actualizado'
    })),
    200,
    'PUT /api/clientes/:id'
  );

  assert.equal(body.data.Domicilio, 'Calle Actualizada 456');
  assert.equal(body.data.Responsable, 'Responsable Actualizado');
  assert.equal(body.data.Nombre, `Test Hotel ${code}`);
});

test('CLI-05 PATCH /api/clientes/:id actualiza parcialmente', async () => {
  const body = assertStatus(
    await request(baseUrl, 'PATCH', `/api/clientes/${clientId}`, {
      Responsable: 'Responsable Parcial'
    }),
    200,
    'PATCH /api/clientes/:id'
  );

  assert.equal(body.data.Responsable, 'Responsable Parcial');
  assert.equal(body.data.Domicilio, 'Calle Actualizada 456', 'no debe modificar otros campos');
  assert.equal(body.data.NIF, nif);
});

test('CLI-06 POST /api/clientes rechaza NIF duplicado', async () => {
  const response = await request(
    baseUrl,
    'POST',
    '/api/clientes',
    clientPayload({ Nombre: `Test Hotel Duplicado ${code}` })
  );
  const body = assertStatus(response, 409, 'NIF duplicado');
  assert.equal(body.error.code, 'ER_DUP_ENTRY');
});

test('CLI-07 POST /api/clientes valida campos obligatorios', async () => {
  const body = assertStatus(
    await request(baseUrl, 'POST', '/api/clientes', { Nombre: 'Solo nombre' }),
    400,
    'Campos obligatorios'
  );
  assert.deepEqual(body.error.details.missing, ['Domicilio', 'Responsable', 'NIF']);
});

test('CLI-08 POST /api/clientes valida longitud del NIF', async () => {
  const body = assertStatus(
    await request(baseUrl, 'POST', '/api/clientes', clientPayload({
      NIF: 'X'.repeat(21)
    })),
    400,
    'NIF demasiado largo'
  );
  assert.match(body.error.message, /no puede superar los 20 caracteres/);
});

test('CLI-09 GET /api/clientes/:id valida identificadores inválidos', async () => {
  assertStatus(await request(baseUrl, 'GET', '/api/clientes/0'), 400, 'ID cero');
  assertStatus(await request(baseUrl, 'GET', '/api/clientes/abc'), 400, 'ID no numérico');
});

test('CLI-10 DELETE /api/clientes/:id elimina y luego responde 404', async () => {
  assertStatus(
    await request(baseUrl, 'DELETE', `/api/clientes/${clientId}`),
    204,
    'DELETE /api/clientes/:id'
  );

  assertStatus(
    await request(baseUrl, 'GET', `/api/clientes/${clientId}`),
    404,
    'GET después de eliminar'
  );

  assertStatus(
    await request(baseUrl, 'DELETE', `/api/clientes/${clientId}`),
    404,
    'DELETE repetido'
  );
});
