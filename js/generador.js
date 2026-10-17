"use strict";

/* ============================================================
   Generador de Tablas manipulando el DOM
   Lenguajes Interpretados en el Cliente — Ciclo 02-2026

   La tabla se guarda en un modelo (estado.celdas) y se dibuja
   con la API del DOM (createElement, appendChild, dataset…).
   Cada celda del modelo es una celda "ancla" o queda cubierta
   por otra celda combinada (colspan / rowspan).
   ============================================================ */

/* ---------- Referencias al DOM ---------- */
const $ = (id) => document.getElementById(id);

const dom = {
  form: $("formConfiguracion"),
  filas: $("inputFilas"),
  columnas: $("inputColumnas"),
  titulo: $("inputTitulo"),
  encabezado: $("chkEncabezado"),
  combinar: $("chkCombinar"),
  plantilla: $("selectPlantilla"),
  area: $("area-tabla"),
  vacio: $("mensajeVacio"),
  controles: $("controles-edicion"),
  infoSeleccion: $("infoSeleccion"),
  modoRango: $("chkModoRango"),
  listaTemas: $("listaTemas"),
  formato: $("formFormato"),
  valorGrosor: $("valorGrosor"),
  avisos: $("avisos"),
  // modal de imagen
  urlImagen: $("inputUrlImagen"),
  archivo: $("inputArchivo"),
  galeria: $("galeria"),
  masGaleria: $("btnMasGaleria"),
  vistaPrevia: $("vistaPreviaImagen"),
  sinVistaPrevia: $("sinVistaPrevia"),
  altImagen: $("inputAltImagen"),
  anchoImagen: $("inputAnchoImagen"),
  // modal de código
  textoCodigo: $("textoCodigo")
};

const modalImagen = new bootstrap.Modal($("modalImagen"));
const modalCodigo = new bootstrap.Modal($("modalCodigo"));

/* ---------- Estado de la aplicación ---------- */
const FORMATO_INICIAL = {
  tipoLinea: "solid",
  grosor: 1,
  colorBorde: "#c9c4b6",
  colorEncabezado: "#16181d",
  colorTextoEncabezado: "#fffdf8",
  colorCelda: "#ffffff",
  colorTexto: "#16181d",
  cebra: false,
  colorCebra: "#f6f4ee",
  anchoCompleto: true,
  alineacion: "left"
};

const estado = {
  celdas: [],          // [fila][columna] -> { texto, imagen, colspan, rowspan }
  formato: { ...FORMATO_INICIAL },
  ancla: null,         // celda donde inicia la selección { f, c }
  seleccion: null,     // rectángulo seleccionado { f1, c1, f2, c2 }
  arrastrando: false,
  imagenElegida: null, // src de la imagen escogida en el modal
  paginaGaleria: 1,
  plantillas: [],
  rangoCompleto: false  // modo rango táctil: ya se marcaron inicio y fin
};

const celdaNueva = (texto = "") => ({ texto, imagen: null, colspan: 1, rowspan: 1 });
const totalFilas = () => estado.celdas.length;
const totalColumnas = () => (estado.celdas[0] ? estado.celdas[0].length : 0);
const hayTabla = () => totalFilas() > 0;
const tieneEncabezado = () => dom.encabezado.checked;

/** Nombre de columna estilo hoja de cálculo: 0 -> A, 25 -> Z, 26 -> AA. */
function letraColumna(c) {
  let s = "";
  for (c += 1; c > 0; c = Math.floor((c - 1) / 26)) s = String.fromCharCode(65 + ((c - 1) % 26)) + s;
  return s;
}

/* ============================================================
   Avisos (alertas creadas con el DOM)
   ============================================================ */
