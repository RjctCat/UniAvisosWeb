import { useEffect, useState } from "react";
import AnuncioCard from "./components/AnuncioCard";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [facultad, setFacultad] = useState("");
  const [carrera, setCarrera] = useState("");
  const [importancia, setImportancia] = useState("");

  // Categorías: se cargan una sola vez
  useEffect(() => {
    fetch(`${API}/api/categorias`)
      .then((res) => res.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  // Anuncios: se piden de nuevo cuando cambia un filtro
  useEffect(() => {
    const controlador = new AbortController();

    const espera = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (categoriaId) params.set("categoria_id", categoriaId);
      if (facultad) params.set("facultad", facultad);
      if (carrera) params.set("carrera", carrera);
      if (importancia) params.set("importancia", importancia);

      setCargando(true);
      fetch(`${API}/api/anuncios?${params}`, { signal: controlador.signal })
        .then((res) => {
          if (!res.ok) throw new Error("No se pudieron cargar los anuncios");
          return res.json();
        })
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
  }, [q, categoriaId, facultad, carrera, importancia]);

  const limpiar = () => {
    setQ("");
    setCategoriaId("");
    setFacultad("");
    setCarrera("");
    setImportancia("");
  };

  const campo = "rounded-lg border px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <h1 className="text-2xl font-bold">UniAvisos</h1>
          <p className="text-sm text-gray-500">
            Tu universidad, toda la información en un solo lugar.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className={`${campo} sm:col-span-2 lg:col-span-3`}
            placeholder="Buscar por título..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className={campo}
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

          <input
            className={campo}
            placeholder="Facultad"
            value={facultad}
            onChange={(e) => setFacultad(e.target.value)}
          />

          <input
            className={campo}
            placeholder="Carrera"
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
          />

          <select
            className={campo}
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
            className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-100"
          >
            Limpiar filtros
          </button>
        </section>

        {error && <p className="mb-4 text-red-600">{error}</p>}
        {cargando && <p className="text-gray-500">Cargando...</p>}
        {!cargando && !error && anuncios.length === 0 && (
          <p className="text-gray-500">No hay anuncios que coincidan.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {anuncios.map((a) => (
            <AnuncioCard key={a.id} anuncio={a} />
          ))}
        </div>
      </main>
    </div>
  );
}