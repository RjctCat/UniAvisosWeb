import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import useReveal from "../hooks/useReveal";
import useTheme from "../hooks/useTheme";
import useTemporada from "../hooks/useTemporada";
import useVistaPreferida from "../hooks/useVistaPreferida";
import AuthActions from "../components/auth/AuthActions";
import EfectoEstacional from "../components/tablero/EfectoEstacional";
import { ETIQUETAS_TEMPORADA } from "../lib/temporada";
import "../styles/landing.css";

const textoImportancia = {
  normal: "Aviso",
  importante: "Aviso importante",
  urgente: "Aviso urgente",
};

function resumenDe(anuncio) {
  if (anuncio.resumen) return anuncio.resumen;
  const texto = anuncio.contenido || "";
  return texto.length > 140 ? `${texto.slice(0, 140)}…` : texto;
}

function claseAviso(anuncio) {
  if (anuncio.importancia === "urgente") return "urgent";
  if (anuncio.categoria?.nombre?.toLowerCase().includes("evento")) return "event";
  return "";
}

export default function Inicio() {
  const { tema, alternar } = useTheme();
  const { destino: destinoPreferido } = useVistaPreferida();
  const { temporada, celebracion, siguiente, error: errorTemporada } = useTemporada();
  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [animacionTemporada, setAnimacionTemporada] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/anuncios?limit=9"), api("/api/categorias")])
      .then(([listaAnuncios, listaCategorias]) => {
        setAnuncios(listaAnuncios);
        setCategorias(listaCategorias);
      })
      .catch(() => setError("No se pudieron cargar los anuncios por ahora."))
      .finally(() => setCargando(false));
  }, []);

  useReveal(anuncios.length + categorias.length);

  const destacados = anuncios.slice(0, 3);
  const recientes = anuncios.slice(3, 9);
  const resumenTemporada = `Temporada ${ETIQUETAS_TEMPORADA[temporada]}${
    celebracion ? ` · ${celebracion.etiqueta}` : ""
  }`;

  return (
    <div className="landing">
      <EfectoEstacional
        temporada={temporada}
        celebracion={celebracion}
        animada={animacionTemporada}
      />
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="UniAvisos, inicio">
            <img className="brand-logo" src="/logo.svg" alt="" />
            <span className="brand-name">
              Uni<span>Avisos</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#avisos">Avisos publicados</a>
            <a href="#categorias">Categorías</a>
            <a href="#acerca">Acerca de UniAvisos</a>
          </nav>
          <div className="header-actions">
            <span
              className="season-badge"
              title={
                siguiente
                  ? `${resumenTemporada}. La próxima estación comienza el ${siguiente.fecha} a las ${siguiente.hora}, hora de Bolivia.`
                  : errorTemporada
                    ? `${resumenTemporada}. ${errorTemporada}`
                    : resumenTemporada
              }
              aria-live="polite"
            >
              <span>{resumenTemporada}</span>
              {siguiente && <small>Próx. {siguiente.fecha}</small>}
            </span>
            <button
              className="header-control"
              type="button"
              onClick={() => setAnimacionTemporada((activa) => !activa)}
              aria-pressed={animacionTemporada}
              aria-label={animacionTemporada ? "Pausar animación de temporada" : "Activar animación de temporada"}
              title={animacionTemporada ? "Pausar animación de temporada" : "Activar animación de temporada"}
            >
              <span aria-hidden="true">{animacionTemporada ? "❚❚" : "▶"}</span>
              <span className="header-control-label">Animación</span>
            </button>
            <button
              className="header-control"
              type="button"
              onClick={alternar}
              aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              <span aria-hidden="true">{tema === "dark" ? "☀️" : "🌙"}</span>
              <span className="header-control-label">
                {tema === "dark" ? "Modo claro" : "Modo oscuro"}
              </span>
            </button>
            <Link className="header-action" to={destinoPreferido}>
              Ver anuncios <span className="arrow" aria-hidden="true"></span>
            </Link>
            <AuthActions compacto />
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-layout">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true"></span>
                Comunicados oficiales de la comunidad universitaria
              </div>
              <h1>
                Anuncios públicos <span>de tu universidad.</span>
              </h1>
              <p className="hero-copy">
                Mantente al tanto de convocatorias, eventos e información académica.
                Encuentra anuncios publicados por categoría y usa los filtros para
                consultar los avisos que te interesan.
              </p>
              <div className="hero-actions">
                <Link className="primary-action" to={destinoPreferido}>
                  Consultar anuncios <span className="arrow" aria-hidden="true"></span>
                </Link>
                <Link className="secondary-action" to="/lista">
                  Ver como lista
                </Link>
                <Link className="secondary-action" to="/vista3d">
                  Vista 3D
                </Link>
              </div>
              <p className="hero-note">
                Información institucional para estudiantes y comunidad universitaria.
              </p>
            </div>

            <div className="notice-stack" aria-label="Anuncios públicos destacados">
              <div className="public-label">En el tablero universitario</div>

              {cargando && <p className="hero-note">Cargando anuncios…</p>}
              {error && <p className="hero-note">{error}</p>}
              {!cargando && !error && destacados.length === 0 && (
                <p className="hero-note">Todavía no hay anuncios publicados.</p>
              )}

              {destacados.map((a) => (
                <article key={a.id} className={`notice-card ${claseAviso(a)}`}>
                  <div className="notice-meta">
                    <span className="notice-tag">{a.categoria?.nombre}</span>
                    {a.importancia !== "normal" && (
                      <span
                        className={`notice-tag ${a.importancia === "urgente" ? "priority" : ""}`}
                      >
                        {a.importancia === "urgente" ? "Urgente" : "Importante"}
                      </span>
                    )}
                  </div>
                  <h3>{a.titulo}</h3>
                  <p>{resumenDe(a)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="avisos">
          <div className="section-inner">
            <div className="section-heading reveal">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" aria-hidden="true"></span>
                  Información para la comunidad
                </div>
                <h2>Anuncios publicados</h2>
                <p className="section-subtitle">
                  Convocatorias, fechas académicas, actividades y comunicados
                  institucionales reunidos en un solo tablero.
                </p>
              </div>
              <Link className="text-link" to={destinoPreferido}>
                Consultar todos los anuncios <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="announcements">
              {(recientes.length > 0 ? recientes : destacados).map((a) => (
                <article key={a.id} className="announcement-card reveal">
                  <div className="notice-meta">
                    <span className="notice-tag">{a.categoria?.nombre}</span>
                    {a.importancia !== "normal" && (
                      <span
                        className={`notice-tag ${a.importancia === "urgente" ? "priority" : ""}`}
                      >
                        {a.importancia === "urgente" ? "Urgente" : "Importante"}
                      </span>
                    )}
                  </div>
                  <h3>{a.titulo}</h3>
                  <p>{resumenDe(a)}</p>
                  <div className="announcement-footer">
                    <span>{a.facultad || "Toda la universidad"}</span>
                    <span className={a.importancia === "urgente" ? "importance" : ""}>
                      {textoImportancia[a.importancia] ?? "Aviso"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section categories-section" id="categorias">
          <div className="section-inner">
            <div className="section-heading reveal">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" aria-hidden="true"></span>
                  Avisos organizados por tema
                </div>
                <h2>Busca por categorías</h2>
                <p className="section-subtitle">
                  Encuentra con facilidad la información pública que se relaciona con
                  tu vida universitaria.
                </p>
              </div>
              <Link className="text-link" to={destinoPreferido}>
                Explorar el tablero <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="category-list">
              {categorias.map((c) => (
                <Link
                  key={c.id}
                  className="category-card reveal"
                  to={`${destinoPreferido}?categoria=${c.id}`}
                >
                  <h3>{c.nombre}</h3>
                  <p>{c.descripcion}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="stay-informed" id="acerca">
          <div className="section-inner stay-inner">
            <div>
              <h2>Mantente al tanto de tu universidad</h2>
              <p>
                Revisa los anuncios publicados y consulta las novedades de tu
                comunidad universitaria.
              </p>
            </div>
            <Link className="primary-action" to={destinoPreferido}>
              Ir al tablero general <span className="arrow" aria-hidden="true"></span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Link className="brand" to="/" aria-label="UniAvisos, volver al inicio">
              <img className="brand-logo" src="/logo.svg" alt="" />
              <span className="brand-name">
                Uni<span>Avisos</span>
              </span>
            </Link>
            <p className="footer-note">Anuncios públicos de la comunidad universitaria.</p>
          </div>
          <nav className="footer-links" aria-label="Enlaces del pie de página">
            <Link to={destinoPreferido}>Anuncios publicados</Link>
            <a href="#categorias">Categorías</a>
            <a href="#acerca">Acerca de UniAvisos</a>
          </nav>
          <p className="footer-copy">© {new Date().getFullYear()} UniAvisos</p>
        </div>
      </footer>
    </div>
  );
}