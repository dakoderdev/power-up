import { revalidatePath } from "next/cache";
import { ApiError, detallesDeCampos, noEncontrado } from "@/lib/api/errores";
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
import { obtenerPago, registrarPago } from "@/lib/cuentas/pagar";

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
  const resultado = await registrarPago({ entrada, usuarioId: usuario.id });

  if (!resultado.registrado) {
    throw new ApiError(
      422,
      "PAGO_SUPERA_DEUDA",
      resultado.errores.importe?.[0] ??
        "El pago no puede superar el saldo adeudado.",
      detallesDeCampos(resultado.errores),
    );
  }

  const pago = await obtenerPago(resultado.pagoId);

  if (!pago) {
    throw noEncontrado("El pago");
  }

  revalidatePath("/");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);

  return responder(formatearPagoApi(pago), 201);
});
