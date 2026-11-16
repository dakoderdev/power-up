import { noEncontrado } from "@/lib/api/errores";
import { enCentavos, enIso } from "@/lib/api/formato";
import { leerRangoDias } from "@/lib/api/parametros";
import { leerId, responder, ruta } from "@/lib/api/ruta";
import { obtenerCliente, obtenerCuenta } from "@/lib/clientes/detalle";
import { formatearComprobante } from "@/lib/ventas/comprobante";

type Params = { id: string };

// RF-C4: movimientos de la cuenta en orden cronológico con saldo acumulado.
export const GET = ruta<Params>({}, async ({ solicitud, params }) => {
  const id = leerId(params.id);
  const cliente = await obtenerCliente(id);

  if (!cliente) {
    throw noEncontrado("El cliente");
  }

  const rango = leerRangoDias(solicitud.nextUrl.searchParams);
  const cuenta = await obtenerCuenta(id, rango);

  return responder({
    cliente: { id: cliente.id, nombre: cliente.nombre },
    saldoAnterior: enCentavos(cuenta.saldoAnterior),
    movimientos: cuenta.movimientos.map((movimiento) => ({
      id: movimiento.id,
      fecha: enIso(movimiento.fecha),
      tipo: movimiento.tipo === "venta" ? "debito" : "credito",
      origen: movimiento.tipo,
      importe: enCentavos(movimiento.importe),
      descripcion:
        movimiento.ventaId !== null &&
        movimiento.puntoVenta !== null &&
        movimiento.numero !== null
          ? `${movimiento.tipo === "venta" ? "Factura" : "Anulación de factura"} ${formatearComprobante({ puntoVenta: movimiento.puntoVenta, numero: movimiento.numero })}`
          : (movimiento.observacion ?? "Pago"),
      facturaId: movimiento.ventaId,
      pagoId: movimiento.tipo === "pago" ? movimiento.id : null,
      saldo: enCentavos(movimiento.saldo),
    })),
    saldo: enCentavos(cuenta.saldo),
  });
});
