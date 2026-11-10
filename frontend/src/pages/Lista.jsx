import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnuncioCard from "../components/AnuncioCard";
import AuthActions from "../components/auth/AuthActions";
import ConfirmarEliminacion from "../components/auth/ConfirmarEliminacion";
import PublicarModal from "../components/auth/PublicarModal";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";
import useVistaPreferida from "../hooks/useVistaPreferida";
import { api } from "../lib/api";
import "../styles/lista.css";

export default function Lista() {
  useVistaPreferida();
  const { usuario, puedePublicar, esAdministrador } = useAuth();
  const { tema, alternar } = useTheme();
  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [errorCategorias, setErrorCategorias] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [importancia, setImportancia] = useState("");
  const [misAnuncios, setMisAnuncios] = useState(false);
  const [anuncioEditando, setAnuncioEditando] = useState(null);
  const [eliminarAnuncio, setEliminarAnuncio] = useState(null);

  useEffect(() => {
    api("/api/categorias")
      .then(setCategorias)
      .catch((e) => setErrorCategorias(e.message || "No se pudieron cargar las categorías."));
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    const espera = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoriaId) params.set("categoria_id", categoriaId);
      if (importancia) params.set("importancia", importancia);
      params.set("limit", "100");
      if (misAnuncios) params.set("solo_vigentes", "false");

      setCargando(true);
      api(`/api/anuncios?${params}`, { signal: controlador.signal })
        .then((datos) => {
          setAnuncios(datos);
          setError("");
          setCargando(false);
        })
        .catch((e) => {
          if (e.name === "AbortError") return;
          setError(e.message);
          setCargando(false);
        });
    }, 300);

    return () => {
      clearTimeout(espera);
      controlador.abort();
    };
  }, [q, categoriaId, importancia, misAnuncios]);

  const limpiar = () => {
    setQ("");
    setCategoriaId("");
    setImportancia("");
  };

  const anunciosVisibles = misAnuncios
    ? anuncios.filter((anuncio) => anuncio.usuario_id === usuario?.id)
    : anuncios;

  const guardarAnuncio = (anuncio) => {
    setAnuncios((lista) => {
      const existe = lista.some((item) => item.id === anuncio.id);
      return existe
        ? lista.map((item) => (item.id === anuncio.id ? anuncio : item))
        : [anuncio, ...lista];
    });
    setAnuncioEditando(null);
  };

  const confirmarEliminacion = async (anuncio) => {
    await api(`/api/anuncios/${anuncio.id}`, { method: "DELETE" });
    setAnuncios((lista) => lista.filter((item) => item.id !== anuncio.id));
    setEliminarAnuncio(null);
  };

  const campo =
    "lista-field w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  return (
    <div className="lista-page flex h-dvh flex-col overflow-hidden">
      <header className="lista-header shrink-0 border-b shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="UniAvisos, inicio">
            <img src="/logo.svg" alt="" className="h-8 w-8 shrink-0" />
            <span className="truncate text-base font-extrabold tracking-tight sm:text-xl">
              Uni<span className="text-sky-600">Avisos</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Navegación principal">
            <Link
              to="/tablero"
              className="lista-nav-link rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
            >
              Tablero
            </Link>
            <Link
              to="/vista3d"
              className="lista-nav-link rounded-lg px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm"
            >
              3D
            </Link>
            <button
              type="button"
              onClick={alternar}
              aria-label={tema === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              title={tema === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              className="lista-theme-button rounded-lg border px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:py-2"
            >
              <span aria-hidden="true">{tema === "dark" ? "☀️" : "🌙"}</span>
              <span className="ml-1 hidden sm:inline">
                {tema === "dark" ? "Modo claro" : "Modo oscuro"}
              </span>
            </button>
            <AuthActions compacto />
          </nav>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
        <section className="lista-filters shrink-0 rounded-2xl border p-3 shadow-sm sm:p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700">
                Comunidad universitaria
              </p>
              <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                Anuncios publicados
              </h1>
              <p className="lista-muted mt-0.5 text-xs">
                Busca por título, facultad o carrera.
              </p>
            </div>
            <span className="lista-counter rounded-full px-3 py-1.5 text-xs font-bold" aria-live="polite">
              {cargando ? "Actualizando…" : `${anunciosVisibles.length} anuncios`}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="search"
              aria-label="Buscar anuncios"
              className={`${campo} sm:col-span-2 lg:col-span-2`}
              placeholder="Título, facultad o carrera..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className={campo}
              aria-label="Filtrar por categoría"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              className={campo}
              aria-label="Filtrar por importancia"
              value={importancia}
              onChange={(e) => setImportancia(e.target.value)}
            >
              <option value="">Toda importancia</option>
              <option value="normal">Normal</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>

            <button
              onClick={limpiar}
              type="button"
              className="lista-clear rounded-xl border px-3 py-2 text-sm font-semibold transition sm:col-span-2 lg:col-span-1"
            >
              Limpiar filtros
            </button>
          </div>
          <p className="lista-muted mt-2 text-[11px]">
            Para filtrar por facultad o carrera, escribe el nombre en el buscador.
          </p>
          {puedePublicar && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <p className="lista-muted text-xs">
                Administra tus publicaciones desde esta lista.
              </p>
              <button
                type="button"
                aria-pressed={misAnuncios}
                onClick={() => setMisAnuncios((actual) => !actual)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                  misAnuncios
                    ? "bg-sky-700 text-white hover:bg-sky-800"
                    : "border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                }`}
              >
                {misAnuncios ? "Ver todos los anuncios" : "Mis anuncios"}
              </button>
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {errorCategorias && (
          <p role="status" className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorCategorias}
          </p>
        )}

        <section
          className="lista-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          tabIndex={0}
          aria-label="Lista desplazable de anuncios"
        >
          {cargando && anuncios.length === 0 ? (
            <p className="lista-muted py-12 text-center text-sm font-medium">Cargando anuncios…</p>
          ) : !cargando && !error && anunciosVisibles.length === 0 ? (
            <div className="lista-empty rounded-2xl border border-dashed px-5 py-10 text-center">
              <p className="text-lg font-bold">
                {misAnuncios ? "Todavía no tienes anuncios publicados" : "No hay anuncios que coincidan"}
              </p>
              <p className="lista-muted mt-1 text-sm">
                {misAnuncios
                  ? "Tus publicaciones aparecerán aquí y podrás editarlas o eliminarlas."
                  : "Prueba con otros términos o limpia los filtros."}
              </p>
            </div>
          ) : (
            <div className="grid content-start gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-3">
              {anunciosVisibles.map((anuncio) => (
                <AnuncioCard
                  key={anuncio.id}
                  anuncio={anuncio}
                  puedeGestionar={Boolean(
                    puedePublicar &&
                      (esAdministrador || anuncio.usuario_id === usuario?.id)
                  )}
                  onEditar={setAnuncioEditando}
                  onEliminar={setEliminarAnuncio}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      {anuncioEditando && (
        <PublicarModal
          categorias={categorias}
          anuncio={anuncioEditando}
          onCerrar={() => setAnuncioEditando(null)}
          onPublicado={guardarAnuncio}
        />
      )}
      {eliminarAnuncio && (
        <ConfirmarEliminacion
          anuncio={eliminarAnuncio}
          onCancelar={() => setEliminarAnuncio(null)}
          onConfirmar={confirmarEliminacion}
        />
      )}
    </div>
  );
}