'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../src/config/db');
const { uniqueCode, startApi, request, assertStatus, cleanup } = require('./test-helpers');

const code = uniqueCode();

let api;
let baseUrl;
let serviceId;
let minimalId;
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

function servicePayload(overrides = {}) {
  return {
    descripcion: `Test Servicio ${code}`,
    productos_utilizar: 'Detergente, desinfectante, paños',
    estadistica_tareas_realizadas: 5,
    facturacion: 2500.75,
    ...overrides
  };
}

async function createService(overrides = {}) {
  const response = await request(baseUrl, 'POST', '/api/servicios', servicePayload(overrides));
  if (response.status === 201) {
    created.push({ resource: 'servicios', id: response.body.data.id_tarea });
  }
  return response;
}

test('SER-01 POST /api/servicios crea un registro completo', async () => {
  const response = await createService();
  const data = assertStatus(response, 201, 'POST /api/servicios').data;

  serviceId = data.id_tarea;
  assert.ok(Number.isInteger(serviceId));
  assert.equal(data.descripcion, `Test Servicio ${code}`);
  assert.equal(data.productos_utilizar, 'Detergente, desinfectante, paños');
  assert.equal(data.estadistica_tareas_realizadas, 5);
  assert.equal(data.facturacion, 2500.75);
  assert.ok(data.created_at, 'debe devolver created_at');
});

test('SER-02 POST /api/servicios aplica valores por defecto', async () => {
  const response = await createService({
    descripcion: `Test Servicio Mínimo ${code}`,
    productos_utilizar: undefined,
    estadistica_tareas_realizadas: undefined,
    facturacion: undefined
  });
  const data = assertStatus(response, 201, 'POST /api/servicios mínimo').data;

  minimalId = data.id_tarea;
  assert.equal(data.productos_utilizar, null);
  assert.equal(data.estadistica_tareas_realizadas, 0);
  assert.equal(data.facturacion, 0);
});

test('SER-03 GET /api/servicios lista, busca y pagina', async () => {
  const first = assertStatus(
    await request(baseUrl, 'GET', `/api/servicios?search=${code}&limit=1&offset=0`),
    200,
    'GET /api/servicios (página 1)'
  );

  assert.ok(first.meta.total >= 2);
  assert.equal(first.data.length, 1);

  const second = assertStatus(
    await request(baseUrl, 'GET', `/api/servicios?search=${code}&limit=1&offset=1`),
    200,
    'GET /api/servicios (página 2)'
  );

  assert.equal(second.data.length, 1);
  assert.notEqual(first.data[0].id_tarea, second.data[0].id_tarea);
  const ids = [first.data[0].id_tarea, second.data[0].id_tarea];
  assert.ok(ids.includes(serviceId) && ids.includes(minimalId));
});

test('SER-04 GET /api/servicios/:id obtiene un registro', async () => {
  const body = assertStatus(
    await request(baseUrl, 'GET', `/api/servicios/${serviceId}`),
    200,
    'GET /api/servicios/:id'
  );

  assert.equal(body.data.id_tarea, serviceId);
  assert.equal(body.data.descripcion, `Test Servicio ${code}`);
});

test('SER-05 PUT /api/servicios/:id reemplaza todos los campos', async () => {
  const body = assertStatus(
    await request(baseUrl, 'PUT', `/api/servicios/${serviceId}`, {
      descripcion: `Test Servicio ${code} Editado`,
      productos_utilizar: 'Lavandina y guantes',
      estadistica_tareas_realizadas: 8,
      facturacion: 3000
    }),
    200,
    'PUT /api/servicios/:id'
  );

  assert.equal(body.data.descripcion, `Test Servicio ${code} Editado`);
  assert.equal(body.data.productos_utilizar, 'Lavandina y guantes');
  assert.equal(body.data.estadistica_tareas_realizadas, 8);
  assert.equal(body.data.facturacion, 3000);
});

test('SER-06 PATCH /api/servicios/:id actualiza y redondea la facturación', async () => {
  const body = assertStatus(
    await request(baseUrl, 'PATCH', `/api/servicios/${serviceId}`, { facturacion: 123.456 }),
    200,
    'PATCH /api/servicios/:id'
  );

  assert.equal(body.data.facturacion, 123.46);
  assert.equal(body.data.descripcion, `Test Servicio ${code} Editado`);
});

test('SER-07 POST /api/servicios valida campos numéricos y obligatorios', async () => {
  assertStatus(
    await request(baseUrl, 'POST', '/api/servicios', {}),
    400,
    'Falta descripción'
  );

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/servicios',
      servicePayload({ descripcion: `Test Negativo ${code}`, facturacion: -1 })
    ),
    400,
    'Facturación negativa'
  );

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/servicios',
      servicePayload({
        descripcion: `Test Estadística Negativa ${code}`,
        estadistica_tareas_realizadas: -3
      })
    ),
    400,
    'Estadística negativa'
  );

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/servicios',
      servicePayload({
        descripcion: `Test Estadística Decimal ${code}`,
        estadistica_tareas_realizadas: 2.5
      })
    ),
    400,
    'Estadística no entera'
  );
});

test('SER-08 GET /api/servicios/:id valida identificadores inválidos', async () => {
  assertStatus(await request(baseUrl, 'GET', '/api/servicios/0'), 400, 'ID cero');
  assertStatus(await request(baseUrl, 'GET', '/api/servicios/abc'), 400, 'ID no numérico');
});

test('SER-09 DELETE /api/servicios/:id elimina y luego responde 404', async () => {
  assertStatus(
    await request(baseUrl, 'DELETE', `/api/servicios/${serviceId}`),
    204,
    'DELETE /api/servicios/:id'
  );

  assertStatus(
    await request(baseUrl, 'GET', `/api/servicios/${serviceId}`),
    404,
    'GET después de eliminar'
  );

  assertStatus(
    await request(baseUrl, 'DELETE', `/api/servicios/${serviceId}`),
    404,
    'DELETE repetido'
  );
});
