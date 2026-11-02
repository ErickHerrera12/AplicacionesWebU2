require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { Server } = require('socket.io');

const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const reservationRoutes = require('./src/routes/reservationRoutes');
const viewRoutes = require('./src/routes/viewRoutes');
const User = require('./src/models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Inyección de Socket.io en la aplicación
app.set('io', io);

// 1. Conexión a Base de Datos
connectDB().then(async () => {
  // Inicialización de usuario por defecto para pruebas
  try {
    const adminExiste = await User.findOne({ email: 'admin@ups.edu.ec' });
    if (!adminExiste) {
      await User.create({
        nombre: 'Administrador UPS',
        email: 'admin@ups.edu.ec',
        password: 'Password123!',
        rol: 'ADMIN'
      });
      console.log('[SEED] Usuario de prueba generado: admin@ups.edu.ec / Password123!');
    }
  } catch (seedErr) {
    console.error('[SEED ERROR]', seedErr.message);
  }
});

// 2. Middlewares Globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Manejo de Sesiones
const localDbUri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/sistema_reservas';
app.use(session({
  secret: process.env.SESSION_SECRET || 'ups_session_fallback_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || localDbUri,
    ttl: 24 * 60 * 60 // 1 día de persistencia
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// 4. Mapeo de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservationRoutes);
app.use('/', viewRoutes);

// Manejador 404 para API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'Recurso no encontrado',
    message: `La ruta ${req.originalUrl} no existe en el servidor.`
  });
});

// 5. Configuración de Socket.io
io.on('connection', (socket) => {
  socket.on('chat_mensaje_cliente', (payload) => {
    io.emit('chat_mensaje', {
      remitente: payload.remitente || 'Anónimo',
      texto: payload.texto,
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    });
  });
});

// 6. Lanzamiento del Servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[SERVER] Servidor corriendo en ejecución en http://localhost:${PORT}`);
});
