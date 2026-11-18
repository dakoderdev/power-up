import { revalidatePath } from "next/cache";
import { noEncontrado } from "@/lib/api/errores";
import { esquemaClienteNuevoApi } from "@/lib/api/esquemas";
import {
  enCentavos,
  formatearClienteApi,
  respuestaPaginada,
} from "@/lib/api/formato";
import {
  leerBooleano,
  leerBusqueda,
  leerOpcion,
  leerPaginacion,
} from "@/lib/api/parametros";
import { leerJson, responder, ruta, validar } from "@/lib/api/ruta";
import { obtenerCliente } from "@/lib/clientes/detalle";
import { crearCliente, exigirClienteCreado } from "@/lib/clientes/guardar";
import { listarClientes, ORDENES_CLIENTES } from "@/lib/clientes/listado";
import { obtenerSaldo } from "@/lib/cuentas/saldo";
import { db } from "@/lib/db";

// RF-C1 y RF-C6: clientes con saldo; con conDeuda=true, solo deudores y el total adeudado.
export const GET = ruta({}, async ({ solicitud }) => {
  const parametros = solicitud.nextUrl.searchParams;
  const { page, pageSize } = leerPaginacion(parametros);
  const conDeuda = leerBooleano(parametros, "conDeuda");

  const { lista, cantidad, totalAdeudado, pagina } = await listarClientes({
    busqueda: leerBusqueda(parametros),
    paginaPedida: page,
    porPagina: pageSize,
    conDeuda,
    orden: leerOpcion({
      parametros,
      nombre: "orden",
      opciones: ORDENES_CLIENTES,
    }),
  });

  return responder(
    respuestaPaginada({
      data: lista.map((cliente) =>
        formatearClienteApi({ cliente, saldo: cliente.saldo }),
      ),
      page: pagina,
      pageSize,
      total: cantidad,
      extra: conDeuda ? { totalAdeudado: enCentavos(totalAdeudado) } : {},
    }),
  );
});

// RF-C2 y RF-V2: alta de cliente; la misma ruta sirve al alta rápida desde Nueva venta.
export const POST = ruta({}, async ({ solicitud }) => {
  const entrada = validar(esquemaClienteNuevoApi, await leerJson(solicitud));
  const creado = exigirClienteCreado(await crearCliente(entrada));
  const cliente = await obtenerCliente(creado.id);

  if (!cliente) {
    throw noEncontrado("El cliente");
  }

  const saldo = await obtenerSaldo({ consulta: db, clienteId: cliente.id });

  revalidatePath("/clientes");

  return responder(formatearClienteApi({ cliente, saldo }), 201);
});
