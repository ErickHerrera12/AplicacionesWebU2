const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { requireAuth } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { validarReserva } = require('../middlewares/validatorMiddleware');

router.use(requireAuth);

router.get('/', reservationController.obtenerTodas);
router.get('/:id', reservationController.obtenerPorId);
router.post('/', upload.single('comprobante'), validarReserva, reservationController.crear);
router.put('/:id', validarReserva, reservationController.actualizar);
router.patch('/:id/cancelar', reservationController.cancelar);
router.post('/:id/comprobante', upload.single('comprobante'), reservationController.subirComprobante);

module.exports = router;
