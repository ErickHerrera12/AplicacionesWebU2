const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  recurso: {
    type: String,
    required: [true, 'El nombre o identificador del recurso es requerido'],
    trim: true
  },
  fecha: {
    type: String,
    required: [true, 'La fecha de reserva es requerida (YYYY-MM-DD)']
  },
  horaInicio: {
    type: String,
    required: [true, 'La hora de inicio es requerida']
  },
  horaFin: {
    type: String,
    required: [true, 'La hora de finalización es requerida']
  },
  proposito: {
    type: String,
    required: [true, 'El propósito de la reserva es requerido'],
    trim: true,
    maxlength: 250
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA'],
    default: 'CONFIRMADA'
  },
  comprobanteUrl: {
    type: String,
    default: null
  },
  comprobanteOriginal: {
    type: String,
    default: null
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
