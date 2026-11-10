import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useAuth from "../../hooks/useAuth";

const campo =
  "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

export default function LoginModal({ abierto, onCerrar }) {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (evento) => {
      if (evento.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), password);
      setPassword("");
      onCerrar();
    } catch (e) {
      setError(e.message || "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="app-modal-overlay modal-overlay fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-titulo"
        className="app-modal max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              Acceso UniAvisos
            </p>
            <h2 id="login-titulo" className="text-2xl font-bold">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Ingresa con el correo y la contraseña de tu cuenta.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar inicio de sesión"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <label className="block space-y-1.5 text-sm font-medium">
            Correo electrónico
            <input
              type="email"
              name="correo"
              autoComplete="username"
              required
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              placeholder="nombre@universidad.edu"
              className={campo}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Contraseña
            <span className="relative block">
              <input
                type={mostrarPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                className={`${campo} pr-20`}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={mostrarPassword}
                className="absolute inset-y-0 right-2 my-auto rounded-md px-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                {mostrarPassword ? "Ocultar" : "Ver"}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
            >
              {enviando ? "Ingresando…" : "Ingresar"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
