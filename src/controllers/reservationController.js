const Reservation = require('../models/Reservation');
const { construirMensajeActividad } = require('../utils/formatters');

exports.obtenerTodas = async (req, res) => {
  try {
    const reservas = await Reservation.find()
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      total: reservas.length,
      data: reservas
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'Error de servidor',
      message: error.message
    });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const reserva = await Reservation.findById(req.params.id).populate('usuario', 'nombre email');
    if (!reserva) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'No encontrado',
        message: 'La reserva especificada no existe.'
      });
    }
    return res.status(200).json({ success: true, statusCode: 200, data: reserva });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { recurso, fecha, horaInicio, horaFin, proposito } = req.body;

    const solapamiento = await Reservation.findOne({
      recurso,
      fecha,
      estado: { $ne: 'CANCELADA' },
      $or: [
        { horaInicio: { $lt: horaFin }, horaFin: { $gt: horaInicio } }
      ]
    });

    if (solapamiento) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'Conflicto de reserva',
        message: `El recurso "${recurso}" ya cuenta con una reserva activa en ese intervalo de horario.`
      });
    }

    let comprobanteUrl = null;
    let comprobanteOriginal = null;
    if (req.file) {
      comprobanteUrl = `/uploads/${req.file.filename}`;
      comprobanteOriginal = req.file.originalname;
    }

    const nuevaReserva = new Reservation({
      recurso,
      fecha,
      horaInicio,
      horaFin,
      proposito,
      comprobanteUrl,
      comprobanteOriginal,
      usuario: req.session.userId
    });

    const guardada = await nuevaReserva.save();
    await guardada.populate('usuario', 'nombre email rol');

    // Emisión por Socket.io en lenguaje natural
    const io = req.app.get('io');
    if (io) {
      const mensajeHumano = construirMensajeActividad(req.session.userName, 'CREAR', recurso);
      io.emit('actividad_notificacion', {
        tipo: 'RESERVA_CREADA',
        mensaje: mensajeHumano,
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      });
    }

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Reserva registrada exitosamente.',
      data: guardada
    });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { recurso, fecha, horaInicio, horaFin, proposito, estado } = req.body;

    const reserva = await Reservation.findById(id);
    if (!reserva) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'No encontrado',
        message: 'Reserva no localizada.'
      });
    }

    if (reserva.usuario.toString() !== req.session.userId && req.session.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'Prohibido',
        message: 'No posee privilegios suficientes para modificar esta reserva.'
      });
    }

    reserva.recurso = recurso || reserva.recurso;
    reserva.fecha = fecha || reserva.fecha;
    reserva.horaInicio = horaInicio || reserva.horaInicio;
    reserva.horaFin = horaFin || reserva.horaFin;
    reserva.proposito = proposito || reserva.proposito;
    if (estado) reserva.estado = estado;

    const actualizada = await reserva.save();
    await actualizada.populate('usuario', 'nombre email rol');

    const io = req.app.get('io');
    if (io) {
      const mensajeHumano = construirMensajeActividad(req.session.userName, 'ACTUALIZAR', reserva.recurso);
      io.emit('actividad_notificacion', {
        tipo: 'RESERVA_ACTUALIZADA',
        mensaje: mensajeHumano,
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Reserva actualizada correctamente.',
      data: actualizada
    });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

exports.cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reservation.findById(id);

    if (!reserva) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'No encontrado',
        message: 'Reserva no encontrada.'
      });
    }

    if (reserva.usuario.toString() !== req.session.userId && req.session.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'Acceso denegado',
        message: 'No tiene permisos para cancelar este registro.'
      });
    }

    reserva.estado = 'CANCELADA';
    await reserva.save();

    const io = req.app.get('io');
    if (io) {
      const mensajeHumano = construirMensajeActividad(req.session.userName, 'CANCELAR', reserva.recurso);
      io.emit('actividad_notificacion', {
        tipo: 'RESERVA_CANCELADA',
        mensaje: mensajeHumano,
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'La reserva ha sido cancelada satisfactoriamente.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};

exports.subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Archivo faltante',
        message: 'Debe adjuntar un archivo válido (PDF o Imagen).'
      });
    }

    const reserva = await Reservation.findById(id);
    if (!reserva) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'No encontrado',
        message: 'Reserva no encontrada.'
      });
    }

    reserva.comprobanteUrl = `/uploads/${req.file.filename}`;
    reserva.comprobanteOriginal = req.file.originalname;
    await reserva.save();

    const io = req.app.get('io');
    if (io) {
      const mensajeHumano = construirMensajeActividad(req.session.userName, 'COMPROBANTE', reserva.recurso);
      io.emit('actividad_notificacion', {
        tipo: 'COMPROBANTE_SUBIDO',
        mensaje: mensajeHumano,
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comprobante indexado exitosamente.',
      data: {
        comprobanteUrl: reserva.comprobanteUrl,
        comprobanteOriginal: reserva.comprobanteOriginal
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, error: error.message });
  }
};
