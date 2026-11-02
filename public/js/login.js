document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const alertContainer = document.getElementById('alertContainer');

  // Control de errores enviados por redirección (query params)
  const urlParams = new URLSearchParams(window.location.search);
  const errorUrl = urlParams.get('error');
  if (errorUrl) {
    mostrarAlerta(errorUrl, 'danger');
  }

  // Alternancia entre pestañas
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    alertContainer.innerHTML = '';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    alertContainer.innerHTML = '';
  });

  // Procesamiento del formulario de Inicio de Sesión
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarAlerta(data.message || 'Error en las credenciales proporcionadas.', 'danger');
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      mostrarAlerta('Error de red al intentar comunicarse con el servidor.', 'danger');
    }
  });

  // Procesamiento del formulario de Registro de Usuario
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const rol = document.getElementById('regRol').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password, rol })
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarAlerta(data.message || 'No se pudo completar el registro.', 'danger');
        return;
      }

      // Registro exitoso: limpiar formulario, avisar al usuario y pasar al login
      registerForm.reset();
      tabLogin.click();
      document.getElementById('loginEmail').value = email;
      mostrarAlerta('¡Usuario registrado con éxito! Ingrese su contraseña para continuar.', 'success');
    } catch (err) {
      mostrarAlerta('Error de red al registrar el usuario.', 'danger');
    }
  });

  function mostrarAlerta(msg, tipo) {
    alertContainer.innerHTML = `<div class="alert alert-${tipo}">${msg}</div>`;
  }
});
