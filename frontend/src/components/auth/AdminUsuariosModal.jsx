import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../lib/api";
import useAuth from "../../hooks/useAuth";

const ROLES = [
  ["estudiante", "Estudiante"],
  ["publicador", "Publicador"],
  ["administrador", "Administrador"],
];

export default function AdminUsuariosModal({ abierto, onCerrar }) {
  const { usuario, cargarPerfil } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [confirmacion, setConfirmacion] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    correo: "",
    password: "",
    rol: "publicador",
    facultad: "",
    carrera: "",
  });

  useEffect(() => {
    if (!abierto) return undefined;
    let activa = true;
    api("/api/usuarios")
      .then((lista) => {
        if (activa) setUsuarios(lista);
      })
      .catch((e) => {
        if (activa) setError(e.message || "No se pudo cargar la lista de usuarios.");
      })
      .finally(() => {
        if (activa) setCargando(false);
      });

    return () => {
      activa = false;
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (evento) => {
      if (evento.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const crearUsuario = async (evento) => {
    evento.preventDefault();
    setError("");
    setExito("");
    setEnviando(true);
    try {
      const datos = {
        ...nuevoUsuario,
        nombre: nuevoUsuario.nombre.trim(),
        correo: nuevoUsuario.correo.trim(),
        facultad: nuevoUsuario.facultad.trim() || null,
        carrera: nuevoUsuario.carrera.trim() || null,
      };
      const resultado = editando
        ? await api(`/api/usuarios/${editando.id}/admin`, {
            method: "PUT",
            body: JSON.stringify({
              ...datos,
              ...(datos.password ? {} : { password: null }),
            }),
          })
        : await api("/api/usuarios/admin", {
            method: "POST",
            body: JSON.stringify(datos),
          });
      setUsuarios((lista) => {
        const actualizados = editando
          ? lista.map((item) => item.id === resultado.id ? resultado : item)
          : [...lista, resultado];
        return actualizados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      });
      if (resultado.id === usuario.id) await cargarPerfil();
      const estabaEditando = Boolean(editando);
      setEditando(null);
      setNuevoUsuario({
        nombre: "",
        correo: "",
        password: "",
        rol: "publicador",
        facultad: "",
        carrera: "",
      });
      setMostrarPassword(false);
      setExito(estabaEditando ? `Se actualizaron los datos de ${resultado.nombre}.` : `Se registró a ${resultado.nombre} como ${resultado.rol}.`);
    } catch (e) {
      setError(e.message || (editando ? "No se pudo actualizar al usuario." : "No se pudo registrar al usuario."));
    } finally {
      setEnviando(false);
    }
  };

  const cambiarNuevoUsuario = (evento) => {
    const { name, value } = evento.target;
    setNuevoUsuario((actual) => ({ ...actual, [name]: value }));
  };

  const empezarEdicion = (item) => {
    setEditando(item);
    setNuevoUsuario({
      nombre: item.nombre,
      correo: item.correo,
      password: "",
      rol: item.rol,
      facultad: item.facultad || "",
      carrera: item.carrera || "",
    });
    setError("");
    setExito("");
    setMostrarPassword(false);
  };

  const eliminarUsuario = async () => {
    if (!eliminando || confirmacion !== eliminando.correo) return;
    setError("");
    setEnviando(true);
    try {
      await api(`/api/usuarios/${eliminando.id}`, { method: "DELETE" });
      setUsuarios((lista) => lista.filter((item) => item.id !== eliminando.id));
      setExito(`Se eliminó la cuenta de ${eliminando.nombre}.`);
      setEliminando(null);
      setConfirmacion("");
    } catch (e) {
      setError(e.message || "No se pudo eliminar al usuario.");
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="usuarios-titulo"
        className="app-modal max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              Administración
            </p>
            <h2 id="usuarios-titulo" className="text-2xl font-bold">
              Usuarios y roles
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar administración de usuarios"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <p className="app-modal-muted mb-5 text-sm">
          Registra cuentas con el rol correspondiente y administra los permisos existentes.
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {exito && (
          <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {exito}
          </p>
        )}

        <form onSubmit={crearUsuario} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 font-bold">{editando ? `Editar cuenta: ${editando.nombre}` : "Registrar cuenta"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">
              Nombre completo
              <input
                name="nombre"
                value={nuevoUsuario.nombre}
                onChange={cambiarNuevoUsuario}
                minLength={2}
                maxLength={150}
                required
                className="app-modal-field w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Correo electrónico
              <input
                name="correo"
                type="email"
                autoComplete="email"
                value={nuevoUsuario.correo}
                onChange={cambiarNuevoUsuario}
                maxLength={150}
                required
                className="app-modal-field w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              {editando ? "Nueva contraseña (opcional)" : "Contraseña (mínimo 8 caracteres)"}
              <span className="relative block">
                <input
                  name="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={nuevoUsuario.password}
                  onChange={cambiarNuevoUsuario}
                  minLength={8}
                  maxLength={72}
                  required={!editando}
                  className="app-modal-field w-full rounded-lg border px-3 py-2 pr-16 text-sm"
                  placeholder={editando ? "Dejar vacío para conservarla" : ""}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={mostrarPassword}
                  className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                >
                  {mostrarPassword ? "Ocultar" : "Ver"}
                </button>
              </span>
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Rol
              <select
                name="rol"
                value={nuevoUsuario.rol}
                onChange={cambiarNuevoUsuario}
                className="app-modal-field w-full rounded-lg border px-3 py-2 text-sm"
              >
                {ROLES.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Facultad (opcional)
              <input
                name="facultad"
                value={nuevoUsuario.facultad}
                onChange={cambiarNuevoUsuario}
                maxLength={150}
                className="app-modal-field w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Carrera (opcional)
              <input
                name="carrera"
                value={nuevoUsuario.carrera}
                onChange={cambiarNuevoUsuario}
                maxLength={150}
                className="app-modal-field w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {editando && (
              <button
                type="button"
                onClick={() => {
                  setEditando(null);
                  setMostrarPassword(false);
                  setNuevoUsuario({
                    nombre: "",
                    correo: "",
                    password: "",
                    rol: "publicador",
                    facultad: "",
                    carrera: "",
                  });
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
              >
                Cancelar edición
              </button>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-60"
            >
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Registrar usuario"}
            </button>
          </div>
        </form>

        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Cuentas registradas
        </h3>
        {cargando ? (
          <p className="py-8 text-center text-sm text-slate-500">Cargando usuarios…</p>
        ) : usuarios.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay usuarios registrados.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {usuarios.map((item) => (
              <div key={item.id} className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {item.nombre}
                      {item.id === usuario.id && (
                        <span className="ml-2 text-xs font-medium text-slate-500">(tú)</span>
                      )}
                    </p>
                    <p className="app-modal-muted truncate text-sm">{item.correo}</p>
                    <p className="app-modal-muted mt-1 text-xs">
                      {ROLES.find(([valor]) => valor === item.rol)?.[1] || item.rol}
                      {item.facultad ? ` · ${item.facultad}` : ""}
                      {item.carrera ? ` · ${item.carrera}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => empezarEdicion(item)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEliminando(item);
                        setConfirmacion("");
                        setError("");
                      }}
                      disabled={item.id === usuario.id}
                      title={item.id === usuario.id ? "No puedes eliminar tu propia cuenta" : "Eliminar cuenta"}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {eliminando?.id === item.id && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-900">
                      Escribe el correo de la cuenta para confirmar la eliminación. No se puede eliminar si tiene anuncios publicados.
                    </p>
                    <input
                      value={confirmacion}
                      onChange={(evento) => setConfirmacion(evento.target.value)}
                      aria-label={`Confirmación para eliminar a ${item.nombre}`}
                      className="app-modal-field mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEliminando(null);
                          setConfirmacion("");
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={eliminarUsuario}
                        disabled={enviando || confirmacion !== item.correo}
                        className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirmar eliminación
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}
