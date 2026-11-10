import { lazy, Suspense } from "react";

const Vista3D = lazy(() => import("../../pages/Vista3D"));

export default function Vista3DRoute() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Cargando vista 3D…</p>}>
      <Vista3D />
    </Suspense>
  );
}
