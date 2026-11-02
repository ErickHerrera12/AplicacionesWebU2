const mongoose = require('mongoose');

const connectDB = async () => {
  const remoteUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/sistema_reservas';

  if (remoteUri) {
    try {
      console.log('[DB] Intentando conectar a MongoDB Atlas...');
      await mongoose.connect(remoteUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('[DB] Conexión establecida exitosamente con MongoDB Atlas.');
      return;
    } catch (atlasError) {
      console.warn('[DB] Fallo en conexión remota Atlas:', atlasError.message);
      console.log('[DB] Ejecutando fallback de conexión local...');
    }
  } else {
    console.log('[DB] No se detectó variable MONGODB_URI. Conectando directo a instancia local...');
  }

  try {
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[DB] Conectado exitosamente a MongoDB Local (${localUri}).`);
  } catch (localError) {
    console.error('[DB ERROR] Error crítico: No se pudo conectar ni a Atlas ni a Local:', localError.message);
    process.exit(1);
  }
};

module.exports = connectDB;
