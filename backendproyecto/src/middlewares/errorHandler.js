'use strict';

const { HttpError } = require('../utils/errors');

/**
 * Respuesta para rutas inexistentes.
 */
function notFound(req, res) {
  res.status(404).json({
    error: {
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    }
  });
}

const MYSQL_STATUS = {
  ER_DUP_ENTRY: 409,
  ER_NO_REFERENCED_ROW_2: 400,
  ER_ROW_IS_REFERENCED_2: 409,
  ER_BAD_NULL_ERROR: 400,
  ER_NO_DEFAULT_FOR_FIELD: 400,
  ER_DATA_TOO_LONG: 400,
  ER_TRUNCATED_WRONG_VALUE: 400,
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 400,
  ER_WARN_DATA_OUT_OF_RANGE: 400,
  ER_WRONG_VALUE_COUNT_ON_ROW: 400
};

/**
 * Middleware central de errores.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: {
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {})
      }
    });
  }

  // JSON mal formado enviado en el body
  if (error.type === 'entity.parse.failed' || (error instanceof SyntaxError && 'body' in error)) {
    return res.status(400).json({
      error: { message: 'El cuerpo de la solicitud no contiene un JSON válido' }
    });
  }

  if (error.code && MYSQL_STATUS[error.code]) {
    let message = 'La operación no se pudo completar por una restricción de la base de datos';

    if (error.code === 'ER_DUP_ENTRY') {
      const match = /for key '([^']+)'/.exec(error.message || '');
      message = 'Ya existe un registro con un valor que debe ser único';
      if (match) message += ` (${match[1]})`;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      message = 'Uno de los valores enviados supera la longitud permitida';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      message = 'Falta un campo obligatorio en la base de datos';
    } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      message = 'No se puede eliminar el registro porque está siendo utilizado por otros datos';
    }

    return res.status(MYSQL_STATUS[error.code]).json({
      error: { message, code: error.code }
    });
  }

  console.error('[error]', error);
  return res.status(500).json({
    error: { message: 'Error interno del servidor' }
  });
}

module.exports = { notFound, errorHandler };
