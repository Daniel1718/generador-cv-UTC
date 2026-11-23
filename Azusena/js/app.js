// =========================================
// ESTADO GLOBAL (SIN BASE DE DATOS EXTERNA - LOCALSTORAGE)
// =========================================
const STORAGE_KEY = 'cv_platform_user_data';
const AUTH_KEY = 'cv_platform_auth';
const USERS_DB_KEY = 'cv_platform_registered_users';

const DEFAULT_USER = {
  nombre: 'Carlos Daniel Contreras',
  email: 'carlos@ejemplo.com',
  password: '123456'
};

let appData = {
  nombre: '',
  puestoTitulo: 'DESARROLLO DE SOFTWARE',
  telefono: '',
  correo: '',
  direccion: '',
  curp: '',
  fechaNacimiento: '',
  avatarBase64: '',
  academica: {
    secu: { escuela: '', especialidad: '', anios: '' },
    prepa: { escuela: '', especialidad: '', anios: '' },
    tsu: { escuela: '', especialidad: '', anios: '' },
    ing: { escuela: '', especialidad: '', anios: '' }
  },
  extracurricular: {
    cursos: '',
    congresos: '',
    conferencias: '',
    certificaciones: '',
    idiomas: 'Español, Inglés (En curso)',
    voluntariado: '',
    otro: ''
  },
  tieneExperiencia: 'si',
  experiencias: [],
  tienePracticas: 'si',
  practicas: {
    nombre: '',
    descripcion: '',
    areaEspecializacion: ''
  },
  habilidades: [],
  intereses: [],
  herramientasTexto: 'Lenguajes: JavaScript, Python, C#, SQL\nDesarrollo Web: HTML5, CSS3\nHerramientas: Git / GitHub, VS Code',
  aboutMe: ''
};

// =========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  inicializarUsuarios();
  cargarDatosLocales();
  actualizarRelojBienvenida();
  setInterval(actualizarRelojBienvenida, 30000);

  const session = JSON.parse(localStorage.getItem(AUTH_KEY));
  if (session && session.loggedIn) {
    activarSesionUI(session.nombre || session.email);
    showScreen('bienvenida');
  } else {
    showScreen('login');
  }
});

function inicializarUsuarios() {
  let users = JSON.parse(localStorage.getItem(USERS_DB_KEY));
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = [DEFAULT_USER];
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  }
}

// =========================================
// NOTIFICACIÓN DE GUARDADO (TOAST)
// =========================================
function mostrarAviso(mensaje = '¡Datos guardados correctamente!') {
  const toast = document.getElementById('toast-aviso');
  toast.textContent = mensaje;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// =========================================
// NAVEGACIÓN ENTRE PANTALLAS CON ANIMACIÓN
// =========================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(sec => {
    sec.classList.remove('active');
  });

  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    void target.offsetWidth;
    target.classList.add('active');
  }

  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.target === screenId) {
      btn.classList.add('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screenId === 'intereses') {
    actualizarVistaPreviaCV();
  }
}

// =========================================
// AUTENTICACIÓN LOCAL (LOGIN Y REGISTRO REAL)
// =========================================
function handleAuth(mode) {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value.trim();
  const nombreReg = document.getElementById('login-nombre').value.trim();

  if (!email || !password) {
    mostrarAviso('⚠️ Ingresa tu correo y contraseña');
    return;
  }

  let users = JSON.parse(localStorage.getItem(USERS_DB_KEY)) || [DEFAULT_USER];

  if (mode === 'register') {
    if (!nombreReg) {
      mostrarAviso('⚠️ Escribe tu nombre para crear la cuenta');
      return;
    }

    const existe = users.find(u => u.email === email);
    if (existe) {
      mostrarAviso('⚠️ Este correo ya está registrado. Dale en Entrar.');
      return;
    }

    const nuevoUsuario = {
      nombre: nombreReg,
      email: email,
      password: password
    };

    users.push(nuevoUsuario);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    appData.nombre = nombreReg;
    appData.correo = email;
    guardarEnLocalStorage(false);

    iniciarSesionExitosa(nuevoUsuario, `🎉 Cuenta creada. ¡Bienvenido, ${nombreReg}!`);
  } else {
    const usuarioEncontrado = users.find(u => u.email === email && u.password === password);

    if (!usuarioEncontrado) {
      mostrarAviso('❌ Correo o contraseña incorrectos');
      return;
    }

    if (!appData.correo) appData.correo = usuarioEncontrado.email;
    if (!appData.nombre) appData.nombre = usuarioEncontrado.nombre;

    iniciarSesionExitosa(usuarioEncontrado, `👋 ¡Bienvenido de nuevo, ${usuarioEncontrado.nombre}!`);
  }
}

