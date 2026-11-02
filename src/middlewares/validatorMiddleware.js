const validarReserva = (req, res, next) => {
  const { recurso, fecha, horaInicio, horaFin, proposito } = req.body;
  const errores = [];

  if (!recurso || recurso.trim().length === 0) {
    errores.push('El nombre o código del recurso es obligatorio.');
  }
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    errores.push('La fecha de reserva debe tener formato válido YYYY-MM-DD.');
  }
  if (!horaInicio || !/^\d{2}:\d{2}$/.test(horaInicio)) {
    errores.push('La hora de inicio es inválida (formato esperado HH:MM).');
  }
  if (!horaFin || !/^\d{2}:\d{2}$/.test(horaFin)) {
    errores.push('La hora de fin es inválida (formato esperado HH:MM).');
  }
  if (horaInicio && horaFin && horaInicio >= horaFin) {
    errores.push('La hora de finalización debe ser estrictamente posterior a la hora de inicio.');
  }
  if (!proposito || proposito.trim().length < 5) {
    errores.push('El propósito debe contener al menos 5 caracteres descriptivos.');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Validación de datos fallida',
      message: errores.join(' ')
    });
  }

  next();
};

module.exports = { validarReserva };
