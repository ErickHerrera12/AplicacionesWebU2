# Sistema de Gestion de Reservas y Recursos

Sistema web para la administracion y asignacion de recursos institucionales (laboratorios, salas, auditorios y equipos audiovisuales) desarrollado para la asignatura de Aplicaciones Web de la Universidad Politecnica Salesiana.

El proyecto implementa una arquitectura modular en Node.js y Express, persistencia en MongoDB con mecanismo de contingencia automatica (fallback), gestion segura de sesiones mediante cookies HttpOnly, carga de comprobantes digitales y sincronizacion de eventos en tiempo real con WebSockets.

---

## 1. Requisitos Previos

- Node.js version 18.0.0 o superior.
- npm version 9.0.0 o superior.
- Instancia activa de MongoDB (Local en `localhost:27017` o cuenta en MongoDB Atlas).

---

## 2. Instalacion y Configuracion

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/ErickHerrera12/AplicacionesWebU2.git
   cd sistema-reservas
   ```

2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Configurar las variables de entorno:
   Copie el archivo base y edite los valores segun corresponda:
   ```bash
   cp .env.example .env
   ```

   Parametros requeridos en `.env`:
   - `PORT`: Puerto en el que se levantara el servicio HTTP (por defecto `3000`).
   - `SESSION_SECRET`: Clave criptografica utilizada para la firma de la cookie de sesion.
   - `MONGODB_URI`: Cadena de conexion remota de MongoDB Atlas (opcional).
   - `MONGODB_LOCAL_URI`: Cadena de conexion a la base de datos local (fallback por defecto: `mongodb://localhost:27017/sistema_reservas`).

---

## 3. Ejecucion del Servidor

- Modo produccion:
  ```bash
  npm start
  ```

- Modo desarrollo (requiere nodemon):
  ```bash
  npm run dev
  ```

El sistema estara accesible en `http://localhost:3000`.

---

## 4. Credenciales de Prueba (Seed Automatico)

Al iniciar la aplicacion por primera vez, el servidor genera de forma automatica un usuario administrador base si no existe en la base de datos:

- **Correo:** `admin@ups.edu.ec`
- **Contrasena:** `Password123!`
- **Rol:** `ADMIN`

Tambien es posible registrar nuevos usuarios docentes o estudiantes desde la pestana "Crear Cuenta" en la interfaz de login.

---

## 5. Arquitectura del Proyecto

```text
├── public/                 # Archivos estaticos para el cliente
│   ├── css/styles.css      # Hoja de estilos de la interfaz
│   └── js/                 # Scripts cliente (app.js, login.js)
├── src/
│   ├── config/database.js  # Conexion a MongoDB y logica de fallback
│   ├── controllers/        # Controladores de negocio (Auth, Reservas)
│   ├── middlewares/        # Middlewares (Autenticacion, Multer, Validaciones)
│   ├── models/             # Esquemas de Mongoose (User, Reservation)
│   ├── routes/             # Definicion de endpoints y rutas de vistas
│   └── utils/formatters.js # Funciones puras para formateo y mensajes naturales
├── uploads/                # Directorio de almacenamiento de comprobantes subidos
├── views/                  # Vistas HTML (login.html, dashboard.html)
├── informe.html            # Documento de entrega academica en formato APA
├── server.js               # Punto de entrada de la aplicacion y configuracion Socket.io
└── package.json            # Dependencias y scripts de ejecucion
```

---

## 6. Endpoints del API

### Autenticacion (`/api/auth`)
- `POST /register`: Registro de nuevas cuentas de usuario.
- `POST /login`: Validacion de credenciales e inicializacion de sesion.
- `POST /logout`: Destruccion de sesion y limpieza de cookie.
- `GET /me`: Obtencion de los datos del usuario en sesion activa.

### Reservas (`/api/reservas`)
- `GET /`: Lista de todas las reservas registradas.
- `GET /:id`: Detalle de una reserva especifica.
- `POST /`: Registro de nueva reserva con soporte de archivo adjunto (`multipart/form-data`). Valida solapamiento de horarios.
- `PUT /:id`: Actualizacion de datos de una reserva (restringido a dueno o ADMIN).
- `PATCH /:id/cancelar`: Cancelacion del estado de la reserva.
- `POST /:id/comprobante`: Carga o actualizacion de archivo comprobante.

---

## 7. Caracteristicas Tecnicas Implementadas

- **Conexion Resiliente a Base de Datos:** Prioriza la conexion remota hacia MongoDB Atlas con un tiempo limite de espera de 5 segundos. Ante cualquier fallo de conectividad remota o ausencia de variables de entorno, conmuta automaticamente hacia la base local sin interrumpir la ejecucion.
- **Seguridad en Sesiones:** Almacenamiento centralizado de sesiones en MongoDB via `connect-mongo`, con cookies marcadas como `HttpOnly` y `SameSite=lax`. Las rutas privadas estan resguardadas por el middleware `requireAuth`.
- **Comunicacion Bidireccional:** Notificaciones mediante Socket.io generadas en lenguaje natural estructurado ante cada evento de reserva, actualizando concurrentemente el feed de actividad y la tabla de datos en todas las sesiones conectadas.
- **Control de Archivos:** Carga restringida por extension (.pdf, .png, .jpg) y limite de tamano (5 MB) a traves de `multer`.
