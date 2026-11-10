import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../lib/api";

const campo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
const archivoCampo =
  "block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:font-bold file:text-sky-800";

const ESTILOS = {
  note: { nombre: "Nota adhesiva", ayuda: "Un aviso con título y texto." },
  table: { nombre: "Tabla", ayuda: "Organiza la información en filas, una por línea." },
  poster: { nombre: "Cartel", ayuda: "Un diseño gráfico con imagen y texto breve." },
  image: { nombre: "Solo imagen", ayuda: "La imagen ocupa el espacio principal del anuncio." },
};

function fechaLocal(fecha = new Date()) {
  if (!fecha) return "";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";
  valor.setMinutes(valor.getMinutes() - valor.getTimezoneOffset());
  return valor.toISOString().slice(0, 16);
}

function prepararFormulario(anuncio) {
  if (!anuncio) {
    return {
      titulo: "",
      resumen: "",
      contenido: "",
      categoria_id: "",
      facultad: "",
      carrera: "",
      importancia: "normal",
      tipo: "note",
      fecha_publicacion: fechaLocal(),
      fecha_vencimiento: "",
    };
  }

  return {
    titulo: anuncio.titulo || "",
    resumen: anuncio.resumen || "",
    contenido: anuncio.tipo === "image" ? "" : anuncio.contenido || "",
    categoria_id: anuncio.categoria_id || "",
    facultad: anuncio.facultad || "",
    carrera: anuncio.carrera || "",
    importancia: anuncio.importancia || "normal",
    tipo: anuncio.tipo || "note",
    fecha_publicacion: fechaLocal(anuncio.fecha_publicacion),
    fecha_vencimiento: anuncio.fecha_vencimiento ? fechaLocal(anuncio.fecha_vencimiento) : "",
  };
}