function iniciarSesionExitosa(usuario, mensaje) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    loggedIn: true,
    email: usuario.email,
    nombre: usuario.nombre
  }));

  rellenarFormularios();
  activarSesionUI(usuario.nombre);
  mostrarAviso(mensaje);
  showScreen('bienvenida');
}

function activarSesionUI(nombre) {
  document.getElementById('steps-nav').classList.remove('hidden');
  document.getElementById('btn-logout').classList.remove('hidden');
  document.getElementById('welcome-user-name').textContent = nombre || 'Usuario';
}

function cerrarSesion() {
  localStorage.removeItem(AUTH_KEY);
  document.getElementById('steps-nav').classList.add('hidden');
  document.getElementById('btn-logout').classList.add('hidden');
  document.getElementById('login-password').value = '';
  showScreen('login');
  mostrarAviso('Sesión cerrada');
}

function actualizarRelojBienvenida() {
  const el = document.getElementById('welcome-time');
  if (!el) return;
  const ahora = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  el.textContent = ahora.toLocaleDateString('es-MX', opciones);
}

// =========================================
// SUBIDA DE FOTO DE PERFIL E IMÁGENES SIMULADAS
// =========================================
function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    appData.avatarBase64 = e.target.result;
    const preview = document.getElementById('avatar-preview');
    const placeholder = document.getElementById('avatar-placeholder');
    preview.src = appData.avatarBase64;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
    guardarEnLocalStorage(true, '📸 Foto de perfil guardada');
  };
  reader.readAsDataURL(file);
}

// Solo muestra visualmente que la imagen se subió sin guardarla en localStorage
function mostrarArchivoSubido(input, statusId) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById(statusId);
  if (statusEl) {
    statusEl.textContent = `✅ Imagen cargada: ${file.name}`;
  }
  mostrarAviso(`🖼️ Imagen "${file.name}" cargada`);
}

// =========================================
// EXPERIENCIA LABORAL DINÁMICA (+ AGREGAR)
// =========================================
function toggleExperiencia(tiene) {
  appData.tieneExperiencia = tiene;
  const container = document.getElementById('experiencia-dinamica-box');
  if (tiene === 'si') {
    container.classList.remove('hidden');
    if (appData.experiencias.length === 0) {
      agregarExperienciaItem();
    }
  } else {
    container.classList.add('hidden');
  }
}

function agregarExperienciaItem(data = { empresa: '', fechas: '', puesto: '', comentarios: '' }) {
  const list = document.getElementById('lista-experiencias');
  const index = list.children.length + 1;
  const uniqueStatusId = `exp-img-status-${Date.now()}-${index}`;

  const div = document.createElement('div');
  div.className = 'sub-card exp-card-item';
  div.innerHTML = `
    <div class="sub-card-header">
      <h3>Experiencia / Proyecto #${index}</h3>
      <button type="button" class="btn-danger-sm" onclick="eliminarExperienciaItem(this)">Eliminar</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Empresa o Proyecto</label>
        <input type="text" class="exp-empresa" value="${data.empresa}" placeholder="Ej. Luminary / Empresa SA" />
      </div>
      <div class="form-group">
        <label>Año / Periodo</label>
        <input type="text" class="exp-fechas" value="${data.fechas}" placeholder="Ej. 2025 - 2026" />
      </div>
      <div class="form-group full">
        <label>Rol / Puesto o Tecnologías usadas</label>
        <input type="text" class="exp-puesto" value="${data.puesto}" placeholder="Ej. Desarrollador Frontend (HTML, CSS, JS)" />
      </div>
      <div class="form-group full">
        <label>Descripción / Actividades</label>
        <textarea rows="2" class="exp-comentarios" placeholder="Describe lo que realizaste...">${data.comentarios}</textarea>
      </div>
    </div>
    <div class="file-row" style="margin-bottom: 0;">
      <div>
        <label style="margin:0;">Evidencia / Carta (Imagen)</label>
        <div id="${uniqueStatusId}" class="file-status">Ningún archivo seleccionado</div>
      </div>
      <label class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.78rem;">
        Subir Imagen
        <input type="file" accept="image/*" class="hidden" onchange="mostrarArchivoSubido(this, '${uniqueStatusId}')" />
      </label>
    </div>
  `;
  list.appendChild(div);
}

