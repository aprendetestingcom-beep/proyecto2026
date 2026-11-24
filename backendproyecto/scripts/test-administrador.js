'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { pool } = require('../src/config/db');
const { verifyPassword } = require('../src/utils/password');
const { uniqueCode, startApi, request, assertStatus, cleanup } = require('./test-helpers');

const code = uniqueCode();
const password = 'ClaveTest2026';

let api;
let baseUrl;
let adminId;
let currentEmail;
let currentUsuario;
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

function adminPayload(overrides = {}) {
  return {
    'Apellido y Nombre': `Test Administrador ${code}`,
    Email: `admin.${code.toLowerCase()}@test.local`,
    'N°Móvil': '+54 9 11 5555-0001',
    Usuario: `test_admin_${code.toLowerCase()}`,
    Clave: password,
    ...overrides
  };
}

async function createAdmin(overrides = {}) {
  const response = await request(baseUrl, 'POST', '/api/administrador', adminPayload(overrides));
  if (response.status === 201) {
    created.push({ resource: 'administrador', id: response.body.data.idAdministrador });
  }
  return response;
}

test('ADM-01 POST /api/administrador crea un registro y hashea la clave', async () => {
  const response = await createAdmin();
  const body = assertStatus(response, 201, 'POST /api/administrador');
  const data = body.data;

  adminId = data.idAdministrador;
  currentEmail = data.Email;
  currentUsuario = data.Usuario;

  assert.ok(Number.isInteger(adminId), 'el id debe ser un entero');
  assert.equal(data['Apellido y Nombre'], `Test Administrador ${code}`);
  assert.equal(data.Email, `admin.${code.toLowerCase()}@test.local`);
  assert.equal(data.Usuario, `test_admin_${code.toLowerCase()}`);
  assert.equal(data['N°Móvil'], '+54 9 11 5555-0001');
  assert.ok(!('Clave' in data), 'la respuesta no debe exponer la clave');

  const [rows] = await pool.execute(
    'SELECT `Clave` FROM `administrador` WHERE `idAdministrador` = ?',
    [adminId]
  );
  assert.equal(rows.length, 1, 'el registro debe existir en la base');
  assert.match(rows[0].Clave, /^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
  assert.equal(verifyPassword(password, rows[0].Clave), true, 'la clave debe poder verificarse');
});

test('ADM-02 GET /api/administrador lista, busca y pagina', async () => {
  const data = assertStatus(
    await request(baseUrl, 'GET', `/api/administrador?search=${code}&limit=5&offset=0`),
    200,
    'GET /api/administrador'
  );

  assert.equal(data.meta.limit, 5);
  assert.equal(data.meta.offset, 0);
  assert.ok(data.meta.total >= 1, 'debe encontrar al menos un registro');
  assert.ok(data.data.some((row) => row.idAdministrador === adminId));
  assert.ok(data.data.every((row) => !('Clave' in row)), 'el listado no debe exponer Clave');
});

test('ADM-03 GET /api/administrador/:id obtiene un registro', async () => {
  const data = assertStatus(
    await request(baseUrl, 'GET', `/api/administrador/${adminId}`),
    200,
    'GET /api/administrador/:id'
  );

  assert.equal(data.data.idAdministrador, adminId);
  assert.equal(data.data.Usuario, currentUsuario);
  assert.ok(!('Clave' in data.data));
});

test('ADM-04 PUT /api/administrador/:id reemplaza y re-hashea la clave', async () => {
  const newPassword = 'NuevaClave2026';

  const data = assertStatus(
    await request(baseUrl, 'PUT', `/api/administrador/${adminId}`, {
      'Apellido y Nombre': `Test Administrador ${code} Editado`,
      Email: `admin.${code.toLowerCase()}.edit@test.local`,
      'N°Móvil': '+54 9 11 5555-9999',
      Usuario: `test_admin_${code.toLowerCase()}_edit`,
      Clave: newPassword
    }),
    200,
    'PUT /api/administrador/:id'
  );

  currentEmail = data.data.Email;
  currentUsuario = data.data.Usuario;

  assert.equal(data.data['Apellido y Nombre'], `Test Administrador ${code} Editado`);
  assert.equal(data.data.Email, `admin.${code.toLowerCase()}.edit@test.local`);
  assert.equal(data.data.Usuario, `test_admin_${code.toLowerCase()}_edit`);
  assert.ok(!('Clave' in data.data));

  const [rows] = await pool.execute(
    'SELECT `Clave` FROM `administrador` WHERE `idAdministrador` = ?',
    [adminId]
  );
  assert.equal(verifyPassword(newPassword, rows[0].Clave), true);
  assert.equal(verifyPassword(password, rows[0].Clave), false);
});

test('ADM-05 PATCH /api/administrador/:id actualiza parcialmente', async () => {
  const data = assertStatus(
    await request(baseUrl, 'PATCH', `/api/administrador/${adminId}`, {
      'N°Móvil': '+54 9 11 5555-1234'
    }),
    200,
    'PATCH /api/administrador/:id'
  );

  assert.equal(data.data['N°Móvil'], '+54 9 11 5555-1234');
  assert.equal(data.data.Email, currentEmail, 'los campos no enviados no deben cambiar');

  const cleared = assertStatus(
    await request(baseUrl, 'PATCH', `/api/administrador/${adminId}`, { 'N°Móvil': null }),
    200,
    'PATCH /api/administrador/:id (null)'
  );
  assert.equal(cleared.data['N°Móvil'], null);
});

test('ADM-06 POST /api/administrador rechaza email y usuario duplicados', async () => {
  const duplicateEmail = await request(
    baseUrl,
    'POST',
    '/api/administrador',
    adminPayload({ Email: currentEmail, Usuario: `otro_usuario_${code.toLowerCase()}` })
  );
  const emailBody = assertStatus(duplicateEmail, 409, 'Email duplicado');
  assert.equal(emailBody.error.code, 'ER_DUP_ENTRY');

  const duplicateUser = await request(
    baseUrl,
    'POST',
    '/api/administrador',
    adminPayload({
      Email: `otro.${code.toLowerCase()}@test.local`,
      Usuario: currentUsuario
    })
  );
  const userBody = assertStatus(duplicateUser, 409, 'Usuario duplicado');
  assert.equal(userBody.error.code, 'ER_DUP_ENTRY');
});

test('ADM-07 POST /api/administrador valida campos obligatorios y formatos', async () => {
  const missing = assertStatus(
    await request(baseUrl, 'POST', '/api/administrador', {}),
    400,
    'Campos obligatorios'
  );
  assert.deepEqual(missing.error.details.missing, [
    'Apellido y Nombre',
    'Email',
    'Usuario',
    'Clave'
  ]);

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/administrador',
      adminPayload({ Email: 'correo-invalido', Usuario: `invalido_${code}` })
    ),
    400,
    'Email inválido'
  );

  assertStatus(
    await request(
      baseUrl,
      'POST',
      '/api/administrador',
      adminPayload({ Email: `corta.${code}@test.local`, Usuario: `corta_${code}`, Clave: '123' })
    ),
    400,
    'Clave demasiado corta'
  );
});

