document.addEventListener('DOMContentLoaded', async () => {
  const socket = io();
  const feedContenedor = document.getElementById('activityFeed');
  const chatInput = document.getElementById('chatInput');
  const btnEnviarMensaje = document.getElementById('btnEnviarMensaje');
  const tablaReservasBody = document.querySelector('#tablaReservas tbody');
  const formReserva = document.getElementById('formReserva');
  const btnLogout = document.getElementById('btnLogout');
  const userDisplay = document.getElementById('userDisplay');

  let usuarioActual = null;

  // 1. Obtener y verificar sesión
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      window.location.href = '/login';
      return;
    }
    const sessionData = await res.json();
    usuarioActual = sessionData.usuario;
    userDisplay.textContent = `${usuarioActual.nombre} (${usuarioActual.rol})`;
  } catch (err) {
    window.location.href = '/login';
    return;
  }

  // 2. Cargar reservas del servidor
  async function cargarReservas() {
    try {
      const res = await fetch('/api/reservas');
      const responseData = await res.json();
      if (responseData.success) {
        renderizarTabla(responseData.data);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    }
  }

  function renderizarTabla(reservas) {
    tablaReservasBody.innerHTML = '';
    if (reservas.length === 0) {
      tablaReservasBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No existen reservas registradas actualmente.</td></tr>';
      return;
    }

    reservas.forEach((r) => {
      const tr = document.createElement('tr');
      const comprobanteHtml = r.comprobanteUrl 
        ? `<a href="${r.comprobanteUrl}" target="_blank" style="color:var(--color-accent); text-decoration:none;">📄 Ver adjunto</a>`
        : '<span style="color:var(--color-muted); font-size:0.75rem;">Sin archivo</span>';

      const esPropietario = (r.usuario && r.usuario._id === usuarioActual.id) || usuarioActual.rol === 'ADMIN';
      const accionCancelar = (r.estado !== 'CANCELADA' && esPropietario)
        ? `<button class="btn-danger" onclick="cancelarReserva('${r._id}')">Cancelar</button>`
        : '-';

      tr.innerHTML = `
        <td><strong>${r.recurso}</strong></td>
        <td>${r.fecha} <br><small style="color:var(--color-muted);">${r.horaInicio} - ${r.horaFin}</small></td>
        <td>${r.proposito}</td>
        <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
        <td>${comprobanteHtml}</td>
        <td>${accionCancelar}</td>
      `;
      tablaReservasBody.appendChild(tr);
    });
  }

  // 3. Crear nueva reserva
  formReserva.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formReserva);

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error al procesar la reserva.');
        return;
      }

      formReserva.reset();
      cargarReservas();
    } catch (err) {
      alert('Error de conexión al guardar la reserva.');
    }
  });

  // 4. Cancelar Reserva
  window.cancelarReserva = async (id) => {
    if (!confirm('¿Confirma que desea cancelar esta reserva?')) return;
    try {
      const res = await fetch(`/api/reservas/${id}/cancelar`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Error al cancelar la reserva');
        return;
      }
      cargarReservas();
    } catch (err) {
      alert('Error de comunicación.');
    }
  };

  // 5. Manejo de WebSockets (Socket.io)
  socket.on('actividad_notificacion', (payload) => {
    agregarItemFeed(payload.mensaje, payload.timestamp);
    cargarReservas(); // Sincroniza tabla en tiempo real ante cualquier cambio
  });

  socket.on('chat_mensaje', (payload) => {
    agregarItemFeed(`${payload.remitente}: ${payload.texto}`, payload.timestamp);
  });

  function agregarItemFeed(texto, hora) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `<div>${texto}</div><span class="time">${hora || 'Ahora'}</span>`;
    feedContenedor.appendChild(div);
    feedContenedor.scrollTop = feedContenedor.scrollHeight;
  }

  btnEnviarMensaje.addEventListener('click', () => {
    const texto = chatInput.value.trim();
    if (!texto) return;

    socket.emit('chat_mensaje_cliente', {
      remitente: usuarioActual.nombre,
      texto: texto
    });
    chatInput.value = '';
  });

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnEnviarMensaje.click();
  });

  // 6. Cierre de sesión
  btnLogout.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  // Carga inicial
  cargarReservas();
});
