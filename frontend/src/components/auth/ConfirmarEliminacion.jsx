import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmarEliminacion({ anuncio, onCancelar, onConfirmar }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === "Escape" && !eliminando) onCancelar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [eliminando, onCancelar]);

  const confirmar = async () => {
    setError("");
    setEliminando(true);
    try {
      await onConfirmar(anuncio);
    } catch (e) {
      setError(e.message || "No se pudo eliminar el anuncio.");
    } finally {
      setEliminando(false);
    }
  };

  return createPortal(
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !eliminando) onCancelar();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-eliminar-titulo"
        aria-describedby="confirmar-eliminar-descripcion"
        className="app-modal w-full max-w-md rounded-2xl border p-6 shadow-2xl"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-400">
          Acción permanente
        </p>
        <h2 id="confirmar-eliminar-titulo" className="text-xl font-bold">
          ¿Eliminar este anuncio?
        </h2>
        <p id="confirmar-eliminar-descripcion" className="app-modal-muted mt-3 text-sm leading-relaxed">
          Se eliminará <strong className="text-slate-900">{anuncio.titulo}</strong>. Esta acción no se puede deshacer.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            disabled={eliminando}
            className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={eliminando}
            className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
          >
            {eliminando ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
