import { useEffect, useState } from "react";
import ImagenAmpliada from "./ImagenAmpliada";

const ETIQUETA_IMPORTANCIA = {
  normal: "Aviso",
  importante: "Aviso importante",
  urgente: "Aviso urgente",
};

function formatear(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DetalleModal({
  anuncio,
  onCerrar,
  puedeGestionar = false,
  onEditar,
  onEliminar,
}) {
  const [imagenAbierta, setImagenAbierta] = useState(false);

  useEffect(() => {
    if (!anuncio) return;
    const alTeclear = (evento) => {
      if (evento.key === "Escape" && !imagenAbierta) onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [anuncio, imagenAbierta, onCerrar]);

  if (!anuncio) return null;

  const publicado = formatear(anuncio.fecha_publicacion);
  const vence = formatear(anuncio.fecha_vencimiento);
  const destino = [anuncio.facultad, anuncio.carrera].filter(Boolean).join(" · ");

  return (
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center p-3 backdrop-blur-sm sm:p-5"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        onClick={(evento) => evento.stopPropagation()}
        className="app-modal detalle-scroll relative max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 sm:right-4 sm:top-4"
        >
          ✕
        </button>

        <div className="mb-3 flex flex-wrap items-center gap-2 pr-8 text-xs">
          <span className="rounded bg-sky-100 px-2 py-1 font-semibold text-sky-800">
            {anuncio.categoria?.nombre ?? "General"}
          </span>
          <span
            className={`rounded px-2 py-0.5 font-semibold ${
              anuncio.importancia === "urgente"
                ? "bg-red-100 text-red-800"
                : anuncio.importancia === "importante"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {ETIQUETA_IMPORTANCIA[anuncio.importancia] ?? "Aviso"}
          </span>
        </div>

        <div
          className={`grid items-start gap-5 ${
            anuncio.imagen_url ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""
          }`}
        >
          {anuncio.imagen_url && (
            <button
              type="button"
              onClick={() => setImagenAbierta(true)}
              aria-label={`Ampliar imagen de ${anuncio.titulo}`}
              className="group relative flex min-h-40 max-h-[48dvh] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-2"
            >
              <img
                src={anuncio.imagen_url}
                alt={`Imagen de ${anuncio.titulo}`}
                className="max-h-[44dvh] max-w-full rounded-lg object-contain"
              />
              <span className="pointer-events-none absolute rounded-lg bg-slate-950/75 px-3 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                Ampliar imagen
              </span>
            </button>
          )}

          <div className="min-w-0">
            <h2 id="detalle-titulo" className="mb-2 pr-8 text-2xl font-bold">
              {anuncio.titulo}
            </h2>

            {destino && <p className="app-modal-muted mb-1 text-sm">{destino}</p>}
            {(publicado || vence) && (
              <p className="app-modal-muted mb-4 text-xs">
                {publicado && `Publicado el ${publicado}`}
                {publicado && vence && " · "}
                {vence && `Vigente hasta el ${vence}`}
              </p>
            )}

            {anuncio.resumen && <p className="mb-3 font-semibold">{anuncio.resumen}</p>}
            {anuncio.tipo !== "image" &&
              anuncio.contenido &&
              anuncio.contenido !== anuncio.titulo &&
              anuncio.contenido !== anuncio.resumen && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {anuncio.contenido}
                </p>
              )}

            {anuncio.archivo_url && (
              <a
                href={anuncio.archivo_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600"
              >
                📄 Abrir documento PDF
              </a>
            )}
          </div>
        </div>

        {puedeGestionar && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-700 pt-4">
            <button
              type="button"
              onClick={() => onEditar(anuncio)}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
            >
              Editar anuncio
            </button>
            <button
              type="button"
              onClick={() => onEliminar(anuncio)}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
            >
              Eliminar anuncio
            </button>
          </div>
        )}
      </div>
      {imagenAbierta && (
        <ImagenAmpliada
          src={anuncio.imagen_url}
          alt={anuncio.titulo}
          onCerrar={() => setImagenAbierta(false)}
        />
      )}
    </div>
  );
}
