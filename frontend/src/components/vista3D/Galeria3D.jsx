import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { dibujarTarjeta, TARJETA_ANCHO } from "./dibujarTarjeta";

const POR_PAGINA = 6;
const TABLON_ANCHO = 15;
const TABLON_ALTO = 8.9;
const FOV = 42;
const LIMITE_ZOOM = [0.8, 2.2];
const COLUMNAS = [-4.5, 0, 4.5];
const FILAS = [1.58, -1.58];
const CELDA_ANCHO = 4.12;
const CELDA_ALTO = 2.76;

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function aspectoDe(anuncio, aspectosImagen) {
  const tipo = anuncio.tipo || "note";
  const aspectoImagen = aspectosImagen[anuncio.id];
  const aspectoTipo = {
    note: 0.88,
    table: 0.92,
    poster: 0.76,
    image: aspectoImagen || 1,
    default: 0.9,
  }[tipo] ?? 0.9;
  const aspecto = aspectoImagen && tipo !== "image"
    ? aspectoTipo * 0.62 + limitar(aspectoImagen, 0.55, 1.8) * 0.38
    : aspectoTipo;
  const texto = `${anuncio.titulo ?? ""} ${anuncio.resumen ?? anuncio.contenido ?? ""}`.trim();
  const ajusteTexto = limitar(1 - Math.max(0, texto.length - 120) / 900, 0.76, 1);
  return limitar(aspecto * ajusteTexto, 0.62, 1.52);
}

function crearMosaico(anuncios, aspectosImagen) {
  return anuncios.map((anuncio, indice) => {
    const aspecto = aspectoDe(anuncio, aspectosImagen);
    const ancho = Math.min(CELDA_ANCHO, CELDA_ALTO * aspecto);
    const alto = ancho / aspecto;
    const columna = indice % COLUMNAS.length;
    const fila = Math.floor(indice / COLUMNAS.length);
    return {
      posicion: [COLUMNAS[columna], FILAS[fila]],
      dimensiones: { ancho, alto, aspecto },
    };
  });
}

function texturaLienzo(dibujar, ancho = 1024, alto = 512) {
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  dibujar(lienzo.getContext("2d"), ancho, alto);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  return textura;
}

function crearTexturas(tema) {
  const oscuro = tema === "dark";
  const piedra = texturaLienzo((ctx, ancho, alto) => {
    const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
    fondo.addColorStop(0, oscuro ? "#14243a" : "#eaf2fc");
    fondo.addColorStop(1, oscuro ? "#23354d" : "#c8d9ed");
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);
    const altoPiedra = 88;
    for (let fila = 0; fila < Math.ceil(alto / altoPiedra); fila++) {
      const corrimiento = fila % 2 ? -84 : 0;
      for (let x = corrimiento - 140; x < ancho; x += 168) {
        const variacion = (fila * 7 + Math.floor((x + 140) / 168) * 3) % 25;
        const tono = oscuro ? 38 + variacion : 218 + variacion;
        ctx.fillStyle = oscuro
          ? `rgb(${tono}, ${tono + 10}, ${tono + 22})`
          : `rgb(${tono - 8}, ${tono}, ${Math.min(255, tono + 10)})`;
        ctx.fillRect(x + 3, fila * altoPiedra + 3, 162, altoPiedra - 6);
        ctx.fillStyle = oscuro ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.58)";
        ctx.fillRect(x + 8, fila * altoPiedra + 7, 150, 3);
      }
    }
    const sombra = ctx.createLinearGradient(0, 0, 0, alto);
    sombra.addColorStop(0, oscuro ? "rgba(0,0,0,0.18)" : "rgba(16,35,63,0.08)");
    sombra.addColorStop(0.5, "rgba(16,35,63,0)");
    sombra.addColorStop(1, oscuro ? "rgba(0,0,0,0.3)" : "rgba(16,35,63,0.12)");
    ctx.fillStyle = sombra;
    ctx.fillRect(0, 0, ancho, alto);
  });

  const madera = texturaLienzo((ctx, ancho, alto) => {
    const base = ctx.createLinearGradient(0, 0, ancho, alto);
    base.addColorStop(0, oscuro ? "#0b1728" : "#102c4d");
    base.addColorStop(0.5, oscuro ? "#14345a" : "#1769d2");
    base.addColorStop(1, oscuro ? "#10243d" : "#1056b0");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, ancho, alto);
    for (let y = 18; y < alto; y += 42) {
      ctx.fillStyle = y % 3 ? "rgba(8,33,66,0.18)" : "rgba(255,255,255,0.16)";
      ctx.fillRect(0, y, ancho, 3);
      for (let x = (y * 13) % 170; x < ancho; x += 230) {
        ctx.beginPath();
        ctx.ellipse(x, y + 9, 18, 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(8,33,66,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  });

  const corcho = texturaLienzo((ctx, ancho, alto) => {
    const base = ctx.createLinearGradient(0, 0, 0, alto);
    base.addColorStop(0, oscuro ? "#1e324d" : "#dcecff");
    base.addColorStop(1, oscuro ? "#14243a" : "#f5f8fc");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, ancho, alto);
    for (let i = 0; i < 2500; i++) {
      const x = (i * 197 + (i % 19) * 41) % ancho;
      const y = (i * 113 + (i % 23) * 29) % alto;
      const alpha = 0.025 + ((i * 7) % 10) / 100;
      ctx.fillStyle = i % 2 ? `rgba(23,105,210,${alpha})` : `rgba(16,35,63,${alpha})`;
      ctx.fillRect(x, y, 2 + (i % 4), 2 + (i % 3));
    }
  });

  const letrero = texturaLienzo((ctx, ancho, alto) => {
    ctx.fillStyle = "#102c4d";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.strokeStyle = "rgba(130,184,255,0.95)";
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, ancho - 32, alto - 32);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = '700 42px "Segoe UI", sans-serif';
    ctx.fillText("UNIAVISOS  ·  TABLERO UNIVERSITARIO", ancho / 2, alto / 2, ancho - 72);
  }, 1024, 160);

  return { piedra, madera, corcho, letrero };
}

