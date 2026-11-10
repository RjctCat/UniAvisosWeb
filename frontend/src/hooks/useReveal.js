import { useEffect } from "react";

export default function useReveal(clave) {
  useEffect(() => {
    const items = document.querySelectorAll(".reveal:not(.is-visible)");

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("is-visible");
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((item) => observador.observe(item));
    return () => observador.disconnect();
  }, [clave]);
}