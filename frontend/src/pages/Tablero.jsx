import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { acomodar, ALTO_TABLERO, ANCHO_TABLERO } from "../lib/layout";
import { ETIQUETAS_TEMPORADA } from "../lib/temporada";
import useBoard from "../hooks/useBoard";
import useTheme from "../hooks/useTheme";
import useAuth from "../hooks/useAuth";
import useTemporada from "../hooks/useTemporada";
import useVistaPreferida from "../hooks/useVistaPreferida";
import DetalleModal from "../components/tablero/DetalleModal";
import EfectoEstacional from "../components/tablero/EfectoEstacional";
import Filtros from "../components/tablero/Filtros";
import Nota from "../components/tablero/Nota";
import AuthActions from "../components/auth/AuthActions";
import LoginModal from "../components/auth/LoginModal";
import PublicarModal from "../components/auth/PublicarModal";
import AdminUsuariosModal from "../components/auth/AdminUsuariosModal";
import AdminCategoriasModal from "../components/auth/AdminCategoriasModal";
import ConfirmarEliminacion from "../components/auth/ConfirmarEliminacion";
import "../styles/tablero.css";

const FILTROS_VACIOS = {
  q: "",
  categoriaId: "",
  importancia: "",
  tipo: "",
};

const botonRedondo =
  "flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xl font-bold text-white shadow-lg hover:bg-slate-700";