function TablonUniversitario({ tema }) {
  const texturas = useMemo(() => crearTexturas(tema), [tema]);

  useEffect(
    () => () => Object.values(texturas).forEach((textura) => textura.dispose()),
    [texturas]
  );

  return (
    <group>
      <mesh position={[0, 0, -1.6]}>
        <planeGeometry args={[25, 16]} />
        <meshStandardMaterial map={texturas.piedra} roughness={0.96} />
      </mesh>

      <mesh position={[0, 0, -0.56]}>
        <boxGeometry args={[14.7, 7.9, 0.48]} />
        <meshStandardMaterial map={texturas.madera} roughness={0.5} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0, -0.29]}>
        <planeGeometry args={[13.5, 6.85]} />
        <meshStandardMaterial map={texturas.corcho} roughness={0.9} />
      </mesh>

      <mesh position={[0, 3.78, -0.05]}>
        <boxGeometry args={[14.55, 0.48, 0.66]} />
        <meshStandardMaterial map={texturas.madera} roughness={0.8} />
      </mesh>
      <mesh position={[0, -3.78, -0.05]}>
        <boxGeometry args={[14.55, 0.48, 0.66]} />
        <meshStandardMaterial map={texturas.madera} roughness={0.8} />
      </mesh>
      {[-7.05, 7.05].map((x) => (
        <mesh key={x} position={[x, 0, -0.05]}>
          <boxGeometry args={[0.48, 7.7, 0.66]} />
          <meshStandardMaterial map={texturas.madera} roughness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, 4.12, 0.02]}>
        <boxGeometry args={[5.55, 0.78, 0.32]} />
        <meshStandardMaterial map={texturas.madera} roughness={0.48} metalness={0.2} />
      </mesh>
      <mesh position={[0, 4.12, 0.2]}>
        <planeGeometry args={[5.18, 0.62]} />
        <meshBasicMaterial map={texturas.letrero} toneMapped={false} />
      </mesh>
      <mesh position={[0, -4.06, 0.02]}>
        <boxGeometry args={[14.7, 0.2, 0.88]} />
        <meshStandardMaterial map={texturas.madera} roughness={0.48} metalness={0.2} />
      </mesh>
      <mesh position={[0, 4.34, 0.04]}>
        <boxGeometry args={[14.9, 0.08, 0.9]} />
        <meshStandardMaterial color="#82b8ff" emissive="#1769d2" emissiveIntensity={0.45} metalness={0.58} roughness={0.28} />
      </mesh>

      {[-6.72, 6.72].map((x) =>
        [-3.45, 3.42].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.035, 16]} />
            <meshStandardMaterial color="#dcecff" metalness={0.72} roughness={0.22} />
          </mesh>
        ))
      )}
      <pointLight position={[-4, 5, 5]} intensity={150} distance={22} color="#bfdbfe" />
      <pointLight position={[5, 1, 4]} intensity={90} distance={18} color="#ffffff" />
    </group>
  );
}

