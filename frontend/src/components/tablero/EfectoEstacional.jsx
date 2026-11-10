import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { COLORES_TEMPORADA, SIMBOLOS_TEMPORADA } from "../../lib/temporada";

// En modo de movimiento reducido se muestran partículas estáticas, sin animación.
export default function EfectoEstacional({ temporada, celebracion, animada = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    const movimientoReducido = !animada;
    let ancho = window.innerWidth;
    let alto = window.innerHeight;

    const ajustar = () => {
      const escala = window.devicePixelRatio || 1;
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas.width = Math.round(ancho * escala);
      canvas.height = Math.round(alto * escala);
      contexto.setTransform(escala, 0, 0, escala, 0, 0);
    };
    ajustar();

    const particulas = Array.from({ length: 28 }, () => ({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      tam: Math.random() * 3 + 3,
      vel: Math.random() * 0.5 + 0.15,
      deriva: (Math.random() - 0.5) * 0.45,
      giro: Math.random() * Math.PI * 2,
      giroVel: (Math.random() - 0.5) * 0.012,
    }));

    let cuadro;
    const dibujar = () => {
      contexto.clearRect(0, 0, ancho, alto);
      contexto.fillStyle = celebracion?.color || COLORES_TEMPORADA[temporada];
      particulas.forEach((p) => {
        if (!movimientoReducido) {
          p.y += p.vel;
          p.x += p.deriva;
          p.giro += p.giroVel;
          if (p.y > alto) {
            p.y = -p.tam;
            p.x = Math.random() * ancho;
          }
        }
        contexto.save();
        contexto.translate(p.x, p.y);
        contexto.rotate(p.giro);
        contexto.font = `${p.tam * 3}px serif`;
        contexto.fillText(
          celebracion?.simbolo || SIMBOLOS_TEMPORADA[temporada],
          0,
          0
        );
        contexto.restore();
      });
      if (!movimientoReducido) cuadro = requestAnimationFrame(dibujar);
    };
    dibujar();

    window.addEventListener("resize", ajustar);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("resize", ajustar);
    };
  }, [temporada, celebracion, animada]);

  return createPortal(
    <canvas id="seasonal-canvas" ref={canvasRef} aria-hidden="true" />,
    document.body
  );
}
