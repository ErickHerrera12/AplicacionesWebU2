const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Petición incorrecta',
        message: 'Todos los campos obligatorios deben ser diligenciados.'
      });
    }

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Conflicto',
        message: 'El correo electrónico suministrado ya se encuentra registrado.'
      });
    }

    const nuevoUsuario = new User({ nombre, email, password, rol });
    await nuevoUsuario.save();

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Usuario registrado exitosamente.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'Error interno',
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Petición incorrecta',
        message: 'Correo y contraseña obligatorios.'
      });
    }

    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Credenciales inválidas',
        message: 'Las credenciales proporcionadas son incorrectas.'
      });
    }

    const coinciden = await usuario.compararPassword(password);
    if (!coinciden) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Credenciales inválidas',
        message: 'Las credenciales proporcionadas son incorrectas.'
      });
    }

    req.session.userId = usuario._id;
    req.session.userName = usuario.nombre;
    req.session.userRole = usuario.rol;

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Inicio de sesión exitoso.',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'Error interno de autenticación',
      message: error.message
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        error: 'Error al cerrar sesión',
        message: 'No fue posible destruir la sesión activa.'
      });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Sesión finalizada exitosamente.'
    });
  });
};

exports.obtenerSesionActual = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, statusCode: 401, error: 'No autorizado' });
  }
  return res.status(200).json({
    success: true,
    statusCode: 200,
    usuario: {
      id: req.session.userId,
      nombre: req.session.userName,
      rol: req.session.userRole
    }
  });
};
