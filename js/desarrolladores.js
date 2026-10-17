"use strict";

/* Página de desarrolladores: Vue 3 lista el equipo obtenido de la API. */

Vue.createApp({
  data() {
    return { cargando: true, error: "", desarrolladores: [] };
  },
  methods: {
    iniciales(nombre) {
      const partes = nombre.split(" ");
      return (partes[0][0] + (partes[2] ?? partes[1] ?? "")[0]).toUpperCase();
    }
  },
  async mounted() {
    try {
      this.desarrolladores = await API.obtener("desarrolladores");
    } catch (e) {
      this.error = "No se pudo cargar el equipo. Abre el sitio desde un servidor local (por ejemplo, Live Server).";
    } finally {
      this.cargando = false;
    }
  }
}).mount("#app");