export default function PublicarModal({
  categorias,
  anuncio = null,
  onCerrar,
  onPublicado,
}) {
  const [formulario, setFormulario] = useState(() => prepararFormulario(anuncio));
  const [imagen, setImagen] = useState(null);
  const [imagenVista, setImagenVista] = useState("");
  const imagenVistaRef = useRef("");
  const [pdf, setPdf] = useState(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [quitarPdf, setQuitarPdf] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const soloImagen = formulario.tipo === "image";
  const esCartel = formulario.tipo === "poster";

  const cambiar = (evento) => {
    const { name, value } = evento.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const subir = async (archivo, ruta) => {
    const datos = new FormData();
    datos.append("archivo", archivo);
    const resultado = await api(ruta, { method: "POST", body: datos });
    return resultado.url;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const datos = {
        ...formulario,
        contenido:
          soloImagen || (esCartel && !formulario.contenido.trim())
            ? formulario.resumen.trim() || formulario.titulo.trim()
            : formulario.contenido,
        fecha_publicacion: formulario.fecha_publicacion
          ? new Date(formulario.fecha_publicacion).toISOString()
          : null,
        fecha_vencimiento: formulario.fecha_vencimiento
          ? new Date(formulario.fecha_vencimiento).toISOString()
          : null,
      };

      if (imagen) datos.imagen_url = await subir(imagen, "/api/archivos/imagen");
      else if (quitarImagen) datos.imagen_url = null;
      else if (anuncio?.imagen_url) datos.imagen_url = anuncio.imagen_url;

      if (pdf) datos.archivo_url = await subir(pdf, "/api/archivos/pdf");
      else if (quitarPdf) datos.archivo_url = null;
      else if (anuncio?.archivo_url) datos.archivo_url = anuncio.archivo_url;

      const resultado = await api(
        anuncio ? `/api/anuncios/${anuncio.id}` : "/api/anuncios",
        {
          method: anuncio ? "PUT" : "POST",
          body: JSON.stringify(datos),
        }
      );
      onPublicado(resultado);
      onCerrar();
    } catch (e) {
      setError(e.message || "No se pudo guardar el anuncio.");
    } finally {
      setEnviando(false);
    }
  };

  const mostrarImagen = formulario.tipo === "note" || esCartel || soloImagen;
  const mostrarPdf = formulario.tipo === "note" || formulario.tipo === "table";
  const imagenRequerida = esCartel || soloImagen;
  const srcImagenVista =
    imagenVista || (quitarImagen ? "" : anuncio?.imagen_url || "");

  useEffect(() => () => {
    if (imagenVistaRef.current) URL.revokeObjectURL(imagenVistaRef.current);
  }, []);

  const seleccionarImagen = (archivo) => {
    if (imagenVistaRef.current) URL.revokeObjectURL(imagenVistaRef.current);
    imagenVistaRef.current = archivo ? URL.createObjectURL(archivo) : "";
    setImagenVista(imagenVistaRef.current);
    setImagen(archivo);
  };

  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === "Escape" && !enviando) onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [enviando, onCerrar]);

  return createPortal(
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="publicar-titulo"
        className="app-modal max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              {anuncio ? "Editar comunicado" : "Nuevo comunicado"}
            </p>
            <h2 id="publicar-titulo" className="text-2xl font-bold">
              {anuncio ? "Editar anuncio" : "Publicar anuncio"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar formulario"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
            Estilo del anuncio
            <select name="tipo" value={formulario.tipo} onChange={cambiar} className={campo}>
              {Object.entries(ESTILOS).map(([valor, estilo]) => (
                <option key={valor} value={valor}>
                  {estilo.nombre}
                </option>
              ))}
            </select>
            <span className="block text-xs font-normal text-slate-500">
              {ESTILOS[formulario.tipo]?.ayuda}
            </span>
          </label>

          <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
            {soloImagen ? "Título (texto alternativo de la imagen)" : "Título"}
            <input
              name="titulo"
              value={formulario.titulo}
              onChange={cambiar}
              minLength={3}
              maxLength={200}
              required
              className={campo}
            />
          </label>

          {!soloImagen && (
            <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
              {formulario.tipo === "table" ? "Encabezado de la tabla (opcional)" : esCartel ? "Texto breve (opcional)" : "Resumen (opcional)"}
              <input
                name="resumen"
                value={formulario.resumen}
                onChange={cambiar}
                maxLength={300}
                className={campo}
              />
            </label>
          )}

          {!soloImagen && (
            <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
              {formulario.tipo === "table" ? "Filas de información" : esCartel ? "Texto complementario" : "Contenido"}
              <textarea
                name="contenido"
                value={formulario.contenido}
                onChange={cambiar}
                required={!esCartel}
                rows={formulario.tipo === "table" ? 6 : 5}
                placeholder={
                  formulario.tipo === "table"
                    ? "Escribe cada fila en una línea"
                    : esCartel
                      ? "Agrega detalles solo si hacen falta"
                      : ""
                }
                className={campo}
              />
              {formulario.tipo === "table" && (
                <span className="block text-xs font-normal text-slate-500">
                  Cada línea se mostrará como una fila independiente.
                </span>
              )}
            </label>
          )}

          <label className="space-y-1.5 text-sm font-semibold">
            Categoría
            <select
              name="categoria_id"
              value={formulario.categoria_id}
              onChange={cambiar}
              required
              className={campo}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            Importancia
            <select
              name="importancia"
              value={formulario.importancia}
              onChange={cambiar}
              className={campo}
            >
              <option value="normal">Normal</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>

          {!soloImagen && (
            <>
              <label className="space-y-1.5 text-sm font-semibold">
                Facultad (opcional)
                <input name="facultad" value={formulario.facultad} onChange={cambiar} className={campo} />
              </label>
              <label className="space-y-1.5 text-sm font-semibold">
                Carrera (opcional)
                <input name="carrera" value={formulario.carrera} onChange={cambiar} className={campo} />
              </label>
            </>
          )}

          <label className="space-y-1.5 text-sm font-semibold">
            Fecha de publicación
            <input
              type="datetime-local"
              name="fecha_publicacion"
              value={formulario.fecha_publicacion}
              onChange={cambiar}
              required
              className={campo}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold">
            Vigente hasta (opcional)
            <input
              type="datetime-local"
              name="fecha_vencimiento"
              value={formulario.fecha_vencimiento}
              onChange={cambiar}
              className={campo}
            />
          </label>

          {mostrarImagen && (
            <div className="space-y-2 sm:col-span-2">
              <label className="block space-y-1.5 text-sm font-semibold">
                Imagen {imagenRequerida ? "(obligatoria)" : "(opcional)"} — JPEG, PNG o WebP; máx. 5 MB
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={imagenRequerida && !anuncio?.imagen_url}
                  onChange={(evento) => {
                    seleccionarImagen(evento.target.files?.[0] || null);
                    setQuitarImagen(false);
                  }}
                  className={archivoCampo}
                />
              </label>
              {srcImagenVista && (
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                  <div className="flex h-36 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-slate-200/60 p-2 sm:h-40">
                    <img
                      src={srcImagenVista}
                      alt={`Vista previa de ${formulario.titulo || "la imagen del anuncio"}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs sm:block sm:min-w-36">
                    <p className="app-modal-muted">
                      {imagen ? `Vista previa: ${imagen.name}` : "Imagen actual"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (imagen) seleccionarImagen(null);
                        else setQuitarImagen((valor) => !valor);
                      }}
                      className="font-semibold text-red-700 underline"
                    >
                      {imagen
                        ? "Descartar nueva imagen"
                        : quitarImagen
                          ? "Conservar imagen"
                          : "Quitar imagen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mostrarPdf && (
            <label className="space-y-1.5 text-sm font-semibold sm:col-span-2">
              Documento PDF (opcional; máx. 10 MB)
              <input
                type="file"
                accept="application/pdf"
                onChange={(evento) => {
                  setPdf(evento.target.files?.[0] || null);
                  setQuitarPdf(false);
                }}
                className={archivoCampo}
              />
              {anuncio?.archivo_url && (
                <span className="flex items-center gap-2 text-xs font-normal text-slate-500">
                  Documento PDF actual.
                  {!pdf && (
                    <button
                      type="button"
                      onClick={() => setQuitarPdf((valor) => !valor)}
                      className="font-semibold text-red-700 underline"
                    >
                      {quitarPdf ? "Conservar" : "Quitar"}
                    </button>
                  )}
                </span>
              )}
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || categorias.length === 0}
              className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Guardando…" : anuncio ? "Guardar cambios" : "Publicar anuncio"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
