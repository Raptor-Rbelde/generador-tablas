"use strict";

/* Página de inicio: Vue 3 carga características, pasos y temas desde la API. */

Vue.createApp({
  data() {
    return {
      cargando: true,
      error: "",
      caracteristicas: [],
      pasos: [],
      temas: []
    };
  },
  methods: {
    letra(i) {
      return String.fromCharCode(65 + i);
    },
    borde(tema) {
      return tema.tipoLinea === "none" ? "none" : `${Math.min(tema.grosor, 3)}px ${tema.tipoLinea} ${tema.colorBorde}`;
    }
  },
  async mounted() {
    try {
      [this.caracteristicas, this.pasos, this.temas] = await Promise.all([
        API.obtener("caracteristicas"),
        API.obtener("pasos"),
        API.obtener("temas")
      ]);
    } catch (e) {
      this.error = "No se pudo cargar el contenido. Abre el sitio desde un servidor local (por ejemplo, Live Server).";
    } finally {
      this.cargando = false;
    }
  }
}).mount("#app");
