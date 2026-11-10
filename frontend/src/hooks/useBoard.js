import { useCallback, useEffect, useRef, useState } from "react";
import { ALTO_TABLERO, ANCHO_TABLERO } from "../lib/layout";

const ESCALA_MAX = 2;

function escalaMinima(rect) {
  return Math.max(
    0.08,
    Math.min(0.5, (rect.width / ANCHO_TABLERO) * 0.95, (rect.height / ALTO_TABLERO) * 0.95)
  );
}

// Zoom y desplazamiento del tablero (reemplaza a ui-common.js del diseño)
export default function useBoard() {
  const viewportRef = useRef(null);
  const arrastre = useRef(null);
  const [vista, setVista] = useState({ escala: 1, x: 0, y: 0 });
  const [moviendo, setMoviendo] = useState(false);

  // Acerca o aleja manteniendo fijo el punto bajo el cursor (o el centro)
  const zoom = useCallback((delta, clientX, clientY) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const py = (clientY ?? rect.top + rect.height / 2) - rect.top;

    setVista((v) => {
      const escala = Math.max(
        escalaMinima(rect),
        Math.min(ESCALA_MAX, +(v.escala + delta).toFixed(2))
      );
      const mundoX = (px - v.x) / v.escala;
      const mundoY = (py - v.y) / v.escala;
      return { escala, x: px - mundoX * escala, y: py - mundoY * escala };
    });
  }, []);

  // Rueda del ratón: zoom (dentro de una nota solo con Ctrl)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const alRodar = (evento) => {
      if (evento.target.closest(".board-item") && !evento.ctrlKey) return;
      evento.preventDefault();
      zoom(evento.deltaY < 0 ? 0.1 : -0.1, evento.clientX, evento.clientY);
    };

    el.addEventListener("wheel", alRodar, { passive: false });
    return () => el.removeEventListener("wheel", alRodar);
  }, [zoom]);

  const reiniciar = useCallback(() => setVista({ escala: 1, x: 0, y: 0 }), []);

  const encajar = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const escala = escalaMinima(rect);
    setVista({
      escala,
      x: (rect.width - ANCHO_TABLERO * escala) / 2,
      y: (rect.height - ALTO_TABLERO * escala) / 2,
    });
  }, []);

  const alPresionar = (evento) => {
    if (evento.target.closest(".board-tools")) return;
    const sobreNota = evento.target.closest(".board-item");
    // Sobre una nota solo se desplaza con botón central o derecho
    const permitido = sobreNota ? evento.button === 1 || evento.button === 2 : true;
    if (!permitido) return;

    arrastre.current = { dx: evento.clientX - vista.x, dy: evento.clientY - vista.y };
    setMoviendo(true);
    evento.currentTarget.setPointerCapture(evento.pointerId);
  };

  const alMover = (evento) => {
    const inicio = arrastre.current;
    if (!inicio) return;
    setVista((v) => ({ ...v, x: evento.clientX - inicio.dx, y: evento.clientY - inicio.dy }));
  };

  const alSoltar = () => {
    arrastre.current = null;
    setMoviendo(false);
  };

  return {
    viewportRef,
    vista,
    moviendo,
    zoom,
    encajar,
    reiniciar,
    propsViewport: {
      onPointerDown: alPresionar,
      onPointerMove: alMover,
      onPointerUp: alSoltar,
      onPointerCancel: alSoltar,
      onContextMenu: (evento) => evento.preventDefault(),
    },
  };
}
