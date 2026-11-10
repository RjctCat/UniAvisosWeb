// Dibuja el anuncio en un canvas que conserva la proporción de su tarjeta 3D.

export const TARJETA_ANCHO = 768;

const MARGEN = 42;
const FUENTE = '"Inter", "Segoe UI", system-ui, sans-serif';

const ACENTOS = {
  note: "#1769d2",
  table: "#1056b0",
  poster: "#347dd2",
  image: "#1769d2",
  default: "#1769d2",
};

const IMPORTANCIAS = {
  normal: { texto: "Aviso", fondo: "#eaf2fc", color: "#315b8c" },
  importante: { texto: "Importante", fondo: "#fff3dc", color: "#875313" },
  urgente: { texto: "Urgente", fondo: "#fff0ef", color: "#b94d48" },
};

function trazarRectangulo(ctx, x, y, ancho, alto, radio) {
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.lineTo(x + ancho - radio, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + radio, radio);
  ctx.lineTo(x + ancho, y + alto - radio);
  ctx.arcTo(x + ancho, y + alto, x + ancho - radio, y + alto, radio);
  ctx.lineTo(x + radio, y + alto);
  ctx.arcTo(x, y + alto, x, y + alto - radio, radio);
  ctx.lineTo(x, y + radio);
  ctx.arcTo(x, y, x + radio, y, radio);
  ctx.closePath();
}

function recortar(ctx, texto, anchoMax) {
  if (ctx.measureText(texto).width <= anchoMax) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > anchoMax) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

export function ajustarLineas(ctx, texto, anchoMax, maxLineas) {
  const palabras = String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const lineas = [];
  let actual = "";
  let i = 0;

  for (; i < palabras.length; i++) {
    const prueba = actual ? `${actual} ${palabras[i]}` : palabras[i];
    if (!actual || ctx.measureText(prueba).width <= anchoMax) {
      actual = prueba;
      continue;
    }
    if (lineas.length === maxLineas - 1) break;
    lineas.push(actual);
    actual = palabras[i];
  }

  const sobra = i < palabras.length;
  if (actual) lineas.push(actual);
  if (sobra && lineas.length) {
    const ultima = lineas.length - 1;
    lineas[ultima] = recortar(ctx, `${lineas[ultima]}…`, anchoMax);
  }
  return lineas.map((linea) => recortar(ctx, linea, anchoMax));
}

