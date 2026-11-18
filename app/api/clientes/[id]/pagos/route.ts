import { revalidatePath } from "next/cache";
import { noEncontrado } from "@/lib/api/errores";
import { aPagoEntrada, esquemaPagoApi } from "@/lib/api/esquemas";
import { formatearPagoApi } from "@/lib/api/formato";
import {
  exigir,
  leerId,
  leerJson,
  responder,
  ruta,
  validar,
} from "@/lib/api/ruta";
import { obtenerCliente } from "@/lib/clientes/detalle";
import {
  exigirPagoRegistrado,
  obtenerPago,
  registrarPago,
} from "@/lib/cuentas/pagar";

type Params = { id: string };

// RF-C5 y regla 8: pago a cuenta; no supera la deuda y se graba con su crédito en una transacción.
export const POST = ruta<Params>({}, async ({ solicitud, usuario, params }) => {
  const clienteId = leerId(params.id);
  const cliente = await obtenerCliente(clienteId);

  if (!cliente) {
    throw noEncontrado("El cliente");
  }

  const cuerpo = validar(esquemaPagoApi, await leerJson(solicitud));
  const entrada = exigir(aPagoEntrada({ clienteId, entrada: cuerpo }));
  const { pagoId } = exigirPagoRegistrado(
    await registrarPago({ entrada, usuarioId: usuario.id }),
  );
  const pago = await obtenerPago(pagoId);

  if (!pago) {
    throw noEncontrado("El pago");
  }

  revalidatePath("/");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);

  return responder(formatearPagoApi(pago), 201);
});
