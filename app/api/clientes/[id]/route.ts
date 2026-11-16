import { revalidatePath } from "next/cache";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { esquemaClientePatchApi, fusionarCliente } from "@/lib/api/esquemas";
import { formatearClienteApi, enCentavos, enIso } from "@/lib/api/formato";
import {
  exigir,
  leerId,
  leerJson,
  responder,
  ruta,
  validar,
} from "@/lib/api/ruta";
import { obtenerCliente, obtenerUltimasVentas } from "@/lib/clientes/detalle";
import { editarCliente } from "@/lib/clientes/guardar";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";
import { formatearComprobante } from "@/lib/ventas/comprobante";

type Params = { id: string };

// RF-C3: ficha del cliente con saldo y últimas facturas.
export const GET = ruta<Params>({}, async ({ params }) => {
  const id = leerId(params.id);
  const cliente = await obtenerCliente(id);

  if (!cliente) {
    throw noEncontrado("El cliente");
  }

  const [saldo, ultimas] = await Promise.all([
    obtenerSaldo({ consulta: db, clienteId: id }),
    obtenerUltimasVentas(id),
  ]);

  return responder({
    ...formatearClienteApi({ cliente, saldo }),
    ultimasFacturas: ultimas.map((venta) => ({
      id: venta.id,
      numeroFormateado: formatearComprobante(venta),
      fecha: enIso(venta.creadoEn),
      estado: venta.anuladaEn ? "anulada" : "emitida",
      total: enCentavos(venta.total),
      pago: { forma: venta.formaPago },
    })),
  });
});

// RF-C2: edición parcial del cliente.
export const PATCH = ruta<Params>({}, async ({ solicitud, params }) => {
  const id = leerId(params.id);
  const actual = await obtenerCliente(id);

  if (!actual) {
    throw noEncontrado("El cliente");
  }

  const cambios = validar(esquemaClientePatchApi, await leerJson(solicitud));
  const entrada = exigir(fusionarCliente({ actual, cambios }));
  const resultado = await editarCliente({ id, entrada });

  if (!resultado.guardado) {
    if (resultado.errores.documento) {
      throw new ApiError(
        409,
        "DOCUMENTO_DUPLICADO",
        resultado.errores.documento[0],
      );
    }

    throw noEncontrado("El cliente");
  }

  const editado = await obtenerCliente(id);

  if (!editado) {
    throw noEncontrado("El cliente");
  }

  const saldo = await obtenerSaldo({ consulta: db, clienteId: id });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);

  return responder(formatearClienteApi({ cliente: editado, saldo }));
});