function dibujarChip(ctx, texto, x, y, fondo, color, fuente) {
  ctx.font = `700 ${fuente}px ${FUENTE}`;
  const alto = fuente * 1.8;
  const ancho = ctx.measureText(texto).width + fuente * 1.4;
  ctx.fillStyle = fondo;
  trazarRectangulo(ctx, x, y, ancho, alto, alto / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(texto, x + fuente * 0.7, y + alto / 2);
  ctx.textBaseline = "top";
  return x + ancho + fuente * 0.55;
}

function dibujarImagenContenida(ctx, imagen, x, y, ancho, alto) {
  if (!imagen?.width || !imagen?.height || ancho <= 0 || alto <= 0) return;
  const escala = Math.min(ancho / imagen.width, alto / imagen.height);
  const dw = imagen.width * escala;
  const dh = imagen.height * escala;
  ctx.drawImage(imagen, x + (ancho - dw) / 2, y + (alto - dh) / 2, dw, dh);
}

export function dibujarTarjeta(lienzo, anuncio, imagen, aspecto = 0.85) {
  const W = TARJETA_ANCHO;
  const H = Math.round(W / aspecto);
  lienzo.width = W;
  lienzo.height = H;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return;

  const tipo = ACENTOS[anuncio.tipo] ? anuncio.tipo : "default";
  const acento = ACENTOS[tipo];
  const importancia = IMPORTANCIAS[anuncio.importancia] ?? IMPORTANCIAS.normal;
  const radio = Math.min(42, H * 0.07);
  const pieAlto = Math.min(108, H * 0.19);
  const yPie = H - pieAlto;
  const margenInterior = MARGEN;
  const anchoTexto = W - margenInterior * 2;
  const soloImagen = tipo === "image";
  const altoImagen = soloImagen
    ? Math.max(90, H - pieAlto - 175)
    : imagen
      ? Math.min(H * 0.36, 290)
      : Math.min(H * 0.2, 170);

  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.save();
  trazarRectangulo(ctx, 0, 0, W, H, radio);
  ctx.clip();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  if (imagen && imagen.width && imagen.height) {
    ctx.fillStyle = "#eaf2fc";
    ctx.fillRect(0, 0, W, altoImagen);
    dibujarImagenContenida(ctx, imagen, 12, 12, W - 24, Math.max(0, altoImagen - 24));
  } else {
    const cabecera = ctx.createLinearGradient(0, 0, W, altoImagen);
    cabecera.addColorStop(0, acento);
    cabecera.addColorStop(1, "#102c4d");
    ctx.fillStyle = cabecera;
    ctx.fillRect(0, 0, W, altoImagen);

    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(W - 40, 20, 145, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.min(23, altoImagen * 0.16)}px ${FUENTE}`;
    ctx.fillText("UNIAVISOS", margenInterior, Math.max(18, altoImagen * 0.2));
    ctx.font = `700 ${Math.min(38, altoImagen * 0.3)}px ${FUENTE}`;
    const etiqueta = tipo === "table" ? "Información" : tipo === "poster" ? "Comunicado" : "Universidad";
    ctx.fillText(recortar(ctx, etiqueta, anchoTexto), margenInterior, Math.max(48, altoImagen * 0.48));
  }

  ctx.fillStyle = acento;
  ctx.fillRect(0, altoImagen - 5, W, 5);
  ctx.restore();

  let y = altoImagen + (soloImagen ? 16 : 24);
  const fuenteChip = Math.max(18, Math.min(24, H * 0.027));
  const categoria = recortar(
    ctx,
    String(anuncio.categoria?.nombre ?? "General").toUpperCase(),
    W * 0.48
  );
  dibujarChip(ctx, categoria, margenInterior, y, "#eaf2fc", "#315b8c", fuenteChip);
  dibujarChip(
    ctx,
    importancia.texto,
    W - margenInterior - ctx.measureText(importancia.texto).width - fuenteChip * 1.4,
    y,
    importancia.fondo,
    importancia.color,
    fuenteChip
  );
  y += fuenteChip * 2.45;

  const disponibleTitulo = Math.max(0, Math.min(H * 0.31, yPie - y - 70));
  const fuenteTitulo = Math.max(29, Math.min(46, H * 0.052));
  ctx.font = `700 ${fuenteTitulo}px ${FUENTE}`;
  ctx.fillStyle = "#10233f";
  const lineasTitulo = ajustarLineas(ctx, anuncio.titulo || "Aviso universitario", anchoTexto, 3);
  const interlineadoTitulo = fuenteTitulo * 1.2;
  const maxTitulo = Math.max(1, Math.floor(disponibleTitulo / interlineadoTitulo));
  lineasTitulo.slice(0, maxTitulo).forEach((linea, indice) => {
    ctx.fillText(linea, margenInterior, y + indice * interlineadoTitulo);
  });
  y += Math.min(lineasTitulo.length, maxTitulo) * interlineadoTitulo + 10;

  const texto = anuncio.resumen || anuncio.contenido || "";
  if (!soloImagen && texto && y < yPie - 12) {
    const fuenteResumen = Math.max(21, Math.min(30, H * 0.034));
    const interlineadoResumen = fuenteResumen * 1.42;
    const maxResumen = Math.max(0, Math.floor((yPie - 14 - y) / interlineadoResumen));
    ctx.font = `400 ${fuenteResumen}px ${FUENTE}`;
    ctx.fillStyle = "#62728a";
    if (maxResumen > 0) {
      ajustarLineas(ctx, texto, anchoTexto, maxResumen).forEach((linea, indice) => {
        ctx.fillText(linea, margenInterior, y + indice * interlineadoResumen);
      });
    }
  }

  ctx.fillStyle = "#f5f8fc";
  ctx.fillRect(0, yPie, W, pieAlto);
  ctx.fillStyle = `${acento}30`;
  ctx.fillRect(margenInterior, yPie, W - margenInterior * 2, 2);
  ctx.font = `600 ${Math.max(20, Math.min(25, H * 0.029))}px ${FUENTE}`;
  ctx.fillStyle = acento;
  ctx.fillText("Selecciona para ver el detalle", margenInterior, yPie + 20);

  ctx.strokeStyle = "#dbe6f3";
  ctx.lineWidth = 3;
  trazarRectangulo(ctx, 2, 2, W - 4, H - 4, radio);
  ctx.stroke();
}