function avisar(mensaje, tipo = "success") {
  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo} shadow-sm py-2 mb-2 aviso`;
  alerta.setAttribute("role", "status");
  alerta.textContent = mensaje;
  dom.avisos.appendChild(alerta);
  setTimeout(() => {
    alerta.classList.add("ocultar");
    alerta.addEventListener("transitionend", () => alerta.remove(), { once: true });
  }, 2800);
}

/* ============================================================
   Celdas combinadas
   ============================================================ */

/** Matriz con la celda ancla que cubre cada posición (null si es ancla o libre). */
function mapaCubiertas() {
  const mapa = estado.celdas.map((fila) => fila.map(() => null));
  estado.celdas.forEach((fila, f) => {
    fila.forEach((celda, c) => {
      if (mapa[f][c]) return;
      for (let i = f; i < f + celda.rowspan; i++) {
        for (let j = c; j < c + celda.colspan; j++) {
          if (i !== f || j !== c) mapa[i][j] = { f, c };
        }
      }
    });
  });
  return mapa;
}

/** Lista de celdas ancla { f, c, celda } (las que realmente se dibujan). */
function anclas() {
  const mapa = mapaCubiertas();
  const lista = [];
  estado.celdas.forEach((fila, f) => fila.forEach((celda, c) => {
    if (!mapa[f][c]) lista.push({ f, c, celda });
  }));
  return lista;
}

function hayCombinadas() {
  return anclas().some(({ celda }) => celda.colspan > 1 || celda.rowspan > 1);
}

/** Separa las celdas combinadas que cruzan del encabezado al cuerpo. */
function corregirEncabezado() {
  if (!tieneEncabezado() || !hayTabla()) return;
  estado.celdas[0].forEach((celda) => { celda.rowspan = 1; });
}

/* ============================================================
   Generar / dibujar la tabla
   ============================================================ */
function crearModelo(filas, columnas) {
  estado.celdas = Array.from({ length: filas }, () =>
    Array.from({ length: columnas }, () => celdaNueva()));
  if (tieneEncabezado()) {
    estado.celdas[0].forEach((celda, c) => { celda.texto = `Columna ${c + 1}`; });
  }
  estado.ancla = null;
  estado.seleccion = null;
}

/** Construye la tabla completa con createElement y la inserta en el área de trabajo. */
function dibujarTabla() {
  const anterior = dom.area.querySelector("table");
  if (anterior) anterior.remove();

  if (!hayTabla()) {
    dom.vacio.classList.remove("d-none");
    dom.controles.classList.add("d-none");
    return;
  }
  dom.vacio.classList.add("d-none");
  dom.controles.classList.remove("d-none");

  const tabla = document.createElement("table");
  tabla.className = "tabla-generada";

  if (dom.titulo.value.trim()) {
    const caption = document.createElement("caption");
    caption.textContent = dom.titulo.value.trim();
    tabla.appendChild(caption);
  }

  const mapa = mapaCubiertas();
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  estado.celdas.forEach((fila, f) => {
    const esEncabezado = tieneEncabezado() && f === 0;
    const tr = document.createElement("tr");

    fila.forEach((celda, c) => {
      if (mapa[f][c]) return; // posición cubierta por una celda combinada
      const td = document.createElement(esEncabezado ? "th" : "td");
      if (esEncabezado) td.scope = "col";
      if (celda.colspan > 1) td.colSpan = celda.colspan;
      if (celda.rowspan > 1) td.rowSpan = celda.rowspan;
      td.dataset.fila = f;
      td.dataset.col = c;

      if (celda.imagen) {
        const img = document.createElement("img");
        img.src = celda.imagen.src;
        img.alt = celda.imagen.alt;
        img.width = celda.imagen.ancho;
        img.draggable = false;
        td.appendChild(img);
      }

      const texto = document.createElement("div");
      texto.className = "celda-texto";
      texto.contentEditable = "true";
      texto.spellcheck = false;
      texto.textContent = celda.texto;
      texto.setAttribute("aria-label", `Celda ${letraColumna(c)}${f + 1}`);
      td.appendChild(texto);

      tr.appendChild(td);
    });

    (esEncabezado ? thead : tbody).appendChild(tr);
  });

  if (thead.children.length) tabla.appendChild(thead);
  tabla.appendChild(tbody);
  dom.area.appendChild(tabla);

  aplicarFormato();
  pintarSeleccion();
}

/* ============================================================
   Formato (tipo de línea y colores)
   ============================================================ */
function aplicarFormato() {
  const tabla = dom.area.querySelector("table");
  if (!tabla) return;
  const f = estado.formato;
  tabla.style.setProperty("--t-linea", f.tipoLinea);
  tabla.style.setProperty("--t-grosor", `${f.grosor}px`);
  tabla.style.setProperty("--t-borde", f.colorBorde);
  tabla.style.setProperty("--t-enc", f.colorEncabezado);
  tabla.style.setProperty("--t-enc-texto", f.colorTextoEncabezado);
  tabla.style.setProperty("--t-celda", f.colorCelda);
  tabla.style.setProperty("--t-texto", f.colorTexto);
  tabla.style.setProperty("--t-cebra", f.colorCebra);
  tabla.style.setProperty("--t-alinear", f.alineacion);
  tabla.classList.toggle("cebra", f.cebra);
  tabla.classList.toggle("ancho-completo", f.anchoCompleto);
}

/** Copia el estado del formato a los controles del panel. */
function sincronizarControlesFormato() {
  dom.formato.querySelectorAll("[data-formato]").forEach((control) => {
    const valor = estado.formato[control.dataset.formato];
    if (control.type === "checkbox") control.checked = valor;
    else control.value = valor;
  });
  dom.valorGrosor.textContent = estado.formato.grosor;
}

function leerControlFormato(control) {
  const clave = control.dataset.formato;
  if (control.type === "checkbox") estado.formato[clave] = control.checked;
  else if (control.type === "range") estado.formato[clave] = Number(control.value);
  else estado.formato[clave] = control.value;
  dom.valorGrosor.textContent = estado.formato.grosor;
  aplicarFormato();
}

function dibujarTemas(temas) {
  dom.listaTemas.replaceChildren();
  temas.forEach((tema) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-sm tema-boton";
    boton.textContent = tema.nombre;
    boton.style.backgroundColor = tema.colorEncabezado;
    boton.style.color = tema.colorTextoEncabezado;
    boton.style.border = `2px ${tema.tipoLinea} ${tema.colorBorde}`;
    boton.addEventListener("click", () => {
      const { id, nombre, ...valores } = tema;
      Object.assign(estado.formato, valores);
      sincronizarControlesFormato();
      aplicarFormato();
      avisar(`Tema "${nombre}" aplicado.`);
    });
    dom.listaTemas.appendChild(boton);
  });
}

/* ============================================================
   Selección de celdas
   ============================================================ */

/** Amplía el rectángulo hasta que contenga completas las celdas combinadas que toca. */
function expandirRango(f1, c1, f2, c2) {
  let r = { f1: Math.min(f1, f2), c1: Math.min(c1, c2), f2: Math.max(f1, f2), c2: Math.max(c1, c2) };
  const lista = anclas();
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const { f, c, celda } of lista) {
      const ff = f + celda.rowspan - 1;
      const cf = c + celda.colspan - 1;
      const toca = f <= r.f2 && ff >= r.f1 && c <= r.c2 && cf >= r.c1;
      if (!toca) continue;
      const nuevo = { f1: Math.min(r.f1, f), c1: Math.min(r.c1, c), f2: Math.max(r.f2, ff), c2: Math.max(r.c2, cf) };
      if (nuevo.f1 !== r.f1 || nuevo.c1 !== r.c1 || nuevo.f2 !== r.f2 || nuevo.c2 !== r.c2) {
        r = nuevo;
        cambio = true;
      }
    }
  }
  return r;
}

function seleccionar(f, c, extender) {
  if (!extender || !estado.ancla) estado.ancla = { f, c };
  estado.seleccion = expandirRango(estado.ancla.f, estado.ancla.c, f, c);
  pintarSeleccion();
}

function enSeleccion(f, c) {
  const s = estado.seleccion;
  return s && f >= s.f1 && f <= s.f2 && c >= s.c1 && c <= s.c2;
}

/** Anclas que están dentro de la selección actual. */
function anclasSeleccionadas() {
  return estado.seleccion ? anclas().filter(({ f, c }) => enSeleccion(f, c)) : [];
}

function pintarSeleccion() {
  dom.area.querySelectorAll("td, th").forEach((celda) => {
    celda.classList.toggle("seleccionada", enSeleccion(+celda.dataset.fila, +celda.dataset.col));
  });

  const s = estado.seleccion;
  if (!s) {
    dom.infoSeleccion.textContent = "Sin selección";
  } else {
    const inicio = `${letraColumna(s.c1)}${s.f1 + 1}`;
    const fin = `${letraColumna(s.c2)}${s.f2 + 1}`;
    dom.infoSeleccion.textContent = inicio === fin ? inicio : `${inicio}:${fin}`;
  }
  actualizarBotones();
}

function actualizarBotones() {
  const lista = anclasSeleccionadas();
  const permitir = dom.combinar.checked;
  $("btnCombinar").disabled = !permitir || lista.length < 2;
  $("btnSeparar").disabled = !permitir || !lista.some(({ celda }) => celda.colspan > 1 || celda.rowspan > 1);
  const sinSeleccion = lista.length === 0;
  ["btnImagen", "btnQuitarImagen", "btnVaciar"].forEach((id) => { $(id).disabled = sinSeleccion; });
  $("btnEliminarFila").disabled = totalFilas() <= 1;
  $("btnEliminarColumna").disabled = totalColumnas() <= 1;
}

/* ---------- Eventos del ratón y del teclado sobre la tabla (delegación) ---------- */
function celdaDesdeEvento(e) {
  const celda = e.target.closest("td, th");
  return celda && dom.area.contains(celda) ? celda : null;
}

dom.area.addEventListener("mousedown", (e) => {
  const celda = celdaDesdeEvento(e);
  if (!celda || e.button !== 0) return;
  const extender = e.shiftKey || (dom.modoRango.checked && estado.ancla !== null && !estado.rangoCompleto);
  seleccionar(+celda.dataset.fila, +celda.dataset.col, extender);
  if (dom.modoRango.checked) estado.rangoCompleto = extender;
  estado.arrastrando = true;
  if (e.shiftKey) e.preventDefault();
});

dom.area.addEventListener("mouseover", (e) => {
  if (!estado.arrastrando) return;
  const celda = celdaDesdeEvento(e);
  if (!celda) return;
  const f = +celda.dataset.fila;
  const c = +celda.dataset.col;
  if (estado.ancla.f === f && estado.ancla.c === c) return;
  window.getSelection().removeAllRanges(); // evita seleccionar texto mientras se arrastra
  document.activeElement.blur();
  seleccionar(f, c, true);
});

document.addEventListener("mouseup", () => { estado.arrastrando = false; });

// Al entrar a una celda con el teclado (Tab), se selecciona.
dom.area.addEventListener("focusin", (e) => {
  const celda = celdaDesdeEvento(e);
  if (!celda) return;
  const f = +celda.dataset.fila;
  const c = +celda.dataset.col;
  if (!enSeleccion(f, c)) seleccionar(f, c, false);
});

// Lo que se escribe en la celda se guarda en el modelo.
dom.area.addEventListener("input", (e) => {
  if (!e.target.classList.contains("celda-texto")) return;
  const celda = e.target.closest("td, th");
  estado.celdas[+celda.dataset.fila][+celda.dataset.col].texto = e.target.innerText.replace(/\n$/, "");
});

/* ============================================================
   Filas y columnas
   ============================================================ */
function agregarFila() {
  const pos = estado.seleccion ? estado.seleccion.f2 + 1 : totalFilas();
  // Las celdas combinadas que atraviesan la posición crecen una fila.
  anclas().forEach(({ f, celda }) => {
    if (f < pos && f + celda.rowspan > pos) celda.rowspan++;
  });
  estado.celdas.splice(pos, 0, Array.from({ length: totalColumnas() }, () => celdaNueva()));
  if (estado.seleccion) seleccionar(pos, estado.seleccion.c1, false);
  dibujarTabla();
}

function agregarColumna() {
  const pos = estado.seleccion ? estado.seleccion.c2 + 1 : totalColumnas();
  anclas().forEach(({ c, celda }) => {
    if (c < pos && c + celda.colspan > pos) celda.colspan++;
  });
  estado.celdas.forEach((fila, f) => {
    fila.splice(pos, 0, celdaNueva(tieneEncabezado() && f === 0 ? `Columna ${pos + 1}` : ""));
  });
  if (estado.seleccion) seleccionar(estado.seleccion.f1, pos, false);
  dibujarTabla();
}

function eliminarFilaEn(fila) {
  anclas().forEach(({ f, c, celda }) => {
    if (celda.rowspan === 1 || fila < f || fila >= f + celda.rowspan) return;
    if (f < fila) {
      celda.rowspan--;
    } else {
      // La celda combinada empieza en la fila eliminada: su contenido baja una fila.
      estado.celdas[fila + 1][c] = { ...celda, rowspan: celda.rowspan - 1 };
    }
  });
  estado.celdas.splice(fila, 1);
}

function eliminarColumnaEn(col) {
  anclas().forEach(({ f, c, celda }) => {
    if (celda.colspan === 1 || col < c || col >= c + celda.colspan) return;
    if (c < col) {
      celda.colspan--;
    } else {
      estado.celdas[f][col + 1] = { ...celda, colspan: celda.colspan - 1 };
    }
  });
  estado.celdas.forEach((fila) => fila.splice(col, 1));
}

function eliminarFilas() {
  const s = estado.seleccion;
  const [desde, hasta] = s ? [s.f1, s.f2] : [totalFilas() - 1, totalFilas() - 1];
  if (hasta - desde + 1 >= totalFilas()) return avisar("La tabla debe conservar al menos una fila.", "warning");
  for (let f = hasta; f >= desde; f--) eliminarFilaEn(f);
  limpiarSeleccion();
  corregirEncabezado();
  dibujarTabla();
}

function eliminarColumnas() {
  const s = estado.seleccion;
  const [desde, hasta] = s ? [s.c1, s.c2] : [totalColumnas() - 1, totalColumnas() - 1];
  if (hasta - desde + 1 >= totalColumnas()) return avisar("La tabla debe conservar al menos una columna.", "warning");
  for (let c = hasta; c >= desde; c--) eliminarColumnaEn(c);
  limpiarSeleccion();
  dibujarTabla();
}

function limpiarSeleccion() {
  estado.ancla = null;
  estado.seleccion = null;
}

/* ============================================================
   Combinar y separar celdas
   ============================================================ */
function combinar() {
  const s = estado.seleccion;
  if (!dom.combinar.checked || !s) return;
  if (tieneEncabezado() && s.f1 === 0 && s.f2 > 0) {
    return avisar("No se puede combinar el encabezado con celdas del cuerpo.", "warning");
  }
  const lista = anclasSeleccionadas();
  const textos = lista.map(({ celda }) => celda.texto).filter(Boolean);
  const imagen = lista.find(({ celda }) => celda.imagen)?.celda.imagen ?? null;

  lista.forEach(({ f, c }) => { estado.celdas[f][c] = celdaNueva(); });
  estado.celdas[s.f1][s.c1] = {
    texto: textos.join(" "),
    imagen,
    rowspan: s.f2 - s.f1 + 1,
    colspan: s.c2 - s.c1 + 1
  };
  dibujarTabla();
  avisar("Celdas combinadas.");
}

function separar() {
  anclasSeleccionadas().forEach(({ celda }) => {
    celda.colspan = 1;
    celda.rowspan = 1;
  });
  dibujarTabla();
  avisar("Celdas separadas.");
}

function separarTodas() {
  estado.celdas.flat().forEach((celda) => { celda.colspan = 1; celda.rowspan = 1; });
}

/* ============================================================
   Imágenes
   ============================================================ */
function elegirImagen(src) {
  estado.imagenElegida = src;
  if (src) dom.vistaPrevia.src = src;
  else dom.vistaPrevia.removeAttribute("src");
  dom.vistaPrevia.classList.toggle("d-none", !src);
  dom.sinVistaPrevia.classList.toggle("d-none", Boolean(src));
}

function abrirModalImagen() {
  dom.urlImagen.value = "";
  dom.archivo.value = "";
  dom.altImagen.value = "";
  elegirImagen(null);
  dom.galeria.querySelectorAll(".activa").forEach((b) => b.classList.remove("activa"));
  modalImagen.show();
}

async function cargarGaleria() {
  dom.masGaleria.disabled = true;
  try {
    const fotos = await API.obtenerGaleria(estado.paginaGaleria);
    fotos.forEach((foto) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "galeria-item";
      boton.title = `Foto de ${foto.autor}`;
      const img = document.createElement("img");
      img.src = foto.miniatura;
      img.alt = `Foto de ${foto.autor}`;
      img.loading = "lazy";
      boton.appendChild(img);
      boton.addEventListener("click", () => {
        dom.galeria.querySelectorAll(".activa").forEach((b) => b.classList.remove("activa"));
        boton.classList.add("activa");
        if (!dom.altImagen.value) dom.altImagen.value = `Foto de ${foto.autor}`;
        elegirImagen(foto.url);
      });
      dom.galeria.appendChild(boton);
    });
    estado.paginaGaleria++;
    dom.masGaleria.classList.remove("d-none");
  } catch (e) {
    const error = document.createElement("p");
    error.className = "text-danger small";
    error.textContent = "No se pudo cargar la galería. Revisa tu conexión.";
    dom.galeria.appendChild(error);
  } finally {
    dom.masGaleria.disabled = false;
  }
}

function insertarImagen() {
  if (!estado.imagenElegida) return avisar("Elige una imagen primero.", "warning");
  const ancho = Math.min(600, Math.max(16, Number(dom.anchoImagen.value) || 120));
  const imagen = { src: estado.imagenElegida, alt: dom.altImagen.value.trim() || "Imagen", ancho };
  anclasSeleccionadas().forEach(({ celda }) => { celda.imagen = { ...imagen }; });
  modalImagen.hide();
  dibujarTabla();
  avisar("Imagen insertada.");
}

/* ============================================================
   Código fuente y exportación
   ============================================================ */
const escaparHTML = (texto) => texto
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function generarCSS() {
  const f = estado.formato;
  const borde = f.tipoLinea === "none" ? "none" : `${f.grosor}px ${f.tipoLinea} ${f.colorBorde}`;
  const reglas = [
    `.mi-tabla {`,
    `  border-collapse: collapse;`,
    f.anchoCompleto ? `  width: 100%;` : null,
    `  font-family: Arial, Helvetica, sans-serif;`,
    `  color: ${f.colorTexto};`,
    `  background-color: ${f.colorCelda};`,
    `}`,
    `.mi-tabla caption {`,
    `  caption-side: top;`,
    `  font-weight: bold;`,
    `  padding: 8px 0;`,
    `}`,
    `.mi-tabla th,`,
    `.mi-tabla td {`,
    `  border: ${borde};`,
    `  padding: 8px 12px;`,
    `  text-align: ${f.alineacion};`,
    `  vertical-align: middle;`,
    `}`,
    `.mi-tabla thead th {`,
    `  background-color: ${f.colorEncabezado};`,
    `  color: ${f.colorTextoEncabezado};`,
    `}`
  ];
  if (f.cebra) {
    reglas.push(`.mi-tabla tbody tr:nth-child(even) td {`, `  background-color: ${f.colorCebra};`, `}`);
  }
  reglas.push(`.mi-tabla img {`, `  display: block;`, `  max-width: 100%;`, `  height: auto;`, `  margin: 0 auto 4px;`, `}`);
  return reglas.filter((r) => r !== null).join("\n");
}

function generarHTMLTabla() {
  const mapa = mapaCubiertas();
  const lineas = [`<table class="mi-tabla">`];
  const titulo = dom.titulo.value.trim();
  if (titulo) lineas.push(`  <caption>${escaparHTML(titulo)}</caption>`);

  const filaHTML = (fila, f, etiqueta) => {
    lineas.push(`    <tr>`);
    fila.forEach((celda, c) => {
      if (mapa[f][c]) return;
      let atributos = etiqueta === "th" ? ` scope="col"` : "";
      if (celda.colspan > 1) atributos += ` colspan="${celda.colspan}"`;
      if (celda.rowspan > 1) atributos += ` rowspan="${celda.rowspan}"`;
      let contenido = "";
      if (celda.imagen) {
        const { src, alt, ancho } = celda.imagen;
        contenido += `<img src="${escaparHTML(src)}" alt="${escaparHTML(alt)}" width="${ancho}">`;
      }
      contenido += escaparHTML(celda.texto).replace(/\n/g, "<br>");
      lineas.push(`      <${etiqueta}${atributos}>${contenido}</${etiqueta}>`);
    });
    lineas.push(`    </tr>`);
  };

  const inicioCuerpo = tieneEncabezado() ? 1 : 0;
  if (tieneEncabezado()) {
    lineas.push(`  <thead>`);
    filaHTML(estado.celdas[0], 0, "th");
    lineas.push(`  </thead>`);
  }
  lineas.push(`  <tbody>`);
  estado.celdas.slice(inicioCuerpo).forEach((fila, i) => filaHTML(fila, i + inicioCuerpo, "td"));
  lineas.push(`  </tbody>`, `</table>`);
  return lineas.join("\n");
}

function generarCodigo() {
  return `<style>\n${generarCSS().replace(/^/gm, "  ")}\n</style>\n\n${generarHTMLTabla()}\n`;
}

function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(enlace.href);
}

async function copiarCodigo() {
  try {
    await navigator.clipboard.writeText(dom.textoCodigo.value);
  } catch (e) {
    dom.textoCodigo.select();
    document.execCommand("copy");
  }
  avisar("Código copiado al portapapeles.");
}

function exportarCSV() {
  const valor = (t) => (/[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t);
  const csv = estado.celdas.map((fila) => fila.map((celda) => valor(celda.texto)).join(",")).join("\r\n");
  descargar("tabla.csv", "﻿" + csv, "text/csv;charset=utf-8");
}

/* ============================================================
   Plantillas
   ============================================================ */
function dibujarPlantillas(plantillas) {
  estado.plantillas = plantillas;
  dom.plantilla.replaceChildren();
  const vacia = document.createElement("option");
  vacia.value = "";
  vacia.textContent = plantillas.length ? "Elige una plantilla" : "Sin plantillas";
  dom.plantilla.appendChild(vacia);
  plantillas.forEach((p) => {
    const opcion = document.createElement("option");
    opcion.value = p.id;
    opcion.textContent = p.nombre;
    dom.plantilla.appendChild(opcion);
  });
}

function usarPlantilla() {
  const p = estado.plantillas.find((x) => String(x.id) === dom.plantilla.value);
  if (!p) return avisar("Elige una plantilla de la lista.", "warning");
  if (hayContenido() && !confirm("Se reemplazará la tabla actual. ¿Continuar?")) return;

  dom.encabezado.checked = p.encabezado;
  dom.titulo.value = p.nombre;
  estado.celdas = p.celdas.map((fila) => fila.map((texto) => celdaNueva(texto)));
  p.combinaciones.forEach(({ fila, columna, filas, columnas }) => {
    Object.assign(estado.celdas[fila][columna], { rowspan: filas, colspan: columnas });
  });
  if (p.combinaciones.length) dom.combinar.checked = true;
  dom.filas.value = totalFilas();
  dom.columnas.value = totalColumnas();
  limpiarSeleccion();
  dibujarTabla();
  avisar(`Plantilla "${p.nombre}" cargada.`);
  if (window.innerWidth < 992) dom.controles.scrollIntoView({ behavior: "smooth" });
}

/* ============================================================
   Formulario de configuración
   ============================================================ */
function hayContenido() {
  return estado.celdas.flat().some((celda, i) =>
    celda.imagen || (celda.texto && !(tieneEncabezado() && i < totalColumnas() && /^Columna \d+$/.test(celda.texto))));
}

function validarNumero(input) {
  const n = Number(input.value);
  const valido = Number.isInteger(n) && n >= Number(input.min) && n <= Number(input.max);
  input.classList.toggle("is-invalid", !valido);
  return valido ? n : null;
}

dom.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const filas = validarNumero(dom.filas);
  const columnas = validarNumero(dom.columnas);
  if (filas === null || columnas === null) return avisar("Revisa el número de filas y columnas.", "danger");
  if (hayContenido() && !confirm("Se reemplazará la tabla actual. ¿Continuar?")) return;
  crearModelo(filas, columnas);
  dibujarTabla();
  avisar(`Tabla de ${filas} × ${columnas} generada.`);
  // En pantallas pequeñas la tabla queda debajo del panel: se desplaza hasta ella.
  if (window.innerWidth < 992) dom.controles.scrollIntoView({ behavior: "smooth" });
});

$("btnLimpiar").addEventListener("click", () => {
  if (hayContenido() && !confirm("¿Borrar la tabla actual?")) return;
  estado.celdas = [];
  limpiarSeleccion();
  dom.form.reset();
  dom.filas.classList.remove("is-invalid");
  dom.columnas.classList.remove("is-invalid");
  estado.formato = { ...FORMATO_INICIAL };
  sincronizarControlesFormato();
  dibujarTabla();
});

dom.titulo.addEventListener("input", () => { if (hayTabla()) dibujarTabla(); });

dom.encabezado.addEventListener("change", () => {
  if (!hayTabla()) return;
  corregirEncabezado();
  limpiarSeleccion();
  dibujarTabla();
});

dom.combinar.addEventListener("change", () => {
  if (!dom.combinar.checked && hayCombinadas()) {
    if (confirm("Hay celdas combinadas. ¿Separarlas todas?")) {
      separarTodas();
      dibujarTabla();
    } else {
      dom.combinar.checked = true;
    }
  }
  actualizarBotones();
});

dom.modoRango.addEventListener("change", () => { estado.rangoCompleto = false; });

/* ---------- Controles de formato ---------- */
dom.formato.addEventListener("input", (e) => {
  if (e.target.dataset.formato) leerControlFormato(e.target);
});

/* ---------- Barra de edición ---------- */
$("btnAgregarFila").addEventListener("click", agregarFila);
$("btnAgregarColumna").addEventListener("click", agregarColumna);
$("btnEliminarFila").addEventListener("click", eliminarFilas);
$("btnEliminarColumna").addEventListener("click", eliminarColumnas);
$("btnCombinar").addEventListener("click", combinar);
$("btnSeparar").addEventListener("click", separar);
$("btnImagen").addEventListener("click", abrirModalImagen);
$("btnQuitarImagen").addEventListener("click", () => {
  anclasSeleccionadas().forEach(({ celda }) => { celda.imagen = null; });
  dibujarTabla();
});
$("btnVaciar").addEventListener("click", () => {
  anclasSeleccionadas().forEach(({ celda }) => { celda.texto = ""; celda.imagen = null; });
  dibujarTabla();
});
$("btnCodigo").addEventListener("click", () => {
  dom.textoCodigo.value = generarCodigo();
  modalCodigo.show();
});
$("btnExportarCSV").addEventListener("click", exportarCSV);
$("btnPlantilla").addEventListener("click", usarPlantilla);

/* ---------- Modal de imagen ---------- */
dom.urlImagen.addEventListener("input", () => {
  const url = dom.urlImagen.value.trim();
  elegirImagen(/^(https?:)?\/\//.test(url) ? url : null);
});

dom.archivo.addEventListener("change", () => {
  const archivo = dom.archivo.files[0];
  if (!archivo) return;
  if (!archivo.type.startsWith("image/")) return avisar("El archivo no es una imagen.", "danger");
  if (archivo.size > 1024 * 1024) return avisar("La imagen supera 1 MB.", "danger");
  const lector = new FileReader();
  lector.addEventListener("load", () => {
    if (!dom.altImagen.value) dom.altImagen.value = archivo.name.replace(/\.[^.]+$/, "");
    elegirImagen(lector.result);
  });
  lector.readAsDataURL(archivo);
});

$("tabGaleriaBtn").addEventListener("shown.bs.tab", () => {
  if (!dom.galeria.children.length) cargarGaleria();
});
dom.masGaleria.addEventListener("click", cargarGaleria);
$("btnInsertarImagen").addEventListener("click", insertarImagen);

/* ---------- Modal de código ---------- */
$("btnCopiarCodigo").addEventListener("click", copiarCodigo);
$("btnDescargarHTML").addEventListener("click", () => {
  const pagina = `<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Mi tabla</title>\n` +
    `</head>\n<body>\n\n${generarCodigo()}\n</body>\n</html>\n`;
  descargar("tabla.html", pagina, "text/html;charset=utf-8");
});

/* ============================================================
   Inicio: datos desde la API REST
   ============================================================ */
(async function iniciar() {
  sincronizarControlesFormato();
  try {
    const [temas, plantillas] = await Promise.all([API.obtener("temas"), API.obtener("plantillas")]);
    dibujarTemas(temas);
    dibujarPlantillas(plantillas);
  } catch (e) {
    dibujarPlantillas([]);
    avisar("No se pudieron cargar temas y plantillas. Abre el sitio desde un servidor local.", "warning");
  }
})();
