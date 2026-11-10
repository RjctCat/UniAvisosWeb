import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useAuth from "../../hooks/useAuth";
import { api } from "../../lib/api";

const ROLES = {
  estudiante: "Estudiante",
  publicador: "Publicador",
  administrador: "Administrador",
};

const campo =
  "app-modal-field w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

function fechaRegistro(fecha) {
  if (!fecha) return "No disponible";
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? "No disponible"
    : valor.toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric" });
}

export default function PerfilModal({ abierto, onCerrar }) {
  const { usuario, cargarPerfil } = useAuth();
  const [perfil, setPerfil] = useState(() => ({
    nombre: usuario?.nombre || "",
    correo: usuario?.correo || "",
    facultad: usuario?.facultad || "",
    carrera: usuario?.carrera || "",
  }));
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (evento) => {
      if (evento.key === "Escape" && !guardandoPerfil && !guardandoPassword) onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, guardandoPassword, guardandoPerfil, onCerrar]);

  if (!abierto || !usuario) return null;

  const cambiarPerfil = (evento) => {
    const { name, value } = evento.target;
    setPerfil((actual) => ({ ...actual, [name]: value }));
  };

  const guardarPerfil = async (evento) => {
    evento.preventDefault();
    if (!perfil) return;
    setErrorPerfil("");
    setMensajePerfil("");
    setGuardandoPerfil(true);
    try {
      await api(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: perfil.nombre.trim(),
          correo: perfil.correo.trim(),
          facultad: perfil.facultad.trim() || null,
          carrera: perfil.carrera.trim() || null,
        }),
      });
      await cargarPerfil();
      setMensajePerfil("Tu perfil se actualizó.");
    } catch (e) {
      setErrorPerfil(e.message || "No se pudo actualizar el perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPassword = async (evento) => {
    evento.preventDefault();
    setErrorPassword("");
    setMensajePassword("");
    if (passwordNueva.length < 8) {
      setErrorPassword("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setGuardandoPassword(true);
    try {
      await api(`/api/usuarios/${usuario.id}/password`, {
        method: "PUT",
        body: JSON.stringify({
          password_actual: passwordActual,
          password_nueva: passwordNueva,
        }),
      });
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordVisible(false);
      setMensajePassword("Tu contraseña se cambió correctamente.");
    } catch (e) {
      setErrorPassword(e.message || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  };

  return createPortal(
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(evento) => {
        if (
          evento.target === evento.currentTarget &&
          !guardandoPerfil &&
          !guardandoPassword
        ) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-titulo"
        className="app-modal max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-7"
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              Mi cuenta
            </p>
            <h2 id="perfil-titulo" className="text-2xl font-bold">Perfil personal</h2>
            <p className="app-modal-muted mt-1 text-sm">
              Consulta y actualiza tus datos y tu contraseña.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar perfil"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </header>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg font-extrabold text-blue-800">
            {usuario.nombre.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{usuario.nombre}</p>
            <p className="app-modal-muted truncate text-sm">{usuario.correo}</p>
          </div>
          <span className="ml-auto rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
            {ROLES[usuario.rol] || usuario.rol}
          </span>
          <p className="app-modal-muted w-full text-xs">
            Cuenta desde {fechaRegistro(usuario.creado_en)}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <form
            onSubmit={guardarPerfil}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="mb-3 font-bold">Datos personales</h3>
            <div className="space-y-3">
              <label className="block space-y-1.5 text-sm font-semibold">
                Nombre
                <input
                  name="nombre"
                  value={perfil.nombre}
                  onChange={cambiarPerfil}
                  minLength={2}
                  maxLength={150}
                  required
                  className={campo}
                />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                Correo
                <input
                  name="correo"
                  type="email"
                  value={perfil.correo}
                  onChange={cambiarPerfil}
                  maxLength={150}
                  required
                  className={campo}
                />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                Facultad (opcional)
                <input
                  name="facultad"
                  value={perfil.facultad}
                  onChange={cambiarPerfil}
                  maxLength={150}
                  className={campo}
                />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                Carrera (opcional)
                <input
                  name="carrera"
                  value={perfil.carrera}
                  onChange={cambiarPerfil}
                  maxLength={150}
                  className={campo}
                />
              </label>
            </div>
            {errorPerfil && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {errorPerfil}
              </p>
            )}
            {mensajePerfil && (
              <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {mensajePerfil}
              </p>
            )}
            <button
              type="submit"
              disabled={guardandoPerfil}
              className="mt-3 rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              {guardandoPerfil ? "Guardando…" : "Guardar perfil"}
            </button>
          </form>

          <form
            onSubmit={cambiarPassword}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="mb-1 font-bold">Cambiar contraseña</h3>
            <p className="app-modal-muted mb-3 text-xs">
              Por seguridad, confirma tu contraseña actual. La contraseña existente no se puede consultar.
            </p>
            <div className="space-y-3">
              {[
                ["passwordActual", "Contraseña actual", passwordActual, setPasswordActual],
                ["passwordNueva", "Nueva contraseña (mín. 8 caracteres)", passwordNueva, setPasswordNueva],
              ].map(([nombre, etiqueta, valor, setValor]) => (
                <label key={nombre} className="block space-y-1.5 text-sm font-semibold">
                  {etiqueta}
                  <span className="relative block">
                    <input
                      name={nombre}
                      type={passwordVisible ? "text" : "password"}
                      autoComplete={nombre === "passwordActual" ? "current-password" : "new-password"}
                      value={valor}
                      onChange={(evento) => setValor(evento.target.value)}
                      minLength={nombre === "passwordNueva" ? 8 : undefined}
                      maxLength={72}
                      required
                      className={`${campo} pr-20`}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      aria-label={passwordVisible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                      aria-pressed={passwordVisible}
                      className="absolute inset-y-0 right-2 my-auto rounded-md px-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                    >
                      {passwordVisible ? "Ocultar" : "Ver"}
                    </button>
                  </span>
                </label>
              ))}
            </div>
            {errorPassword && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {errorPassword}
              </p>
            )}
            {mensajePassword && (
              <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {mensajePassword}
              </p>
            )}
            <button
              type="submit"
              disabled={guardandoPassword}
              className="mt-3 rounded-lg border border-sky-700 px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50 disabled:opacity-60"
            >
              {guardandoPassword ? "Actualizando…" : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </section>
    </div>,
    document.body
  );
}