test('ADM-08 GET /api/administrador/:id valida identificadores inválidos', async () => {
  assertStatus(
    await request(baseUrl, 'GET', '/api/administrador/0'),
    400,
    'ID cero'
  );
  assertStatus(
    await request(baseUrl, 'GET', '/api/administrador/abc'),
    400,
    'ID no numérico'
  );
});

test('ADM-09 POST /api/administrador admite N°Móvil opcional', async () => {
  const response = await createAdmin({
    Email: `opcional.${code.toLowerCase()}@test.local`,
    Usuario: `test_admin_opcional_${code.toLowerCase()}`,
    'N°Móvil': undefined
  });
  const data = assertStatus(response, 201, 'Alta sin N°Móvil');

  assert.equal(data.data['N°Móvil'], null);
  assert.ok(!('Clave' in data.data));
});

test('ADM-10 DELETE /api/administrador/:id elimina y luego responde 404', async () => {
  assertStatus(
    await request(baseUrl, 'DELETE', `/api/administrador/${adminId}`),
    204,
    'DELETE /api/administrador/:id'
  );

  assertStatus(
    await request(baseUrl, 'GET', `/api/administrador/${adminId}`),
    404,
    'GET después de eliminar'
  );

  assertStatus(
    await request(baseUrl, 'DELETE', `/api/administrador/${adminId}`),
    404,
    'DELETE repetido'
  );
});
