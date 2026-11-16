import { responder, ruta } from "@/lib/api/ruta";
import { obtenerProximoNumero } from "@/lib/ventas/numeracion";

// RF-V1: próximo número, solo informativo; el real se asigna al confirmar (regla 4).
export const GET = ruta({}, async () => {
  return responder({ numeroFormateado: await obtenerProximoNumero() });
});
