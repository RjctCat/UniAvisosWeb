import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const RUTAS_VISTA = {
  tablero: "/tablero",
  lista: "/lista",
  "3d": "/vista3d",
};

function leerPreferencia() {
  try {
    const guardada = localStorage.getItem("vistaPreferida");
    return Object.hasOwn(RUTAS_VISTA, guardada) ? guardada : "tablero";
  } catch {
    return "tablero";
  }
}

export default function useVistaPreferida() {
  const { pathname } = useLocation();
  const actual = Object.entries(RUTAS_VISTA).find(([, ruta]) => ruta === pathname)?.[0];

  useEffect(() => {
    if (!actual) return;
    try {
      localStorage.setItem("vistaPreferida", actual);
    } catch {
      // La preferencia sigue activa durante esta sesión aunque el almacenamiento no esté disponible.
    }
  }, [actual]);

  const preferida = actual || leerPreferencia();
  return { preferida, destino: RUTAS_VISTA[preferida] };
}