function eliminarExperienciaItem(btn) {
  btn.closest('.exp-card-item').remove();
  document.querySelectorAll('.exp-card-item h3').forEach((h3, i) => {
    h3.textContent = `Experiencia / Proyecto #${i + 1}`;
  });
}

// =========================================
// PRÁCTICAS O ESPECIALIZACIÓN
// =========================================
function togglePracticas(tiene) {
  appData.tienePracticas = tiene;
  const boxSi = document.getElementById('practicas-si-box');
  const boxNo = document.getElementById('practicas-no-box');

  if (tiene === 'si') {
    boxSi.classList.remove('hidden');
    boxNo.classList.add('hidden');
  } else {
    boxSi.classList.add('hidden');
    boxNo.classList.remove('hidden');
  }
}

// =========================================
// GUARDAR DATOS DESDE LOS FORMULARIOS
// =========================================
function guardarPaso(siguientePantalla = null) {
  appData.nombre = document.getElementById('input-nombre').value.trim();
  appData.puestoTitulo = document.getElementById('input-puesto-titulo').value.trim() || 'DESARROLLO DE SOFTWARE';
  appData.telefono = document.getElementById('input-telefono').value.trim();
  appData.correo = document.getElementById('input-correo').value.trim();
  appData.direccion = document.getElementById('input-direccion').value.trim();
  appData.curp = document.getElementById('input-curp').value.trim();
  appData.fechaNacimiento = document.getElementById('input-nacimiento').value;

  appData.academica.secu = {
    escuela: document.getElementById('secu-escuela').value.trim(),
    especialidad: document.getElementById('secu-especialidad').value.trim(),
    anios: document.getElementById('secu-anio').value.trim()
  };
  appData.academica.prepa = {
    escuela: document.getElementById('prepa-escuela').value.trim(),
    especialidad: document.getElementById('prepa-especialidad').value.trim(),
    anios: document.getElementById('prepa-anio').value.trim()
  };
  appData.academica.tsu = {
    escuela: document.getElementById('tsu-escuela').value.trim(),
    especialidad: document.getElementById('tsu-especialidad').value.trim(),
    anios: document.getElementById('tsu-anio').value.trim()
  };
  appData.academica.ing = {
    escuela: document.getElementById('ing-escuela').value.trim(),
    especialidad: document.getElementById('ing-especialidad').value.trim(),
    anios: document.getElementById('ing-anio').value.trim()
  };

  appData.extracurricular = {
    cursos: document.getElementById('extra-cursos').value.trim(),
    congresos: document.getElementById('extra-congresos').value.trim(),
    conferencias: document.getElementById('extra-conferencias').value.trim(),
    certificaciones: document.getElementById('extra-certificaciones').value.trim(),
    idiomas: document.getElementById('extra-idiomas').value.trim(),
    voluntariado: document.getElementById('extra-voluntariado').value.trim(),
    otro: document.getElementById('extra-otro').value.trim()
  };

  const expItems = [];
  document.querySelectorAll('.exp-card-item').forEach(card => {
    expItems.push({
      empresa: card.querySelector('.exp-empresa').value.trim(),
      fechas: card.querySelector('.exp-fechas').value.trim(),
      puesto: card.querySelector('.exp-puesto').value.trim(),
      comentarios: card.querySelector('.exp-comentarios').value.trim()
    });
  });
  appData.experiencias = expItems;

  appData.practicas = {
    nombre: document.getElementById('input-practica-nombre').value.trim(),
    descripcion: document.getElementById('input-practica-descripcion').value.trim(),
    areaEspecializacion: document.getElementById('input-practica-especializar').value.trim()
  };

  appData.habilidades = Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value);
  appData.intereses = Array.from(document.querySelectorAll('.interest-checkbox:checked')).map(cb => cb.value);
  appData.aboutMe = document.getElementById('input-about-me').value.trim();
  appData.herramientasTexto = document.getElementById('input-herramientas').value.trim();

  if (appData.nombre) {
    document.getElementById('welcome-user-name').textContent = appData.nombre;
  }

  guardarEnLocalStorage(true, '✅ ¡Información guardada correctamente!');
  actualizarVistaPreviaCV();

  if (siguientePantalla) {
    setTimeout(() => showScreen(siguientePantalla), 350);
  }
}

