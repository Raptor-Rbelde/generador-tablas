"use strict";

/* ============================================================
   Acceso a las API REST del sitio.

   - Datos propios (características, temas, plantillas, equipo…):
     están en db.json, en la raíz del repositorio, y se leen con la
     API REST de GitHub (GET /repos/{dueño}/{repo}/contents/{ruta}).
     La respuesta se guarda en sessionStorage para no repetir la
     petición en cada página. Si GitHub no responde (sin internet o
     límite de peticiones), se usa el db.json servido localmente.
   - Galería de imágenes: API REST de Lorem Picsum.
   - Formulario de contacto: POST a JSONPlaceholder.
   ============================================================ */

const API = {
  github: "https://api.github.com/repos/Raptor-Rbelde/generador-tablas/contents/db.json?ref=main",
  local: "db.json",
  galeria: "https://picsum.photos/v2/list",
  contacto: "https://jsonplaceholder.typicode.com/posts",
  _db: null,

  /** Descarga db.json una sola vez (GitHub → copia local) y lo reutiliza. */
  async _cargarDB() {
    if (this._db) return this._db;
    try {
      const guardado = sessionStorage.getItem("db");
      if (guardado) return (this._db = JSON.parse(guardado));
    } catch (e) { /* sessionStorage no disponible */ }

    try {
      const resp = await fetch(this.github, {
        headers: { Accept: "application/vnd.github.raw+json" },
        signal: AbortSignal.timeout(6000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this._db = await resp.json();
    } catch (error) {
      console.warn("API de GitHub no disponible, usando db.json local.", error);
      const resp = await fetch(this.local);
      if (!resp.ok) throw new Error(`No se pudo leer ${this.local}`);
      this._db = await resp.json();
    }

    try { sessionStorage.setItem("db", JSON.stringify(this._db)); } catch (e) { /* sin espacio o bloqueado */ }
    return this._db;
  },

  /** Devuelve el arreglo de un recurso de db.json, p. ej. obtener("temas"). */
  async obtener(recurso) {
    const db = await this._cargarDB();
    return db[recurso] ?? [];
  },

  /** Lista de imágenes de Lorem Picsum. */
  async obtenerGaleria(pagina = 1, limite = 12) {
    const resp = await fetch(`${this.galeria}?page=${pagina}&limit=${limite}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const fotos = await resp.json();
    return fotos.map((f) => ({
      id: f.id,
      autor: f.author,
      miniatura: `https://picsum.photos/id/${f.id}/160/110`,
      url: `https://picsum.photos/id/${f.id}/400/300`
    }));
  },

  /** POST del formulario de contacto (JSONPlaceholder simula el guardado). */
  async enviarContacto(datos) {
    const resp = await fetch(this.contacto, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(datos)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }
};
