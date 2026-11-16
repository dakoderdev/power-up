import { formatearTableroApi } from "@/lib/api/formato";
import { responder, ruta } from "@/lib/api/ruta";
import { obtenerTablero } from "@/lib/inicio/tablero";

// RF-T1 a RF-T3: todo lo que muestra la pantalla de inicio, en una respuesta.
export const GET = ruta({}, async () => {
  return responder(formatearTableroApi(await obtenerTablero()));
});