function guardarEnLocalStorage(notificar = true, mensaje = '✅ ¡Guardado correctamente!') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  if (notificar) mostrarAviso(mensaje);
}

function cargarDatosLocales() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    appData = {
      ...appData,
      ...parsed,
      academica: { ...appData.academica, ...(parsed.academica || {}) }
    };
  }
  rellenarFormularios();
}

function rellenarFormularios() {
  document.getElementById('input-nombre').value = appData.nombre || '';
  document.getElementById('input-puesto-titulo').value = appData.puestoTitulo || 'DESARROLLO DE SOFTWARE';
  document.getElementById('input-telefono').value = appData.telefono || '';
  document.getElementById('input-correo').value = appData.correo || '';
  document.getElementById('input-direccion').value = appData.direccion || '';
  document.getElementById('input-curp').value = appData.curp || '';
  document.getElementById('input-nacimiento').value = appData.fechaNacimiento || '';

  if (appData.avatarBase64) {
    const preview = document.getElementById('avatar-preview');
    preview.src = appData.avatarBase64;
    preview.classList.remove('hidden');
    document.getElementById('avatar-placeholder').classList.add('hidden');
  }

  document.getElementById('secu-escuela').value = appData.academica.secu?.escuela || '';
  document.getElementById('secu-especialidad').value = appData.academica.secu?.especialidad || '';
  document.getElementById('secu-anio').value = appData.academica.secu?.anios || '';

  document.getElementById('prepa-escuela').value = appData.academica.prepa?.escuela || '';
  document.getElementById('prepa-especialidad').value = appData.academica.prepa?.especialidad || '';
  document.getElementById('prepa-anio').value = appData.academica.prepa?.anios || '';

  document.getElementById('tsu-escuela').value = appData.academica.tsu?.escuela || '';
  document.getElementById('tsu-especialidad').value = appData.academica.tsu?.especialidad || '';
  document.getElementById('tsu-anio').value = appData.academica.tsu?.anios || '';

  document.getElementById('ing-escuela').value = appData.academica.ing?.escuela || '';
  document.getElementById('ing-especialidad').value = appData.academica.ing?.especialidad || '';
  document.getElementById('ing-anio').value = appData.academica.ing?.anios || '';

  document.getElementById('extra-cursos').value = appData.extracurricular.cursos || '';
  document.getElementById('extra-congresos').value = appData.extracurricular.congresos || '';
  document.getElementById('extra-conferencias').value = appData.extracurricular.conferencias || '';
  document.getElementById('extra-certificaciones').value = appData.extracurricular.certificaciones || '';
  document.getElementById('extra-idiomas').value = appData.extracurricular.idiomas || 'Español, Inglés (En curso)';
  document.getElementById('extra-voluntariado').value = appData.extracurricular.voluntariado || '';
  document.getElementById('extra-otro').value = appData.extracurricular.otro || '';

  const expRadio = document.querySelector(`input[name="tiene_exp"][value="${appData.tieneExperiencia}"]`);
  if (expRadio) expRadio.checked = true;
  document.getElementById('lista-experiencias').innerHTML = '';
  if (appData.experiencias && appData.experiencias.length > 0) {
    appData.experiencias.forEach(exp => agregarExperienciaItem(exp));
  }
  toggleExperiencia(appData.tieneExperiencia);

  const pracRadio = document.querySelector(`input[name="tiene_prac"][value="${appData.tienePracticas}"]`);
  if (pracRadio) pracRadio.checked = true;
  document.getElementById('input-practica-nombre').value = appData.practicas.nombre || '';
  document.getElementById('input-practica-descripcion').value = appData.practicas.descripcion || '';
  document.getElementById('input-practica-especializar').value = appData.practicas.areaEspecializacion || '';
  togglePracticas(appData.tienePracticas);

  document.querySelectorAll('.skill-checkbox').forEach(cb => {
    cb.checked = appData.habilidades.includes(cb.value);
  });

  document.querySelectorAll('.interest-checkbox').forEach(cb => {
    cb.checked = appData.intereses.includes(cb.value);
  });
  document.getElementById('input-about-me').value = appData.aboutMe || '';
  document.getElementById('input-herramientas').value = appData.herramientasTexto || '';
}

