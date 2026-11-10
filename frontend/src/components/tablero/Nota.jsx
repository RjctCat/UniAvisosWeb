import { NOTA_ANCHO, rotacionDe } from "../../lib/layout";

export default function Nota({ anuncio, posicion, onAbrir }) {
  const tipo = anuncio.tipo || "default";
  const claseTipo = tipo === "image" ? "ad-image-only" : `ad-${tipo}`;
  const solaImagen = tipo === "image" && anuncio.imagen_url;
  const texto = anuncio.resumen || anuncio.contenido || "";
  const filas = tipo === "table"
    ? (anuncio.contenido || "").split("\n").map((fila) => fila.trim()).filter(Boolean)
    : [];

  const abrir = (evento) => {
    if (evento.target.closest("a, button")) return;
    onAbrir(anuncio);
  };

  const alTeclear = (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      onAbrir(anuncio);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir anuncio: ${anuncio.titulo}`}
      onClick={abrir}
      onKeyDown={alTeclear}
      className={`board-item absolute cursor-pointer select-none rounded-md p-4 text-slate-900 ${claseTipo}`}
      style={{
        left: posicion.x,
        top: posicion.y,
        width: NOTA_ANCHO,
        zIndex: anuncio.z_index || 1,
        transform: `rotate(${rotacionDe(anuncio)}deg)`,
      }}
    >
      <div className={`pin ${anuncio.pin || "pin-red"}`} />
      {tipo !== "image" && <div className="tape-effect" />}

      <div className="pt-2">
        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-bold uppercase">
          {anuncio.categoria?.nombre ?? "General"} • {anuncio.importancia}
        </span>

        {solaImagen ? (
          <img
            src={anuncio.imagen_url}
            alt={anuncio.titulo}
            loading="lazy"
            className="mt-2 h-40 w-full rounded object-cover"
          />
        ) : (
          <>
            <h3 className="font-handwriting mb-1 mt-1 text-2xl font-bold leading-tight">
              {anuncio.titulo}
            </h3>
            {anuncio.imagen_url && (
              <img
                src={anuncio.imagen_url}
                alt=""
                loading="lazy"
                className="mb-2 h-24 w-full rounded object-cover"
              />
            )}
            {anuncio.archivo_url && (
              <a
                href={anuncio.archivo_url}
                target="_blank"
                rel="noreferrer"
                className="mb-2 block rounded bg-rose-900 p-1.5 text-center text-xs font-bold text-rose-100"
              >
                📄 PDF
              </a>
            )}
            {tipo === "table" ? (
              <table className="mt-2 w-full border-collapse text-left text-sm">
                <tbody>
                  {filas.map((fila, indice) => (
                    <tr key={`${indice}-${fila}`} className="border-b border-blue-900/20 last:border-0">
                      <td className="px-1.5 py-1.5 align-top">
                        {indice === 0 ? <strong>{fila}</strong> : fila}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="font-handwriting line-clamp-6 whitespace-pre-wrap text-lg">{texto}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
