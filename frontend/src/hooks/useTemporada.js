import { useEffect, useState } from "react";
import {
  ETIQUETAS_TEMPORADA,
  obtenerCambiosAstronomicos,
  obtenerCelebracion,
  obtenerTemporada,
} from "../lib/temporada";

function mostrarFecha(fecha) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "short",
    timeZone: "America/La_Paz",
  }).format(fecha);
}

export default function useTemporada() {
  const [estado, setEstado] = useState(() => ({
    temporada: obtenerTemporada(),
    celebracion: obtenerCelebracion(),
    siguiente: null,
    error: "",
  }));

  useEffect(() => {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const controlador = new AbortController();

    obtenerCambiosAstronomicos([anio - 1, anio, anio + 1], controlador.signal)
      .then((eventos) => {
        const ordenados = eventos.sort((a, b) => a.fecha - b.fecha);
        const actual = ordenados.filter((evento) => evento.fecha <= new Date()).at(-1);
        const siguiente = ordenados.find((evento) => evento.fecha > new Date());
        setEstado({
          temporada: actual?.temporada || obtenerTemporada(),
          celebracion: obtenerCelebracion(),
          siguiente: siguiente
            ? {
                etiqueta: ETIQUETAS_TEMPORADA[siguiente.temporada],
                fecha: mostrarFecha(siguiente.fecha),
                hora: siguiente.horaLocal,
              }
            : null,
          error: "",
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setEstado((actual) => ({
          ...actual,
          temporada: obtenerTemporada(),
          celebracion: obtenerCelebracion(),
          error: "No se pudieron cargar las fechas astronómicas oficiales.",
        }));
      });

    return () => controlador.abort();
  }, []);

  return estado;
}
