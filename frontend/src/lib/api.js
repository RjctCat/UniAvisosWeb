export const API = import.meta.env.VITE_API_URL;

export function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem("token", token);
  } catch {
    throw new Error("No se pudo guardar la sesión en este navegador");
  }
}

export function removeToken() {
  try {
    localStorage.removeItem("token");
  } catch {
    throw new Error("No se pudo cerrar la sesión en este navegador");
  }
}

export async function api(ruta, opciones = {}) {
  const token = getToken();
  const headers = { ...(opciones.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (
    opciones.body &&
    !(opciones.body instanceof FormData) &&
    !(opciones.body instanceof URLSearchParams) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${ruta}`, { ...opciones, headers });
  if (res.status === 204) return null;

  const datos = await res.json().catch(() => null);
  if (!res.ok) throw new Error(datos?.detail || "Error en la solicitud");
  return datos;
}