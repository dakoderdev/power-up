import { noEncontrado } from "@/lib/api/errores";
import { formatearPagoApi } from "@/lib/api/formato";
import { leerId, responder, ruta } from "@/lib/api/ruta";
import { obtenerPago } from "@/lib/cuentas/pagar";

type Params = { id: string };

// RF-C5: un pago, para reimprimir el recibo.
export const GET = ruta<Params>({}, async ({ params }) => {
  const pago = await obtenerPago(leerId(params.id));

  if (!pago) {
    throw noEncontrado("El pago");
  }

  return responder(formatearPagoApi(pago));
});
