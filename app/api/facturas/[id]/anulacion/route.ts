import { revalidatePath } from "next/cache";
import { ApiError, noEncontrado } from "@/lib/api/errores";
import { aAnulacion, esquemaAnulacionApi } from "@/lib/api/esquemas";
import { formatearFacturaApi } from "@/lib/api/formato";
import {
  exigir,
  leerId,
  leerJson,
  responder,
  ruta,
  validar,
} from "@/lib/api/ruta";
import { anularVenta, type CodigoErrorAnulacion } from "@/lib/ventas/anular";
import { obtenerVenta } from "@/lib/ventas/detalle";

type Params = { id: string };

const ESTADO_POR_CODIGO: Record<CodigoErrorAnulacion, number> = {
  NO_ENCONTRADO: 404,
  FACTURA_ANULADA: 409,
  SALDO_INSUFICIENTE: 422,
};

// RF-V9: anulación con motivo; reingresa stock y acredita la cuenta (admin).
export const POST = ruta<Params>(
  { admin: true },
  async ({ solicitud, usuario, params }) => {
    const id = leerId(params.id);
    const { motivo } = validar(esquemaAnulacionApi, await leerJson(solicitud));
    const anulacion = exigir(aAnulacion({ id, motivo }));
    const resultado = await anularVenta({
      ventaId: anulacion.id,
      motivo: anulacion.motivoAnulacion,
      usuarioId: usuario.id,
    });

    if (!resultado.anulada) {
      throw new ApiError(
        ESTADO_POR_CODIGO[resultado.codigo],
        resultado.codigo,
        resultado.mensaje,
      );
    }

    const venta = await obtenerVenta(id);

    if (!venta) {
      throw noEncontrado("La factura");
    }

    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath(`/ventas/${id}`);
    revalidatePath("/productos");
    revalidatePath("/stock");
    revalidatePath("/clientes");

    return responder(formatearFacturaApi({ venta }));
  },
);
