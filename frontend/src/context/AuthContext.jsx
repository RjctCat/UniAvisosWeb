import { useCallback, useEffect, useMemo, useState } from "react";
import AuthContext from "./auth";
import { api, getToken, removeToken, setToken } from "../lib/api";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(getToken()));
  const [mensajeSesion, setMensajeSesion] = useState("");

  const cargarPerfil = useCallback(async () => {
    const perfil = await api("/api/auth/me");
    setUsuario(perfil);
    return perfil;
  }, []);

  useEffect(() => {
    let activa = true;
    const token = getToken();

    if (!token) {
      return () => {
        activa = false;
      };
    }

    api("/api/auth/me")
      .then((perfil) => {
        if (activa) setUsuario(perfil);
      })
      .catch((error) => {
        let mensaje = "Tu sesión ya no es válida. Inicia sesión nuevamente.";
        try {
          removeToken();
        } catch (errorAlLimpiar) {
          mensaje = errorAlLimpiar.message;
        }
        if (activa) setMensajeSesion(mensaje || error.message);
      })
      .finally(() => {
        if (activa) setCargando(false);
      });

    return () => {
      activa = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (correo, password) => {
    const formulario = new URLSearchParams({ username: correo, password });
    const resultado = await api("/api/auth/login", {
      method: "POST",
      body: formulario,
    });

    setToken(resultado.access_token);
    try {
      await cargarPerfil();
      setMensajeSesion("");
    } catch (error) {
      removeToken();
      setUsuario(null);
      throw error;
    }
  }, [cargarPerfil]);

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    try {
      removeToken();
      setMensajeSesion("");
    } catch (error) {
      setMensajeSesion(error.message);
    }
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      mensajeSesion,
      iniciarSesion,
      cerrarSesion,
      cargarPerfil,
      puedePublicar: usuario?.rol === "publicador" || usuario?.rol === "administrador",
      esAdministrador: usuario?.rol === "administrador",
    }),
    [usuario, cargando, mensajeSesion, iniciarSesion, cerrarSesion, cargarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