function CameraRig({ zoom, foco }) {
  const { size } = useThree();
  const objetivoActual = useRef(new THREE.Vector3(0, 0, 0));
  const destino = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((estado, delta) => {
    const camera = estado.camera;
    const aspecto = Math.max(size.width / Math.max(size.height, 1), 0.3);
    const medioFov = THREE.MathUtils.degToRad(FOV / 2);
    const distanciaAlto = TABLON_ALTO / (2 * Math.tan(medioFov));
    const distanciaAncho = TABLON_ANCHO / (2 * Math.tan(medioFov) * aspecto);
    const distancia = Math.max(distanciaAlto, distanciaAncho) * 1.12 / zoom;

    destino.current.set(foco?.x ?? 0, foco?.y ?? 0, 0);
    const suavizado = 1 - Math.exp(-4.5 * delta);
    objetivoActual.current.lerp(destino.current, suavizado);

    const acercamiento = foco ? 0.63 : 1;
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      objetivoActual.current.x,
      4.5,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      objetivoActual.current.y,
      4.5,
      delta
    );
    camera.position.z = THREE.MathUtils.damp(camera.position.z, distancia * acercamiento, 4.5, delta);
    camera.lookAt(objetivoActual.current);
  });

  return null;
}

function useTextura(anuncio, aspecto, onAspectoCarga) {
  const lienzo = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = TARJETA_ANCHO;
    canvas.height = Math.round(TARJETA_ANCHO / aspecto);
    return canvas;
  }, [aspecto]);
  const texturaRef = useRef(null);
  const textura = useMemo(() => {
    const t = new THREE.CanvasTexture(lienzo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [lienzo]);

  useEffect(() => {
    texturaRef.current = textura;
    return () => {
      texturaRef.current = null;
      textura.dispose();
    };
  }, [textura]);

  useEffect(() => {
    let cancelado = false;
    let imagen = null;

    const pintar = () => {
      if (cancelado) return;
      dibujarTarjeta(lienzo, anuncio, imagen, aspecto);
      if (texturaRef.current) texturaRef.current.needsUpdate = true;
    };

    pintar();
    if (anuncio.imagen_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelado) return;
        imagen = img;
        if (img.naturalWidth && img.naturalHeight) {
          onAspectoCarga(anuncio.id, img.naturalWidth / img.naturalHeight);
        }
        pintar();
      };
      img.onerror = () => {
        imagen = null;
        pintar();
      };
      img.src = anuncio.imagen_url;
    }
    document.fonts?.ready.then(pintar);

    return () => {
      cancelado = true;
    };
  }, [anuncio, aspecto, lienzo, onAspectoCarga, textura]);

  return textura;
}

