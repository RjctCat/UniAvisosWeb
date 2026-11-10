// Medidas del tablero y de cada nota (iguales a las del diseño original)
export const ANCHO_TABLERO = 3000;
export const ALTO_TABLERO = 2000;
export const NOTA_ANCHO = 320;
export const NOTA_ALTO = 310;

const CELDA_ANCHO = 360;
const CELDA_ALTO = 340;
const MARGEN = 40;

function hash(texto) {
  let h = 0;
  for (const caracter of String(texto)) h = (h * 31 + caracter.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Un anuncio con posición guardada conserva su inclinación.
// Los demás reciben una leve inclinación fija, calculada a partir de su id.
export function rotacionDe(anuncio) {
  if (anuncio.pos_x != null && anuncio.pos_y != null) return anuncio.rotacion || 0;
  return (hash(anuncio.id) % 5) - 2;
}

function solapa(x, y, otro) {
  return (
    x < otro.x + NOTA_ANCHO &&
    x + NOTA_ANCHO > otro.x &&
    y < otro.y + NOTA_ALTO &&
    y + NOTA_ALTO > otro.y
  );
}

// Devuelve un Map id -> {x, y} para TODOS los anuncios.
// Los que ya tienen posición la conservan; los demás se acomodan en las
// celdas libres, agrupados por facultad y carrera.
export function acomodar(anuncios) {
  const posiciones = new Map();
  const ocupados = [];

  anuncios.forEach((a) => {
    if (a.pos_x != null && a.pos_y != null) {
      const p = { x: a.pos_x, y: a.pos_y };
      posiciones.set(a.id, p);
      ocupados.push(p);
    }
  });

  const pendientes = anuncios
    .filter((a) => !posiciones.has(a.id))
    .sort(
      (a, b) =>
        (a.facultad || "zzz").localeCompare(b.facultad || "zzz", "es") ||
        (a.carrera || "zzz").localeCompare(b.carrera || "zzz", "es") ||
        String(b.fecha_publicacion).localeCompare(String(a.fecha_publicacion))
    );

  const columnas = Math.floor((ANCHO_TABLERO - MARGEN) / CELDA_ANCHO);
  const filas = Math.floor((ALTO_TABLERO - MARGEN) / CELDA_ALTO);
  const celdas = [];
  for (let fila = 0; fila < filas; fila++) {
    for (let columna = 0; columna < columnas; columna++) {
      celdas.push({ x: MARGEN + columna * CELDA_ANCHO, y: MARGEN + fila * CELDA_ALTO });
    }
  }

  let apiladas = 0;
  pendientes.forEach((a) => {
    const libre = celdas.find((celda) => !ocupados.some((o) => solapa(celda.x, celda.y, o)));
    let p;
    if (libre) {
      p = { x: libre.x, y: libre.y };
    } else {
      // Tablero lleno: se apilan con un pequeño desfase
      const desfase = (apiladas % 10) * 30;
      p = { x: MARGEN + desfase, y: MARGEN + desfase };
      apiladas++;
    }
    ocupados.push(p);
    posiciones.set(a.id, p);
  });

  return posiciones;
}
