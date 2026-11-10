import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const PASO_ZOOM = 0.25;

function limitarZoom(valor) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor));
}

export default function ImagenAmpliada({ src, alt, onCerrar }) {
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 });
  const [dimensiones, setDimensiones] = useState(null);
  const arrastre = useRef(null);
  const zonaRef = useRef(null);

  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === "Escape") onCerrar();
      if (evento.key === "+" || evento.key === "=") {
        setZoom((actual) => limitarZoom(actual + PASO_ZOOM));
      }
      if (evento.key === "-") {
        setZoom((actual) => limitarZoom(actual - PASO_ZOOM));
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  useEffect(() => {
    const zona = zonaRef.current;
    if (!zona) return undefined;
    const alUsarRueda = (evento) => {
      evento.preventDefault();
      const nuevoZoom = limitarZoom(zoom + (evento.deltaY < 0 ? PASO_ZOOM : -PASO_ZOOM));
      setZoom(nuevoZoom);
      if (nuevoZoom === ZOOM_MIN) setDesplazamiento({ x: 0, y: 0 });
    };
    zona.addEventListener("wheel", alUsarRueda, { passive: false });
    return () => zona.removeEventListener("wheel", alUsarRueda);
  }, [zoom]);

  const cambiarZoom = (valor) => {
    setZoom(limitarZoom(valor));
    if (valor <= ZOOM_MIN) setDesplazamiento({ x: 0, y: 0 });
  };

  const alPulsar = (evento) => {
    if (zoom <= ZOOM_MIN || evento.button !== 0) return;
    arrastre.current = {
      x: evento.clientX - desplazamiento.x,
      y: evento.clientY - desplazamiento.y,
    };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  };

  const alMover = (evento) => {
    if (!arrastre.current) return;
    setDesplazamiento({
      x: evento.clientX - arrastre.current.x,
      y: evento.clientY - arrastre.current.y,
    });
  };

  const alSoltar = () => {
    arrastre.current = null;
  };

  return createPortal(
    <div
      className="app-image-viewer image-viewer fixed inset-0 z-[100000] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ampliada: ${alt}`}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{alt}</p>
          <p className="viewer-muted text-xs">
            {dimensiones ? `${dimensiones.ancho} × ${dimensiones.alto} px · ` : ""}
            Rueda del ratón para acercar · arrastra para moverte
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar imagen ampliada"
          className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Cerrar
        </button>
      </header>

      <div
        ref={zonaRef}
        className={`viewer-stage image-viewer-stage relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-8 ${
          zoom > ZOOM_MIN ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
        onPointerDown={alPulsar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onDoubleClick={() => cambiarZoom(zoom === ZOOM_MIN ? 2 : ZOOM_MIN)}
      >
        <img
          src={src}
          alt={alt}
          draggable="false"
          onLoad={(evento) =>
            setDimensiones({
              ancho: evento.currentTarget.naturalWidth,
              alto: evento.currentTarget.naturalHeight,
            })
          }
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px) scale(${zoom})`,
            transformOrigin: "center",
          }}
        />
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => cambiarZoom(zoom - PASO_ZOOM)}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Alejar imagen"
          className="h-10 w-10 rounded-lg border border-white/15 text-xl font-bold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-16 text-center text-sm font-semibold" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => cambiarZoom(zoom + PASO_ZOOM)}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Acercar imagen"
          className="h-10 w-10 rounded-lg border border-white/15 text-xl font-bold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(ZOOM_MIN);
            setDesplazamiento({ x: 0, y: 0 });
          }}
          className="ml-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10"
        >
          Ajustar
        </button>
        <button
          type="button"
          onClick={() => cambiarZoom(2)}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10"
        >
          200%
        </button>
      </footer>
    </div>,
    document.body
  );
}
