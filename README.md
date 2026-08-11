# Generador de Tablas manipulando el DOM

Proyecto de cátedra — **Lenguajes Interpretados en el Cliente**, Ciclo 02-2026.
Universidad Don Bosco, Facultad de Ingeniería, Escuela de Computación.

Sitio web que permitirá generar tablas dinámicas manipulando el DOM con
JavaScript: el usuario definirá filas, columnas y encabezado, editará las
celdas directamente, agregará o eliminará filas y columnas, aplicará estilos
y exportará el resultado a CSV o HTML.

**Fase 1 (actual):** estructura HTML5, diseño CSS con Bootstrap 5.3 y
organización del repositorio.
**Fase 2:** implementación de la lógica en `js/app.js`.

## Estructura del proyecto

```
generador-tablas/
├── index.html          → página principal del sitio
├── css/
│   └── estilos.css     → hoja de estilos propia (personalización sobre Bootstrap)
├── js/
│   └── app.js          → lógica de manipulación del DOM (fase 2)
├── img/                → imágenes e íconos optimizados (SVG)
└── README.md
```

## Cómo ejecutar

No requiere instalación: abrir `index.html` en cualquier navegador moderno.
Bootstrap 5.3, Bootstrap Icons y la fuente Inter se cargan desde CDN
(se necesita conexión a internet).

## Flujo de trabajo con Git

- `main`: versión estable e integrada del proyecto.
- Una rama por estudiante (`dev-nombre`); los cambios se integran a `main`
  mediante pull requests revisados por el equipo.

## Integrantes

| Integrante | Rama |
|---|---|
| Michael Xavier Portillo Reyes | `dev-michael` |
| [Integrante 2] | `dev-usuario2` |
| [Integrante 3] | `dev-usuario3` |
| [Integrante 4] | `dev-usuario4` |
