import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Galeria3D from "../components/vista3D/Galeria3D";
import DetalleModal from "../components/tablero/DetalleModal";
import AuthActions from "../components/auth/AuthActions";
import ConfirmarEliminacion from "../components/auth/ConfirmarEliminacion";
import PublicarModal from "../components/auth/PublicarModal";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";
import useVistaPreferida from "../hooks/useVistaPreferida";
import { api } from "../lib/api";

function hayWebGL() {
  try {
    const lienzo = document.createElement("canvas");
    return Boolean(lienzo.getContext("webgl2") || lienzo.getContext("webgl"));
  } catch {
    return false;
  }
}

const campo =
  "rounded-xl border border-white/20 bg-[#102c4d]/90 px-3 py-2 text-xs text-white placeholder:text-blue-100/65 outline-none transition focus:border-blue-300";
const enlace =
  "rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-200/60 hover:bg-blue-400/20";

export default function Vista3D() {
  const [parametros] = useSearchParams();
  const { usuario, puedePublicar, esAdministrador } = useAuth();
  const { tema, alternar } = useTheme();
  useVistaPreferida();
  const [soportado] = useState(hayWebGL);

  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [categoriaId, setCategoriaId] = useState(parametros.get("categoria") || "");
  const [importancia, setImportancia] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [publicarAbierto, setPublicarAbierto] = useState(false);
  const [anuncioEditando, setAnuncioEditando] = useState(null);
  const [eliminarAnuncio, setEliminarAnuncio] = useState(null);

  const recargarAnuncios = useCallback(async () => {
    const lista = await api("/api/anuncios?limit=100");
    setAnuncios(lista);
    return lista;
  }, []);

  useEffect(() => {
    let activa = true;
    Promise.all([api("/api/anuncios?limit=100"), api("/api/categorias")])
      .then(([listaAnuncios, listaCategorias]) => {
        if (!activa) return;
        setAnuncios(listaAnuncios);
        setCategorias(listaCategorias);
      })
      .catch((e) => {
        if (activa) setError(e.message || "No se pudieron cargar los anuncios.");
      })
      .finally(() => {
        if (activa) setCargando(false);
      });
    return () => {
      activa = false;
    };
  }, [recargarAnuncios]);

  const visibles = useMemo(() => {
    const busqueda = q.trim().toLowerCase();
    return anuncios.filter((a) => {
      const texto = `${a.titulo} ${a.resumen ?? ""} ${a.contenido} ${a.facultad ?? ""} ${a.carrera ?? ""}`.toLowerCase();
      return (
        (!busqueda || texto.includes(busqueda)) &&
        (!categoriaId || a.categoria_id === categoriaId) &&
        (!importancia || a.importancia === importancia)
      );
    });
  }, [anuncios, q, categoriaId, importancia]);

  const guardarAnuncio = async (anuncio) => {
    setAnuncios((lista) => {
      const existe = lista.some((item) => item.id === anuncio.id);
      return existe
        ? lista.map((item) => (item.id === anuncio.id ? anuncio : item))
        : [anuncio, ...lista];
    });
    setAnuncioEditando(null);
    setPublicarAbierto(false);
    try {
      await recargarAnuncios();
      setError("");
    } catch (e) {
      setError(`El anuncio se guardó, pero no se pudo actualizar la lista: ${e.message}`);
    }
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

  const mensaje = cargando
    ? "Cargando anuncios…"
    : error || (visibles.length === 0 ? "No hay anuncios que coincidan." : "");

  return (
    <div className={`relative h-screen overflow-hidden text-white ${
      tema === "dark" ? "bg-[#0b1524]" : "bg-[#dcecff]"
    }`}>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-3 md:px-6">
        <div className="pointer-events-auto mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 rounded-2xl border border-white/20 bg-[#102c4d]/90 px-4 py-3 shadow-2xl shadow-blue-950/25 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3" aria-label="UniAvisos, inicio">
            <img src="/logo.svg" alt="" className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-tight text-white">UniAvisos</span>
            <span className="rounded-lg border border-blue-200/25 bg-blue-400/20 px-2 py-1 text-xs font-semibold text-blue-100">Vista 3D</span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <input
              type="search"
              placeholder="Buscar…"
              aria-label="Buscar anuncios"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={`${campo} w-36`}
            />
            <select
              aria-label="Filtrar por categoría"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={campo}
            >
              <option value="" className="text-slate-900">
                Todas las categorías
              </option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por importancia"
              value={importancia}
              onChange={(e) => setImportancia(e.target.value)}
              className={campo}
            >
              <option value="" className="text-slate-900">Toda importancia</option>
              <option value="normal" className="text-slate-900">Normal</option>
              <option value="importante" className="text-slate-900">Importante</option>
              <option value="urgente" className="text-slate-900">Urgente</option>
            </select>
            <Link to="/tablero" className={enlace}>
              Tablero
            </Link>
            <Link to="/lista" className={enlace}>
              Lista
            </Link>
            <button
              type="button"
              onClick={alternar}
              aria-label={tema === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              title={tema === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-blue-200/60 hover:bg-blue-400/20"
            >
              {tema === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
            </button>
            {puedePublicar && (
              <button
                type="button"
                onClick={() => setPublicarAbierto(true)}
                className="rounded-xl border border-blue-300/50 bg-gradient-to-r from-blue-600 to-blue-800 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-950/20 transition hover:from-blue-500 hover:to-blue-700"
              >
                Publicar anuncio
              </button>
            )}
            <AuthActions compacto />
          </div>
        </div>
      </header>

      <main className="absolute inset-0">
        {!soportado ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-md text-slate-300">
              Tu navegador o dispositivo no permite gráficos 3D (WebGL). Puedes ver los mismos anuncios en las otras
              vistas.
            </p>
            <div className="flex gap-3">
              <Link to="/tablero" className={enlace}>
                Ir al tablero
              </Link>
              <Link to="/lista" className={enlace}>
                Ir a la lista
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Galeria3D
              key={`${q}|${categoriaId}|${importancia}|${anuncios.length}`}
              anuncios={visibles}
              onAbrir={setSeleccionado}
              anuncioSeleccionado={seleccionado}
              tema={tema}
            />
            {mensaje && (
              <p
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-center text-lg font-semibold text-[#10233f] drop-shadow-lg"
                aria-live="polite"
              >
                {mensaje}
              </p>
            )}
          </>
        )}
      </main>

      <DetalleModal
        key={seleccionado?.id ?? "sin-seleccion"}
        anuncio={seleccionado}
        onCerrar={() => setSeleccionado(null)}
        puedeGestionar={puedeGestionarSeleccionado}
        onEditar={editarSeleccionado}
        onEliminar={setEliminarAnuncio}
      />
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
