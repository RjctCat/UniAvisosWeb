import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../lib/api";

const campo =
  "app-modal-field w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const FORMULARIO_VACIO = { nombre: "", descripcion: "" };

export default function AdminCategoriasModal({ categorias, onCerrar, onCambio }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === "Escape" && !enviando) onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [enviando, onCerrar]);

  const cambiar = (evento) => {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const empezarEdicion = (categoria) => {
    setEditando(categoria);
    setFormulario({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    setError("");
    setExito("");
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setError("");
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setError("");
    setExito("");
    setEnviando(true);
    try {
      const datos = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || null,
      };
      const categoria = await api(
        editando ? `/api/categorias/${editando.id}` : "/api/categorias",
        {
          method: editando ? "PUT" : "POST",
          body: JSON.stringify(datos),
        }
      );
      onCambio(categoria, editando ? "actualizada" : "creada");
      setFormulario(FORMULARIO_VACIO);
      setEditando(null);
      setExito(editando ? "Categoría actualizada." : "Categoría creada.");
    } catch (e) {
      setError(e.message || "No se pudo guardar la categoría.");
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async () => {
    if (!eliminando) return;
    setError("");
    setEnviando(true);
    try {
      await api(`/api/categorias/${eliminando.id}`, { method: "DELETE" });
      onCambio(eliminando, "eliminada");
      setExito(`Se eliminó la categoría «${eliminando.nombre}».`);
      setEliminando(null);
      if (editando?.id === eliminando.id) cancelarEdicion();
    } catch (e) {
      setError(e.message || "No se pudo eliminar la categoría.");
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !enviando) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="categorias-titulo"
        className="app-modal max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              Administración
            </p>
            <h2 id="categorias-titulo" className="text-2xl font-bold">
              Gestionar categorías
            </h2>
            <p className="app-modal-muted mt-1 text-sm">
              Crea, edita o elimina las categorías de los anuncios.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar categorías"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={guardar} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 font-bold">{editando ? "Editar categoría" : "Crear categoría"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-semibold">
              Nombre
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={cambiar}
                minLength={2}
                maxLength={100}
                required
                className={campo}
              />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              Descripción (opcional)
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={cambiar}
                rows={2}
                className={campo}
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {exito && (
            <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {exito}
            </p>
          )}

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {editando && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
              >
                Cancelar edición
              </button>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-60"
            >
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Categorías registradas ({categorias.length})
          </h3>
          {categorias.length ? (
            <ul className="divide-y divide-slate-100">
              {categorias.map((categoria) => (
                <li key={categoria.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{categoria.nombre}</p>
                    <p className="app-modal-muted break-words text-xs">
                      {categoria.descripcion || "Sin descripción"}
                    </p>
                  </div>
                  {eliminando?.id === categoria.id ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-red-700">¿Eliminar? Solo si no tiene anuncios.</span>
                      <button
                        type="button"
                        onClick={eliminar}
                        disabled={enviando}
                        className="rounded-lg bg-red-700 px-3 py-2 font-bold text-white disabled:opacity-60"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEliminando(null)}
                        disabled={enviando}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => empezarEdicion(categoria)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setEliminando(categoria);
                        }}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="app-modal-muted py-6 text-center text-sm">Aún no hay categorías.</p>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
