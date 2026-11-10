import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import Inicio from "./pages/Inicio";
import Lista from "./pages/Lista";
import Tablero from "./pages/Tablero";
import Vista3DRoute from "./components/vista3D/Vista3DRoute";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/tablero" element={<Tablero />} />
          <Route path="/lista" element={<Lista />} />
          <Route path="/vista3d" element={<Vista3DRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