// =========================================
// GENERAR VISTA PREVIA DEL CV (DISEÑO PROFESIONAL)
// =========================================
function actualizarVistaPreviaCV() {
  document.getElementById('cv-nombre').textContent = appData.nombre || 'NOMBRE DEL CANDIDATO';
  document.getElementById('cv-puesto').textContent = appData.puestoTitulo || 'DESARROLLO DE SOFTWARE';

  const cvImg = document.getElementById('cv-avatar');
  if (appData.avatarBase64) {
    cvImg.src = appData.avatarBase64;
    cvImg.classList.remove('hidden');
  } else {
    cvImg.classList.add('hidden');
  }

  document.getElementById('cv-telefono').textContent = appData.telefono || 'Sin registrar';
  document.getElementById('cv-correo').textContent = appData.correo || 'Sin registrar';
  document.getElementById('cv-direccion').textContent = appData.direccion || 'Sin registrar';
  document.getElementById('cv-curp-nac').textContent = `${appData.curp || '-'} | Nac: ${appData.fechaNacimiento || '-'}`;

  const eduBox = document.getElementById('cv-education-list');
  let eduHTML = '';
  if (appData.academica.secu?.escuela || appData.academica.secu?.especialidad) {
    eduHTML += `<div class="cv-left-item"><strong>Secundaria ${appData.academica.secu.especialidad ? '(' + appData.academica.secu.especialidad + ')' : ''} - ${appData.academica.secu.escuela}</strong><em>${appData.academica.secu.anios}</em></div>`;
  }
  if (appData.academica.prepa?.escuela || appData.academica.prepa?.especialidad) {
    eduHTML += `<div class="cv-left-item"><strong>${appData.academica.prepa.especialidad || 'Preparatoria'} - ${appData.academica.prepa.escuela}</strong><em>${appData.academica.prepa.anios}</em></div>`;
  }
  if (appData.academica.tsu?.escuela || appData.academica.tsu?.especialidad) {
    eduHTML += `<div class="cv-left-item"><strong>TSU ${appData.academica.tsu.especialidad} - ${appData.academica.tsu.escuela}</strong><em>${appData.academica.tsu.anios}</em></div>`;
  }
  if (appData.academica.ing?.escuela || appData.academica.ing?.especialidad) {
    eduHTML += `<div class="cv-left-item"><strong>ING ${appData.academica.ing.especialidad} - ${appData.academica.ing.escuela}</strong><em>${appData.academica.ing.anios}</em></div>`;
  }
  eduBox.innerHTML = eduHTML || '<div class="cv-left-item">Formación académica por registrar</div>';

  const expList = document.getElementById('cv-expertise-list');
  const combinados = [...new Set([...appData.habilidades, ...appData.intereses])];
  if (combinados.length > 0) {
    expList.innerHTML = combinados.map(item => `<li>${item}</li>`).join('');
  } else {
    expList.innerHTML = '<li>Desarrollo de Software</li><li>Trabajo en equipo</li>';
  }

  document.getElementById('cv-idiomas').textContent = appData.extracurricular.idiomas || 'Español';
  let extraDetalles = [];
  if (appData.extracurricular.cursos) extraDetalles.push(`Cursos: ${appData.extracurricular.cursos}`);
  if (appData.extracurricular.certificaciones) extraDetalles.push(`Certificaciones: ${appData.extracurricular.certificaciones}`);
  if (appData.extracurricular.congresos) extraDetalles.push(`Congresos: ${appData.extracurricular.congresos}`);
  if (appData.extracurricular.voluntariado) extraDetalles.push(`Voluntariado: ${appData.extracurricular.voluntariado}`);
  document.getElementById('cv-extra-resumen').textContent = extraDetalles.join(' | ');

  const aboutEl = document.getElementById('cv-about-me');
  if (appData.aboutMe) {
    aboutEl.textContent = appData.aboutMe;
  } else {
    const areaInteres = appData.practicas.areaEspecializacion || (appData.intereses.join(', ') || 'Desarrollo de Software');
    aboutEl.textContent = `Estudiante y profesional enfocado en ${areaInteres}. Busco aportar soluciones funcionales y seguir creciendo profesionalmente, con total disposición y rapidez para aprender nuevas tecnologías.`;
  }

  const expRightBox = document.getElementById('cv-experience-list');
  let expRightHTML = '';

  if (appData.tieneExperiencia === 'si' && appData.experiencias.length > 0) {
    appData.experiencias.forEach(e => {
      if (e.empresa || e.puesto) {
        expRightHTML += `
          <div class="cv-exp-item">
            <div class="cv-exp-title">${e.fechas ? e.fechas + ' | ' : ''}${e.empresa} ${e.puesto ? '(' + e.puesto + ')' : ''}</div>
            <div class="cv-exp-desc">${e.comentarios}</div>
          </div>
        `;
      }
    });
  }

  if (appData.tienePracticas === 'si' && appData.practicas.nombre) {
    expRightHTML += `
      <div class="cv-exp-item">
        <div class="cv-exp-title">Prácticas / Proyecto | ${appData.practicas.nombre}</div>
        <div class="cv-exp-desc">${appData.practicas.descripcion}</div>
      </div>
    `;
  } else if (appData.tienePracticas === 'no' && appData.practicas.areaEspecializacion) {
    expRightHTML += `
      <div class="cv-exp-item">
        <div class="cv-exp-title">Área de Especialización Objetivo</div>
        <div class="cv-exp-desc">${appData.practicas.areaEspecializacion}</div>
      </div>
    `;
  }

  expRightBox.innerHTML = expRightHTML || '<div class="cv-exp-item"><div class="cv-exp-desc">En búsqueda de primera oportunidad profesional / prácticas.</div></div>';

  const toolsEl = document.getElementById('cv-tools-list');
  toolsEl.innerHTML = (appData.herramientasTexto || '').replace(/\n/g, '<br>');
}

// =========================================
// DESCARGAR PDF (COMPATIBLE CON TELÉFONO Y PC)
// =========================================
function descargarPDF() {
  guardarPaso();
  mostrarAviso('⏳ Generando PDF de tu CV...');

  const elemento = document.getElementById('print-cv-area');
  const nombreArchivo = (appData.nombre || 'Mi_CV').replace(/\s+/g, '_');

  const scrollActual = window.scrollY;
  window.scrollTo(0, 0);

  const opciones = {
    margin: 0,
    filename: `CV_${nombreArchivo}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf()
    .set(opciones)
    .from(elemento)
    .toPdf()
    .get('pdf')
    .then(function (pdf) {
      window.scrollTo(0, scrollActual);
      pdf.save(`CV_${nombreArchivo}.pdf`);
      mostrarAviso('📄 ¡PDF descargado! Revisa tus descargas.');
    })
    .catch(function (err) {
      window.scrollTo(0, scrollActual);
      console.error('Error al generar PDF:', err);
      mostrarAviso('⚠️ Abriendo vista de impresión del sistema...');
      window.print();
    });
}
