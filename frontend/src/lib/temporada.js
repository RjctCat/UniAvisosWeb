const TEMPORADAS_ASTRONOMICAS = {
  3: "autumn",
  6: "winter",
  9: "spring",
  12: "summer",
};

export function obtenerTemporada(fecha = new Date()) {
  const mes = fecha.getMonth();
  if (mes === 11 || mes <= 1) return "summer";
  if (mes >= 2 && mes <= 4) return "autumn";
  if (mes >= 5 && mes <= 7) return "winter";
  return "spring";
}

export const ETIQUETAS_TEMPORADA = {
  winter: "❄️ Invierno",
  spring: "🌸 Primavera",
  summer: "☀️ Verano",
  autumn: "🍁 Otoño",
};

export const COLORES_TEMPORADA = {
  winter: "rgba(255,255,255,.82)",
  spring: "rgba(244,114,182,.8)",
  summer: "rgba(251,191,36,.72)",
  autumn: "rgba(217,119,6,.78)",
};

export const SIMBOLOS_TEMPORADA = {
  winter: "❄",
  spring: "✿",
  summer: "✦",
  autumn: "❧",
};

const CELEBRACIONES = [
  {
    clave: "halloween",
    nombre: "Halloween",
    simbolo: "🎃",
    color: "rgba(251,146,60,.85)",
    mes: 10,
    dia: 31,
    diasAntes: 7,
    diasDespues: 1,
  },
  {
    clave: "navidad",
    nombre: "Navidad",
    simbolo: "❄",
    color: "rgba(207, 255, 239, 0.82)",
    mes: 12,
    dia: 25,
    diasAntes: 25,
    diasDespues: 1,
  },
  {
    clave: "ano-nuevo",
    nombre: "Año Nuevo",
    simbolo: "✨",
    color: "rgba(250,204,21,.9)",
    mes: 1,
    dia: 1,
    diasAntes: 5,
    diasDespues: 2,
  },
  {
    clave: "san-valentin",
    nombre: "San Valentín",
    simbolo: "♥",
    color: "rgba(244,114,182,.85)",
    mes: 2,
    dia: 14,
    diasAntes: 7,
    diasDespues: 1,
  },
];

export function obtenerCelebracion(fecha = new Date()) {
  const hoy = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const candidatas = CELEBRACIONES.flatMap((celebracion) => {
    return [-1, 0, 1].map((desfase) => {
      const anio = fecha.getFullYear() + desfase;
      const diaCelebracion = new Date(anio, celebracion.mes - 1, celebracion.dia);
      const diasRestantes = Math.round((diaCelebracion - hoy) / 86_400_000);
      return { ...celebracion, diasRestantes };
    });
  })
    .filter(
      ({ diasRestantes, diasAntes, diasDespues }) =>
        diasRestantes >= -diasDespues && diasRestantes <= diasAntes
    )
    .sort((a, b) => Math.abs(a.diasRestantes) - Math.abs(b.diasRestantes));

  const proxima = candidatas[0];
  return proxima
    ? {
        nombre: proxima.nombre,
        etiqueta: `${proxima.simbolo} ${proxima.nombre}`,
        simbolo: proxima.simbolo,
        color: proxima.color,
      }
    : null;
}

export async function obtenerCambiosAstronomicos(anios, signal) {
  const respuestas = await Promise.all(
    anios.map(async (anio) => {
      const respuesta = await fetch(
        `https://aa.usno.navy.mil/api/seasons?year=${anio}&tz=-4`,
        { signal }
      );
      if (!respuesta.ok) {
        throw new Error(`No se pudieron consultar las estaciones de ${anio}.`);
      }
      return respuesta.json();
    })
  );

  return respuestas.flatMap((respuesta) =>
    (respuesta.data || [])
      .filter((evento) => TEMPORADAS_ASTRONOMICAS[evento.month])
      .map((evento) => {
        const [hora, minuto] = evento.time.split(":").map(Number);
        const fecha = new Date(
          Date.UTC(evento.year, evento.month - 1, evento.day, hora + 4, minuto)
        );
        return {
          temporada: TEMPORADAS_ASTRONOMICAS[evento.month],
          fecha,
          horaLocal: evento.time,
        };
      })
  );
}
