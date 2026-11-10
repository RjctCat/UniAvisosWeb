const IMPORTANCIAS = {
  normal: {
    etiqueta: "Aviso",
    color: "border-l-sky-400",
    clase: "bg-sky-50 text-sky-800",
  },
  importante: {
    etiqueta: "Importante",
    color: "border-l-amber-400",
    clase: "bg-amber-50 text-amber-800",
  },
  urgente: {
    etiqueta: "Urgente",
    color: "border-l-red-500",
    clase: "bg-red-50 text-red-800",
  },
};

function formatearFecha(fecha) {
  if (!fecha) return null;

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;

  return {
    iso: valor.toISOString(),
    texto: valor.toLocaleDateString("es-BO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

export default function AnuncioCard({
  anuncio,
  puedeGestionar = false,
  onEditar,
  onEliminar,
}) {
  const importancia = IMPORTANCIAS[anuncio.importancia] ?? IMPORTANCIAS.normal;
  const publicado = formatearFecha(anuncio.fecha_publicacion);
  const vence = formatearFecha(anuncio.fecha_vencimiento);
  const texto = anuncio.resumen || anuncio.contenido || "Este anuncio no tiene una descripción.";
  const resumen = texto.length > 180 ? `${texto.slice(0, 180).trimEnd()}…` : texto;
  const destino = [anuncio.facultad, anuncio.carrera].filter(Boolean).join(" · ");

  return (
    <article
      className={`lista-anuncio relative flex h-full flex-col overflow-hidden rounded-xl border border-l-4 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${importancia.color}`}
    >
      {anuncio.imagen_url && (
        <img
          src={anuncio.imagen_url}
          alt={anuncio.titulo ? `Imagen de ${anuncio.titulo}` : "Imagen del anuncio"}
          loading="lazy"
          className="lista-anuncio-image mb-3 max-h-36 w-full rounded-lg object-cover"
        />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="lista-category rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
          {anuncio.categoria?.nombre || "General"}
        </span>
        <span className={`lista-priority rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${importancia.clase}`}>
          {importancia.etiqueta}
        </span>
        {publicado && (
          <time
            dateTime={publicado.iso}
            className="lista-muted ml-auto text-xs"
          >
            {publicado.texto}
          </time>
        )}
      </div>

      <h2 className="lista-anuncio-title mb-1.5 text-base font-bold leading-snug">
        {anuncio.titulo}
      </h2>
      <p className="lista-anuncio-summary text-sm leading-relaxed">{resumen}</p>

      <div className="mt-auto pt-3">
        {destino && <p className="lista-muted mb-2 text-xs">{destino}</p>}

        <div className="lista-anuncio-footer flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
          {vence ? (
            <p className="lista-muted text-xs">
              Vigente hasta{" "}
              <time dateTime={vence.iso}>{vence.texto}</time>
            </p>
          ) : (
            <span />
          )}

          {anuncio.archivo_url && (
            <a
              href={anuncio.archivo_url}
              target="_blank"
              rel="noreferrer"
              className="lista-document inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <span aria-hidden="true">📄</span>
              Ver documento
            </a>
          )}
        </div>
        {puedeGestionar && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onEditar(anuncio)}
              className="lista-edit rounded-lg border px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onEliminar(anuncio)}
              className="lista-delete rounded-lg border px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}