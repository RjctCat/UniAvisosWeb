import { useState } from "react";
import useAuth from "../../hooks/useAuth";
import LoginModal from "./LoginModal";
import PerfilModal from "./PerfilModal";

const ETIQUETAS_ROL = {
  estudiante: "Estudiante",
  publicador: "Publicador",
  administrador: "Administrador",
};

export default function AuthActions({ compacto = false, onLoginOpen }) {
  const { usuario, cargando, mensajeSesion, cerrarSesion } = useAuth();
  const [loginAbierto, setLoginAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-2 ${compacto ? "text-xs" : "text-sm"}`}>
        {cargando ? (
          <span className="text-slate-500" aria-live="polite">
            Verificando sesión…
          </span>
        ) : usuario ? (
          <>
            <span
              className={`max-w-28 truncate rounded-full px-2.5 py-1 font-bold sm:max-w-36 ${
                usuario.rol === "administrador"
                  ? "bg-violet-100 text-violet-800"
                  : usuario.rol === "publicador"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-sky-100 text-sky-800"
              }`}
            >
              {ETIQUETAS_ROL[usuario.rol] || usuario.rol}
            </span>
            <span className="hidden max-w-36 truncate font-semibold text-[var(--text-main)] md:inline">
              {usuario.nombre}
            </span>
            <button
              type="button"
              onClick={() => setPerfilAbierto(true)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 font-semibold text-[var(--text-main)] transition hover:bg-[var(--border-color)]"
            >
              Perfil
            </button>
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 font-semibold text-[var(--text-main)] transition hover:bg-[var(--border-color)]"
            >
              Salir
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => (onLoginOpen ? onLoginOpen() : setLoginAbierto(true))}
            className={`rounded-lg bg-sky-600 px-3.5 py-2 font-bold text-white shadow-sm transition hover:bg-sky-500 ${
              compacto ? "text-xs" : ""
            }`}
          >
            Iniciar sesión
          </button>
        )}
        {mensajeSesion && (
          <span role="status" className="hidden max-w-40 truncate text-xs text-red-700 md:inline">
            {mensajeSesion}
          </span>
        )}
      </div>
      <LoginModal abierto={loginAbierto} onCerrar={() => setLoginAbierto(false)} />
      {perfilAbierto && (
        <PerfilModal abierto onCerrar={() => setPerfilAbierto(false)} />
      )}
    </>
  );
}
