/**
 * Funciones puras para formateo y transformación de datos.
 */
const formatearFechaHumana = (fechaStr) => {
  if (!fechaStr) return '';
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const anio = partes[0];
  const mes = meses[parseInt(partes[1], 10) - 1];
  const dia = parseInt(partes[2], 10);
  return `${dia} de ${mes} de ${anio}`;
};

const sanitizarCadena = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
};

const construirMensajeActividad = (usuarioNombre, accion, recurso) => {
  const nombre = sanitizarCadena(usuarioNombre);
  const recursoLimpio = sanitizarCadena(recurso);
  switch (accion) {
    case 'CREAR':
      return `${nombre} acaba de registrar una reserva para ${recursoLimpio}.`;
    case 'ACTUALIZAR':
      return `${nombre} ha modificado los parámetros de su reserva en ${recursoLimpio}.`;
    case 'CANCELAR':
      return `${nombre} canceló la reserva prevista para ${recursoLimpio}.`;
    case 'COMPROBANTE':
      return `${nombre} subió un nuevo comprobante digital para ${recursoLimpio}.`;
    default:
      return `${nombre} actualizó recursos en el sistema.`;
  }
};

module.exports = {
  formatearFechaHumana,
  sanitizarCadena,
  construirMensajeActividad
};