function Tarjeta({
  anuncio,
  posicion,
  dimensiones,
  aspecto,
  indice,
  activa,
  reducirMovimiento,
  onAbrir,
  onPrevisualizar,
  onAspectoCarga,
}) {
  const grupo = useRef(null);
  const inicioAnimacion = useRef(null);
  const textura = useTextura(anuncio, aspecto, onAspectoCarga);
  const [encima, setEncima] = useState(false);
  const entrada = indice * 0.09;
  const { ancho, alto } = dimensiones;

  useEffect(() => {
    if (!encima) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [encima]);

  useFrame((estado, delta) => {
    const g = grupo.current;
    if (!g) return;
    const tiempo = estado.clock.elapsedTime;
    if (inicioAnimacion.current == null) inicioAnimacion.current = tiempo;
    const transcurrido = tiempo - inicioAnimacion.current - entrada;
    const reboteEntrada =
      transcurrido < 0 ? 0.42 : 0.42 * Math.max(0, 1 - transcurrido / 0.45);
    const k = reducirMovimiento ? 40 : 5;

    g.position.x = THREE.MathUtils.damp(g.position.x, posicion[0], k, delta);
    g.position.y = THREE.MathUtils.damp(
      g.position.y,
      posicion[1] + (encima ? 0.12 : reboteEntrada),
      k,
      delta
    );
    g.position.z = THREE.MathUtils.damp(g.position.z, encima ? 0.34 : 0.12, k, delta);
    g.scale.setScalar(
      THREE.MathUtils.damp(g.scale.x, encima ? 1.12 : activa ? 1.02 : 1, k, delta)
    );
  });

  const alHacerClic = (evento) => {
    evento.stopPropagation();
    if (typeof evento.delta === "number" && evento.delta > 6) return;
    onAbrir(anuncio, posicion);
  };

  return (
    <group
      ref={grupo}
      position={[posicion[0], posicion[1] + 0.42, 0.12]}
      onClick={alHacerClic}
      onPointerOver={(evento) => {
        evento.stopPropagation();
        setEncima(true);
        onPrevisualizar({ anuncio, posicion });
      }}
      onPointerOut={() => {
        setEncima(false);
        onPrevisualizar(null);
      }}
    >
        <mesh position={[0.06, -0.07, 0.051]}>
          <planeGeometry args={[ancho + 0.3, alto + 0.3]} />
          <meshBasicMaterial color="#10233f" transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <RoundedBox args={[ancho + 0.08, alto + 0.08, 0.1]} radius={0.07} smoothness={4}>
          <meshStandardMaterial color="#ffffff" roughness={0.38} metalness={0.16} />
        </RoundedBox>
        <mesh position={[0, 0, 0.056]}>
          <planeGeometry args={[ancho, alto]} />
          <meshBasicMaterial map={textura} toneMapped={false} />
        </mesh>
        <mesh position={[0, alto / 2 - 0.1, 0.13]}>
          <sphereGeometry args={[0.074, 16, 12]} />
          <meshStandardMaterial
            color={anuncio.importancia === "urgente" ? "#d65b54" : "#1769d2"}
            metalness={0.55}
            roughness={0.32}
          />
      </mesh>
        <mesh position={[0, alto / 2 - 0.12, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.24, 8]} />
          <meshStandardMaterial color="#82b8ff" metalness={0.55} roughness={0.3} />
        </mesh>
      </group>
    );
}

export default function Galeria3D({ anuncios, onAbrir, anuncioSeleccionado, tema = "light" }) {
    const [pagina, setPagina] = useState(0);
    const [indiceActivo, setIndiceActivo] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [focoLocal, setFocoLocal] = useState(null);
    const [avisoEncima, setAvisoEncima] = useState(null);
    const [aspectosImagen, setAspectosImagen] = useState({});
    const temporizador = useRef(null);
    const totalPaginas = Math.max(1, Math.ceil(anuncios.length / POR_PAGINA));
    const inicio = pagina * POR_PAGINA;
    const visibles = anuncios.slice(inicio, inicio + POR_PAGINA);
    const mosaico = crearMosaico(visibles, aspectosImagen);
  const reducirMovimiento = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const limpiarTemporizador = useCallback(() => {
    if (temporizador.current) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  }, []);

  useEffect(() => limpiarTemporizador, [limpiarTemporizador]);

  const irAPagina = useCallback(
    (paso) => {
      limpiarTemporizador();
      setFocoLocal(null);
      setIndiceActivo(0);
      setPagina((actual) => Math.max(0, Math.min(totalPaginas - 1, actual + paso)));
    },
    [limpiarTemporizador, totalPaginas]
  );

  const moverAnuncio = useCallback(
    (paso) => {
      if (!anuncios.length) return;
      const actual = pagina * POR_PAGINA + indiceActivo;
      const siguiente = Math.max(0, Math.min(anuncios.length - 1, actual + paso));
      setFocoLocal(null);
      setPagina(Math.floor(siguiente / POR_PAGINA));
      setIndiceActivo(siguiente % POR_PAGINA);
    },
    [anuncios.length, indiceActivo, pagina]
  );

  const ajustarZoom = useCallback((cantidad) => {
    setZoom((actual) =>
      THREE.MathUtils.clamp(Number((actual + cantidad).toFixed(2)), ...LIMITE_ZOOM)
    );
  }, []);

  const alCargarAspecto = useCallback((id, aspecto) => {
    setAspectosImagen((actuales) => {
      if (Math.abs((actuales[id] ?? 0) - aspecto) < 0.01) return actuales;
      return { ...actuales, [id]: aspecto };
    });
  }, []);

  const alAbrirTarjeta = useCallback(
    (anuncio, posicion, indice) => {
      limpiarTemporizador();
      setIndiceActivo(indice);
      setFocoLocal({ id: anuncio.id, x: posicion[0], y: posicion[1] });
      temporizador.current = window.setTimeout(() => {
        onAbrir(anuncio);
        setFocoLocal(null);
        temporizador.current = null;
      }, reducirMovimiento ? 0 : 520);
    },
    [limpiarTemporizador, onAbrir, reducirMovimiento]
  );

  const indiceSeleccionado = anuncioSeleccionado
    ? visibles.findIndex((anuncio) => anuncio.id === anuncioSeleccionado.id)
    : -1;
  const focoSeleccionado =
    indiceSeleccionado >= 0 ? mosaico[indiceSeleccionado]?.posicion : null;
  const posicionEnfocada = focoSeleccionado ?? (focoLocal ? [focoLocal.x, focoLocal.y] : null);
  const foco = posicionEnfocada
    ? { x: posicionEnfocada[0], y: posicionEnfocada[1] }
    : null;
  const indicePrimero = anuncios.length ? inicio + 1 : 0;
  const indiceUltimo = Math.min(inicio + POR_PAGINA, anuncios.length);
  const boton =
    "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-blue-100/25 bg-[#102c4d]/90 text-xl text-white shadow-lg shadow-blue-950/20 backdrop-blur transition hover:border-blue-200/70 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-35";

  useEffect(() => {
    const alTeclear = (evento) => {
      const etiqueta = document.activeElement?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(etiqueta)) return;
      if (evento.key === "ArrowRight") moverAnuncio(1);
      if (evento.key === "ArrowLeft") moverAnuncio(-1);
      if (evento.key === "Enter" && visibles[indiceActivo]) {
        alAbrirTarjeta(visibles[indiceActivo], mosaico[indiceActivo].posicion, indiceActivo);
      }
      if (evento.key === "+" || evento.key === "=") ajustarZoom(0.15);
      if (evento.key === "-") ajustarZoom(-0.15);
      if (evento.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [ajustarZoom, alAbrirTarjeta, indiceActivo, moverAnuncio, mosaico, visibles]);

  const inicioX = useRef(null);
  const regionRef = useRef(null);
  const alPresionar = (evento) => {
    inicioX.current = evento.clientX;
  };
  const alSoltar = (evento) => {
    if (inicioX.current == null) return;
    const dx = evento.clientX - inicioX.current;
    inicioX.current = null;
    if (Math.abs(dx) > 65) irAPagina(dx < 0 ? 1 : -1);
  };

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return undefined;

    const alUsarRueda = (evento) => {
      evento.preventDefault();
      if (Math.abs(evento.deltaY) > 1) ajustarZoom(evento.deltaY < 0 ? 0.08 : -0.08);
    };

    region.addEventListener("wheel", alUsarRueda, { passive: false });
    return () => region.removeEventListener("wheel", alUsarRueda);
  }, [ajustarZoom]);

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Tablero universitario 3D de anuncios"
      tabIndex={0}
      onPointerDown={alPresionar}
      onPointerUp={alSoltar}
      onPointerCancel={() => (inicioX.current = null)}
      className={`relative h-full w-full touch-pan-y select-none overflow-hidden outline-none ${
        tema === "dark" ? "bg-[#0b1524]" : "bg-[#dcecff]"
      }`}
    >
      <Canvas
        camera={{ position: [0, 0, 16], fov: FOV }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[tema === "dark" ? "#0b1524" : "#dcecff"]} />
        <ambientLight intensity={0.9} color="#ffffff" />
        <directionalLight position={[-5, 7, 9]} intensity={2} color="#ffffff" />
        <directionalLight position={[6, 2, 5]} intensity={0.65} color="#bfdbfe" />
        <TablonUniversitario tema={tema} />
        <CameraRig zoom={zoom} foco={foco} />

        {visibles.map((anuncio, indice) => (
          <Tarjeta
            key={anuncio.id}
            anuncio={anuncio}
            posicion={mosaico[indice].posicion}
            dimensiones={mosaico[indice].dimensiones}
            aspecto={mosaico[indice].dimensiones.aspecto}
            indice={indice}
            activa={indice === indiceActivo}
            reducirMovimiento={reducirMovimiento}
            onAspectoCarga={alCargarAspecto}
            onPrevisualizar={setAvisoEncima}
            onAbrir={(anuncio, posicion) => alAbrirTarjeta(anuncio, posicion, indice)}
          />
        ))}
      </Canvas>

      {avisoEncima && (
        <aside
          aria-live="polite"
          className={`pointer-events-none absolute bottom-28 left-3 z-10 w-[min(27rem,calc(100%-1.5rem))] rounded-2xl border p-4 shadow-2xl shadow-blue-950/25 backdrop-blur-xl sm:bottom-28 sm:left-6 ${
            tema === "dark"
              ? "border-blue-200/20 bg-[#17263b]/95 text-slate-100"
              : "border-white/60 bg-white/95 text-[#10233f]"
          }`}
        >
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
              <span className={`rounded-full px-2 py-1 ${
                tema === "dark" ? "bg-blue-950 text-blue-200" : "bg-blue-100 text-blue-800"
              }`}>
                {avisoEncima.anuncio.categoria?.nombre || "General"}
              </span>
              <span className={`rounded-full px-2 py-1 ${
                tema === "dark" ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
              }`}>
                {avisoEncima.anuncio.importancia || "normal"}
              </span>
            </div>
            <h2 className="break-words text-base font-extrabold leading-snug sm:text-lg">
              {avisoEncima.anuncio.titulo}
            </h2>
            {(avisoEncima.anuncio.resumen || avisoEncima.anuncio.contenido) && (
              <p className={`mt-1 line-clamp-4 break-words text-sm leading-relaxed ${
                tema === "dark" ? "text-slate-300" : "text-slate-600"
              }`}>
                {avisoEncima.anuncio.resumen}
                {avisoEncima.anuncio.resumen &&
                  avisoEncima.anuncio.contenido !== avisoEncima.anuncio.resumen &&
                  avisoEncima.anuncio.tipo !== "image" &&
                  ` ${avisoEncima.anuncio.contenido || ""}`}
                {!avisoEncima.anuncio.resumen && avisoEncima.anuncio.contenido}
              </p>
            )}
            <p className={`mt-2 text-[10px] font-semibold ${
              tema === "dark" ? "text-blue-300" : "text-blue-700"
            }`}>
              Selecciona para abrir el anuncio completo
            </p>
          </div>
        </aside>
      )}

      <p className="sr-only" aria-live="polite">
        {anuncios.length
          ? `Anuncio ${inicio + indiceActivo + 1} de ${anuncios.length}. Usa las flechas para explorar, Enter para abrir y más o menos para acercar.`
          : "No hay anuncios para mostrar."}
      </p>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-wrap items-center justify-center gap-3 px-3 sm:bottom-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-blue-100/20 bg-[#102c4d]/90 p-2 text-white shadow-xl shadow-blue-950/25 backdrop-blur-lg">
          <button
            type="button"
            className={boton}
            onClick={() => irAPagina(-1)}
            disabled={pagina === 0}
            aria-label="Página anterior de anuncios"
          >
            ‹
          </button>
          <span className="min-w-28 px-1 text-center text-xs font-semibold text-white tabular-nums sm:min-w-36 sm:text-sm">
            {anuncios.length ? `${indicePrimero}–${indiceUltimo} / ${anuncios.length}` : "0 anuncios"}
          </span>
          <button
            type="button"
            className={boton}
            onClick={() => irAPagina(1)}
            disabled={pagina >= totalPaginas - 1}
            aria-label="Página siguiente de anuncios"
          >
            ›
          </button>
          <span className="mx-1 h-7 w-px bg-blue-100/25" aria-hidden="true" />
          <button
            type="button"
            className={boton}
            onClick={() => ajustarZoom(-0.2)}
            disabled={zoom <= LIMITE_ZOOM[0]}
            aria-label="Alejar tablero"
          >
            −
          </button>
          <button
            type="button"
            className={boton}
            onClick={() => ajustarZoom(0.2)}
            disabled={zoom >= LIMITE_ZOOM[1]}
            aria-label="Acercar tablero"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="pointer-events-auto rounded-xl px-2 py-2 text-[11px] font-bold text-blue-100 transition hover:bg-white/10 sm:px-3 sm:text-xs"
            aria-label="Restablecer zoom"
          >
            Restablecer
          </button>
        </div>
        <p className="w-full text-center text-[11px] font-medium text-[#10233f] drop-shadow sm:text-xs">
          Acerca con la rueda o los botones · Desliza para cambiar de página · Selecciona un aviso para ver sus detalles
        </p>
      </div>
    </div>
  );
}
