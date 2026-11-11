const IMPORTANCIAS = [
  ["", "Todas las importancias"],
  ["normal", "Normal"],
  ["importante", "Importante"],
  ["urgente", "Urgente"],
];

const TIPOS = [
  ["", "Todos los estilos"],
  ["note", "📝 Nota adhesiva"],
  ["table", "📋 Tabla"],
  ["poster", "🎨 Cartel"],
  ["image", "🖼️ Solo imagen"],
];

const campo =
  "mb-3 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-2 text-xs";

function Opcion({ activa, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium ${
        activa ? "bg-sky-600 text-white" : "hover:bg-[var(--border-color)]"
      }`}
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, opciones, valor, onElegir }) {
  return (
    <>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {titulo}
      </h2>
      <div className="mb-6 space-y-1.5">
        <Opcion activa={valor === ""} onClick={() => onElegir("")}>
          Todas
        </Opcion>
        {opciones.map((o) => (
          <Opcion key={o.valor} activa={valor === o.valor} onClick={() => onElegir(o.valor)}>
            {o.etiqueta}
          </Opcion>
        ))}
      </div>
    </>
  );
}

export default function Filtros({
  filtros,
  onCambiar,
  onLimpiar,
  categorias,
  abierto,
  onCerrar,
  autenticado,
  puedePublicar,
  esAdministrador,
  onPublicar,
  onAdministrar,
  onAdministrarCategorias,
  onLogin,
}) {
  return (
    <aside
      aria-label="Menú de opciones del tablero"
      className={`w-64 flex-col justify-between overflow-y-auto border-r border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xl ${
        abierto ? "fixed inset-y-0 left-0 z-[60] flex" : "hidden"
      } md:static md:z-20 md:flex`}
    >
      <div>
        <button
          type="button"
          onClick={onCerrar}
          className="mb-4 w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-bold md:hidden"
        >
          ✕ Cerrar menú
        </button>

        <Grupo
          titulo="Categorías"
          valor={filtros.categoriaId}
          onElegir={(v) => onCambiar("categoriaId", v)}
          opciones={categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
        />

        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Búsqueda y preferencias
        </h2>
        <input
          type="search"
          placeholder="Buscar..."
          aria-label="Buscar anuncios"
          value={filtros.q}
          onChange={(e) => onCambiar("q", e.target.value)}
          className={campo}
        />
        <p className="mb-3 -mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
          Busca por título, facultad o carrera escribiendo en este campo.
        </p>
        <select
          aria-label="Filtrar por importancia"
          value={filtros.importancia}
          onChange={(e) => onCambiar("importancia", e.target.value)}
          className={campo}
        >
          {IMPORTANCIAS.map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estilo"
          value={filtros.tipo}
          onChange={(e) => onCambiar("tipo", e.target.value)}
          className={campo}
        >
          {TIPOS.map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onLimpiar}
          className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium hover:bg-[var(--border-color)]"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="mt-6 space-y-2 border-t border-[var(--border-color)] pt-4">
        {puedePublicar ? (
          <button
            type="button"
            onClick={onPublicar}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-sky-500"
          >
            ✚ Publicar anuncio
          </button>
        ) : !autenticado ? (
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-600"
          >
            🔒 Iniciar sesión para publicar
          </button>
        ) : (
          <p className="rounded-lg bg-slate-100 px-3 py-2.5 text-center text-[11px] leading-relaxed text-slate-600">
            Tu cuenta de estudiante no tiene permisos para publicar anuncios.
          </p>
        )}
        {esAdministrador && (
          <>
            <button
              type="button"
              onClick={onAdministrar}
              className="w-full rounded-lg bg-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-violet-600"
            >
              ⚙️ Administrar usuarios
            </button>
            <button
              type="button"
              onClick={onAdministrarCategorias}
              className="w-full rounded-lg border border-violet-300 px-4 py-2.5 text-xs font-bold text-violet-800 transition hover:bg-violet-50"
            >
              ⚙️ Gestionar categorías
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
