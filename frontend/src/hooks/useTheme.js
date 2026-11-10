import { useEffect, useState } from "react";

export default function useTheme() {
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem("tema") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    try {
      localStorage.setItem("tema", tema);
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [tema]);

  const alternar = () => setTema((t) => (t === "dark" ? "light" : "dark"));
  return { tema, alternar };
}