export default function Tablero() {
  useVistaPreferida();
  const { tema, alternar } = useTheme();
  const { usuario, puedePublicar, esAdministrador } = useAuth();
  const [parametros] = useSearchParams();
  const { temporada, celebracion, siguiente, error: errorTemporada } = useTemporada();

  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    ...FILTROS_VACIOS,
    categoriaId: parametros.get("categoria") || "",
  });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loginAbierto, setLoginAbierto] = useState(false);
  const [publicarAbierto, setPublicarAbierto] = useState(false);
  const [anuncioEditando, setAnuncioEditando] = useState(null);
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [categoriasAbierto, setCategoriasAbierto] = useState(false);
  const [eliminarAnuncio, setEliminarAnuncio] = useState(null);
  const [animacionTemporada, setAnimacionTemporada] = useState(true);

  const { viewportRef, vista, moviendo, zoom, encajar, reiniciar, propsViewport } = useBoard();

  useEffect(() => {
    Promise.all([api("/api/anuncios?limit=100"), api("/api/categorias")])
      .then(([listaAnuncios, listaCategorias]) => {
        setAnuncios(listaAnuncios);
        setCategorias(listaCategorias);
      })
      .catch(() => setError("No se pudieron cargar los anuncios."))
      .finally(() => setCargando(false));
  }, []);

  // Las posiciones se calculan con TODOS los anuncios, así las notas
  // no cambian de lugar al filtrar.
  const posiciones = useMemo(() => acomodar(anuncios), [anuncios]);

  const visibles = useMemo(() => {
    const busqueda = filtros.q.trim().toLowerCase();
    return anuncios.filter((a) => {
      const texto = `${a.titulo} ${a.resumen ?? ""} ${a.contenido} ${a.facultad ?? ""} ${a.carrera ?? ""}`.toLowerCase();
      return (
        (!busqueda || texto.includes(busqueda)) &&
        (!filtros.categoriaId || a.categoria_id === filtros.categoriaId) &&
        (!filtros.importancia || a.importancia === filtros.importancia) &&
        (!filtros.tipo || a.tipo === filtros.tipo)
      );
    });
  }, [anuncios, filtros]);

  const cambiarFiltro = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const limpiarFiltros = () => setFiltros(FILTROS_VACIOS);

  const guardarAnuncio = (anuncio) => {
    setAnuncios((lista) => {
      const existe = lista.some((item) => item.id === anuncio.id);
      return existe
        ? lista.map((item) => (item.id === anuncio.id ? anuncio : item))
        : [anuncio, ...lista];
    });
    setAnuncioEditando(null);
    setPublicarAbierto(false);
  };

  const confirmarEliminacion = async (anuncio) => {
    await api(`/api/anuncios/${anuncio.id}`, { method: "DELETE" });
    setAnuncios((lista) => lista.filter((item) => item.id !== anuncio.id));
    setEliminarAnuncio(null);
    setSeleccionado(null);
  };

  const editarSeleccionado = (anuncio) => {
    setSeleccionado(null);
    setAnuncioEditando(anuncio);
  };

  const puedeGestionarSeleccionado = Boolean(
    seleccionado &&
      puedePublicar &&
      (esAdministrador || seleccionado.usuario_id === usuario?.id)
  );

  return (
    <div className="tablero-page">
      <EfectoEstacional
        temporada={temporada}
        celebracion={celebracion}
        animada={animacionTemporada}
      />

      <header className="app-header z-30 flex flex-wrap items-center justify-between border-b border-[var(--border-color)] px-4 py-2.5 shadow-md md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltrosAbiertos(true)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium md:hidden"
          >
            ☰ Filtros
          </button>
          <Link to="/" className="flex items-center gap-3" aria-label="UniAvisos, inicio">
            <img src="/logo.svg" alt="" className="h-10 w-10 flex-shrink-0" />
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              UniAvisos
              <span className="hidden rounded bg-sky-900 px-2 py-0.5 text-xs font-semibold text-sky-200 sm:inline">
                {usuario ? `Modo: ${usuario.rol}` : "Modo: Visitante"}
              </span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span
            className="max-w-[10rem] truncate rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[10px] font-medium sm:max-w-[14rem] lg:max-w-[26rem] lg:px-3 lg:text-xs"
            title={
              siguiente
                ?                 `Temporada ${ETIQUETAS_TEMPORADA[temporada]}${celebracion ? ` · ${celebracion.etiqueta}` : ""}. La próxima temporada comienza el ${siguiente.fecha} a las ${siguiente.hora}, hora de Bolivia.`
                : errorTemporada
                  ? errorTemporada
                  : "Consultando fecha astronómica oficial."
            }
            aria-live="polite"
          >
            {`Temporada ${ETIQUETAS_TEMPORADA[temporada]}${celebracion ? ` · ${celebracion.etiqueta}` : ""} · ${
              siguiente ? `${siguiente.fecha} ${siguiente.hora}` : errorTemporada ? "Fecha no disponible" : "Consultando fecha…"
            }`}
          </span>
          <button
                type="button"
                onClick={() => setAnimacionTemporada((activa) => !activa)}
                aria-pressed={animacionTemporada}
                aria-label={animacionTemporada ? "Pausar animación de temporada" : "Activar animación de temporada"}
                title={animacionTemporada ? "Pausar animación de temporada" : "Activar animación de temporada"}
                className="inline-flex rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1.5 text-[10px] font-medium sm:px-2.5 sm:text-xs"
          >
                <span aria-hidden="true">{animacionTemporada ? "❚❚" : "▶"}</span>
                <span className="hidden sm:inline">Animación</span>
          </button>
          <Link
            to="/lista"
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium"
          >
            Vista lista
          </Link>
          <Link
            to="/vista3d"
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium"
          >
            Vista 3D
          </Link>
          <button
            type="button"
            onClick={alternar}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium"
          >
            {tema === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"}
          </button>
          <AuthActions compacto onLoginOpen={() => setLoginAbierto(true)} />
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <Filtros
          filtros={filtros}
          onCambiar={cambiarFiltro}
          onLimpiar={limpiarFiltros}
          categorias={categorias}
          abierto={filtrosAbiertos}
          onCerrar={() => setFiltrosAbiertos(false)}
          autenticado={Boolean(usuario)}
          puedePublicar={puedePublicar}
          esAdministrador={esAdministrador}
          onPublicar={() => setPublicarAbierto(true)}
          onAdministrar={() => setAdminAbierto(true)}
          onAdministrarCategorias={() => setCategoriasAbierto(true)}
          onLogin={() => setLoginAbierto(true)}
        />

        <main
          ref={viewportRef}
          id="corkboard-container"
          className={`board-viewport select-none bg-[var(--bg-primary)] ${moviendo ? "is-panning" : ""}`}
          style={{ touchAction: "none" }}
          {...propsViewport}
        >
          <div
            id="corkboard"
            className="corkboard-bg board-grid"
            style={{
              width: ANCHO_TABLERO,
              height: ALTO_TABLERO,
              transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.escala})`,
            }}
          >
            {cargando && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-900/60">
                Cargando anuncios…
              </p>
            )}
            {error && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-bold text-red-900/70">
                {error}
              </p>
            )}
            {!cargando && !error && visibles.length === 0 && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-900/50">
                No hay anuncios visibles
              </p>
            )}

            {visibles.map((a) => (
              <Nota key={a.id} anuncio={a} posicion={posiciones.get(a.id)} onAbrir={setSeleccionado} />
            ))}
          </div>

          <div className="board-tools">
            <span
              className="rounded-lg bg-slate-900/90 px-2 py-2 text-xs font-semibold text-white"
              aria-live="polite"
            >
              {Math.round(vista.escala * 100)}%
            </span>
            <button type="button" onClick={() => zoom(-0.1)} aria-label="Alejar tablero" className={botonRedondo}>
              −
            </button>
            <button type="button" onClick={() => zoom(0.1)} aria-label="Acercar tablero" className={botonRedondo}>
              +
            </button>
            <button
              type="button"
              onClick={encajar}
              aria-label="Ajustar tablero completo a la pantalla"
              title="Ajustar tablero completo a la pantalla"
              className={`${botonRedondo} !text-sm`}
            >
              ⛶
            </button>
            <button
              type="button"
              onClick={reiniciar}
              aria-label="Restablecer vista del tablero"
              className={`${botonRedondo} !text-sm`}
            >
              ⟳
            </button>
          </div>
        </main>
      </div>

      <DetalleModal
        key={seleccionado?.id ?? "sin-seleccion"}
        anuncio={seleccionado}
        onCerrar={() => setSeleccionado(null)}
        puedeGestionar={puedeGestionarSeleccionado}
        onEditar={editarSeleccionado}
        onEliminar={setEliminarAnuncio}
      />
      {loginAbierto && <LoginModal abierto onCerrar={() => setLoginAbierto(false)} />}
      {(publicarAbierto || anuncioEditando) && (
        <PublicarModal
          categorias={categorias}
          anuncio={anuncioEditando}
          onCerrar={() => {
            setPublicarAbierto(false);
            setAnuncioEditando(null);
          }}
          onPublicado={guardarAnuncio}
        />
      )}
      {adminAbierto && (
        <AdminUsuariosModal abierto onCerrar={() => setAdminAbierto(false)} />
      )}
      {categoriasAbierto && (
        <AdminCategoriasModal
          categorias={categorias}
          onCerrar={() => setCategoriasAbierto(false)}
          onCambio={(categoria, accion) => {
            setCategorias((lista) => {
              const actualizadas = accion === "eliminada"
                ? lista.filter((item) => item.id !== categoria.id)
                : accion === "actualizada"
                  ? lista.map((item) => item.id === categoria.id ? categoria : item)
                  : [...lista, categoria];
              return actualizadas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
            });
          }}
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
