"use strict";

/* Página de contacto: formulario con validación reactiva (Vue 3) y envío POST a la API. */

const formularioVacio = () => ({ nombre: "", correo: "", asunto: "", mensaje: "" });

Vue.createApp({
  data() {
    return {
      form: formularioVacio(),
      asuntos: [],
      intentado: false,
      enviando: false,
      respuesta: null
    };
  },
  computed: {
    errores() {
      const e = {};
      if (this.form.nombre.length < 3) e.nombre = "Escribe tu nombre (mínimo 3 caracteres).";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.correo)) e.correo = "Escribe un correo válido.";
      if (!this.form.asunto) e.asunto = "Elige un asunto.";
      if (this.form.mensaje.length < 10) e.mensaje = "El mensaje debe tener al menos 10 caracteres.";
      return e;
    }
  },
  methods: {
    async enviar() {
      this.intentado = true;
      this.respuesta = null;
      if (Object.keys(this.errores).length) return;

      this.enviando = true;
      try {
        const r = await API.enviarContacto({ ...this.form, fecha: new Date().toISOString() });
        this.respuesta = { ok: true, texto: `¡Gracias, ${this.form.nombre}! Recibimos tu mensaje (folio #${r.id}).` };
        this.form = formularioVacio();
        this.intentado = false;
      } catch (e) {
        this.respuesta = { ok: false, texto: "No se pudo enviar el mensaje. Intenta de nuevo más tarde." };
      } finally {
        this.enviando = false;
      }
    }
  },
  async mounted() {
    try {
      this.asuntos = await API.obtener("asuntos");
    } catch (e) {
      this.asuntos = [{ id: 0, nombre: "Consulta general" }];
    }
  }
}).mount("#app");
