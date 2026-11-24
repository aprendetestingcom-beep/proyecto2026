'use strict';

/**
 * Error controlado que se traduce a una respuesta HTTP concreta.
 */
class HttpError extends Error {
  /**
   * @param {number} status Código HTTP (400, 404, 409, ...)
   * @param {string} message Mensaje para el cliente
   * @param {unknown} [details] Información adicional opcional
   */
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

module.exports = { HttpError };
