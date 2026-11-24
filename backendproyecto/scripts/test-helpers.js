'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');

const app = require('../src/app');

/**
 * Código único por ejecución para que los datos de prueba no choquen con los
 * registros existentes ni entre ejecuciones sucesivas.
 * @returns {string}
 */
function uniqueCode() {
  const time = Date.now().toString(36).toUpperCase().slice(-5);
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${time}${random}`;
}

/**
 * Levanta la API en un puerto aleatorio, dentro del mismo proceso de test.
 * No hace falta tener `npm start` corriendo.
 * @returns {Promise<{ baseUrl: string, close: () => Promise<void> }>}
 */
async function startApi() {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        // Evita que las conexiones keep-alive de fetch demoren el cierre.
        server.closeAllConnections?.();
      })
  };
}

/**
 * Petición HTTP con JSON.
 * @param {string} baseUrl
 * @param {string} method
 * @param {string} path
 * @param {unknown} [body]
 * @returns {Promise<{ status: number, body: any, headers: Headers }>}
 */
async function request(baseUrl, method, path, body) {
  const options = { method, headers: {} };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(baseUrl + path, options);
  const text = await response.text();

  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  return { status: response.status, body: payload, headers: response.headers };
}

/**
 * Verifica el código HTTP y devuelve el cuerpo para seguir haciendo asserts.
 * @param {{ status: number, body: any }} response
 * @param {number} expected
 * @param {string} label
 * @returns {any}
 */
function assertStatus(response, expected, label) {
  assert.equal(
    response.status,
    expected,
    `${label}: se esperaba HTTP ${expected} y se recibió HTTP ${response.status} -> ${JSON.stringify(response.body)}`
  );
  return response.body;
}

/**
 * Elimina los registros creados por el test (en orden inverso al de creación).
 * Ignora 404 porque algunos tests ya borraron el registro.
 * @param {string} baseUrl
 * @param {Array<{ resource: string, id: number }>} created
 */
async function cleanup(baseUrl, created) {
  const failures = [];

  for (const entry of [...created].reverse()) {
    if (entry.id === undefined || entry.id === null) continue;
    try {
      const response = await request(baseUrl, 'DELETE', `/api/${entry.resource}/${entry.id}`);
      if (![204, 404].includes(response.status)) {
        failures.push(`${entry.resource}/${entry.id} -> HTTP ${response.status}`);
      }
    } catch (error) {
      failures.push(`${entry.resource}/${entry.id} -> ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.warn(`[cleanup] No se pudieron limpiar: ${failures.join(', ')}`);
  }
}

module.exports = { uniqueCode, startApi, request, assertStatus, cleanup };
