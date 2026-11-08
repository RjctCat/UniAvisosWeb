const ETIQUETAS = {
  normal: "bg-gray-100 text-gray-700",
  importante: "bg-amber-100 text-amber-800",
  urgente: "bg-red-100 text-red-700",
};

export default function AnuncioCard({ anuncio }) {
  const fecha = anuncio.fecha_publicacion
    ? new Date(anuncio.fecha_publicacion).toLocaleDateString("es-BO")
    : "";

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      {anuncio.imagen_url && (
        <img
          src={anuncio.imagen_url}
          alt=""
          className="mb-3 max-h-56 w-full rounded-lg object-cover"
        />
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">{anuncio.categoria?.nombre}</span>
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${
            ETIQUETAS[anuncio.importancia] ?? ETIQUETAS.normal
          }`}
        >
          {anuncio.importancia}
        </span>
        {fecha && <span className="ml-auto text-gray-400">{fecha}</span>}
      </div>

      <h2 className="text-lg font-semibold">{anuncio.titulo}</h2>
      <p className="mt-1 text-gray-700">{anuncio.resumen}</p>

      {(anuncio.facultad || anuncio.carrera) && (
        <p className="mt-2 text-xs text-gray-500">
          {[anuncio.facultad, anuncio.carrera].filter(Boolean).join(" · ")}
        </p>
      )}

      {anuncio.archivo_url && (
        <a
          href={anuncio.archivo_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Ver documento PDF
        </a>
      )}
    </article>
  );
}