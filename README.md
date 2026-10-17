# Generador de Tablas manipulando el DOM

Proyecto de cátedra — **Lenguajes Interpretados en el Cliente**, Ciclo 02-2026.
Universidad Don Bosco, Facultad de Ingeniería, Escuela de Computación.

Sitio web para crear tablas HTML dinámicas: el usuario define filas y columnas,
escribe texto e inserta imágenes en las celdas, combina celdas, cambia el tipo
de línea y los colores, y obtiene el código fuente listo para su página web.

## Secciones del sitio

| Página | Contenido |
|---|---|
| `index.html` | Introducción / presentación del sitio (características, pasos y temas cargados desde la API). |
| `generador.html` | Generador de tablas (manipulación del DOM). |
| `desarrolladores.html` | Integrantes del equipo (cargados desde la API). |
| `contacto.html` | Formulario "Contáctanos" con validación y envío a una API REST. |

## Funcionalidades del generador

- **Configuración inicial:** filas (1–50), columnas (1–20), título, encabezado y
  plantillas predefinidas.
- **Formato:** tipo de línea (continua, discontinua, punteada, doble, sin líneas),
  grosor, colores de líneas, encabezado, celdas y texto, filas alternas, alineación
  y temas listos para aplicar.
- **Combinar celdas:** se habilita con el interruptor *Permitir combinar celdas*.
  Seleccione un rango (arrastrando, con Shift + clic o con el *modo rango* en
  pantallas táctiles) y presione *Combinar*; *Separar* deshace la combinación.
- **Texto e imágenes:** cada celda es editable; las imágenes se insertan desde una
  URL, desde el equipo o desde la galería de Lorem Picsum.
- **Filas y columnas:** insertar debajo/a la derecha de la selección y eliminar las
  seleccionadas (las celdas combinadas se ajustan solas).
- **Código fuente:** genera CSS + HTML de la tabla para copiar o descargar como
  `.html`. También exporta a CSV.

## Tecnologías y criterios de la rúbrica

- **HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, fuentes IBM Plex Sans e IBM Plex Mono.**
- **API del DOM (JavaScript nativo):** `js/generador.js` construye y modifica la
  tabla con `createElement`, `appendChild`, `dataset`, `classList`, delegación de
  eventos, etc.
- **Framework de JavaScript:** **Vue 3** (por CDN) en las páginas de inicio,
  desarrolladores y contacto (`js/inicio.js`, `js/desarrolladores.js`, `js/contacto.js`).
- **JSON cargado dinámicamente:** `db.json` contiene características, pasos,
  temas, plantillas, desarrolladores y asuntos de contacto.
- **API REST** (`js/api.js`):
  - API REST de GitHub — `GET /repos/Raptor-Rbelde/generador-tablas/contents/db.json`
    devuelve `db.json` desde la rama `main` (si falla, se usa la copia local).
  - Lorem Picsum — `GET /v2/list` para la galería de imágenes.
  - JSONPlaceholder — `POST /posts` para el formulario de contacto.

## Estructura del proyecto

```
generador-tablas/
├── index.html             → inicio / presentación
├── generador.html         → generador de tablas
├── desarrolladores.html   → equipo
├── contacto.html          → contáctanos
├── db.json                → datos del sitio (servidos por la API de GitHub)
├── css/
│   └── estilos.css        → estilos propios (sobre Bootstrap)
├── js/
│   ├── api.js             → acceso a las API REST
│   ├── generador.js       → lógica del generador (DOM nativo)
│   ├── inicio.js          → Vue: página de inicio
│   ├── desarrolladores.js → Vue: página de desarrolladores
│   └── contacto.js        → Vue: formulario de contacto
├── img/                   → logotipo y favicon (SVG)
└── README.md
```

## Cómo ejecutar

Los datos se cargan con `fetch`, por lo que el sitio debe abrirse desde un
servidor local (no con doble clic sobre el archivo):

- VS Code: extensión **Live Server** → *Open with Live Server*.
- O bien, desde la carpeta del proyecto: `python3 -m http.server 5500` y abrir
  <http://localhost:5500>.

Se necesita conexión a internet para Bootstrap, Vue, las fuentes y las API.

## Flujo de trabajo con Git

- `main`: versión estable e integrada del proyecto.
- Una rama por estudiante (`dev-nombre`); los cambios se integran a `main`
  mediante pull requests revisados por el equipo.

## Integrantes

| Integrante | Rama |
|---|---|
| Michael Xavier Portillo Reyes | `dev-michael` |
| Rafael Aquino Rodriguez | `dev-Rafael` |
| Isel Metzí Carrillo Mejías | `dev-Isel` |
| Kevin Eduardo Huezo Campos | `dev-Kevin` |
