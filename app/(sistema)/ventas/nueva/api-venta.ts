import type { ErrorAccion, ResultadoAccion } from "@/lib/acciones";
import type { CodigoApi } from "@/lib/api/errores";
import type { ClienteNuevo } from "@/lib/clientes/esquemas";
import type { ClienteVenta } from "@/lib/clientes/listado";
import type { TipoDocumento } from "@/lib/documento";
import { aCentavos, deCentavos } from "@/lib/moneda";
import type { ProductoVendible } from "@/lib/productos/listado";
import type { VentaEntrada } from "@/lib/ventas/esquemas";

const RESULTADOS = "8";
const NO_DIGITOS = /\D/g;

type ErrorApi = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ProductoApi = {
  id: number;
  codigo: string;
  descripcion: string;
  precio: number;
  existencia: number;
  imagenUrl: string | null;
};

type ClienteApi = {
  id: number;
  nombre: string;
  tipoDoc: TipoDocumento;
  nroDoc: string;
  cuentaCorriente: boolean;
  activo: boolean;
};

type FacturaApi = {
  id: number;
  numeroFormateado: string;
  pago: { forma: string; vuelto?: number };
};

export type ResultadoVenta =
  | {
      confirmada: true;
      ventaId: number;
      comprobante: string;
      vuelto: string | null;
    }
  | {
      confirmada: false;
      errores: { mensaje: string; productoId?: number }[];
    };

async function pedir<T>(ruta: string, opciones?: RequestInit) {
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: { "Content-Type": "application/json" },
  });
  const cuerpo = (await respuesta.json()) as T | ErrorApi;

  return { ok: respuesta.ok, cuerpo };
}

function conBusqueda(ruta: string, busqueda: string) {
  const parametros = new URLSearchParams({ pageSize: RESULTADOS });

  if (busqueda.trim()) {
    parametros.set("q", busqueda.trim());
  }

  return `${ruta}?${parametros}`;
}

// Sección 10.6 y RF-V3: la búsqueda en vivo de productos consume la API REST.
export async function buscarProductos(
  busqueda: string,
): Promise<ProductoVendible[]> {
  const { ok, cuerpo } = await pedir<{ data: ProductoApi[] }>(
    conBusqueda("/api/productos", busqueda),
  );

  if (!ok || !("data" in cuerpo)) {
    return [];
  }

  return cuerpo.data.map((producto) => ({
    id: producto.id,
    codigo: producto.codigo,
    nombre: producto.descripcion,
    precio: deCentavos(producto.precio),
    stock: producto.existencia,
    imagenUrl: producto.imagenUrl,
  }));
}

// Sección 10.6 y RF-V2: la búsqueda en vivo de clientes consume la API REST; los dados de baja no se ofrecen.
export async function buscarClientes(
  busqueda: string,
): Promise<ClienteVenta[]> {
  const { ok, cuerpo } = await pedir<{ data: ClienteApi[] }>(
    conBusqueda("/api/clientes", busqueda),
  );

  if (!ok || !("data" in cuerpo)) {
    return [];
  }

  return cuerpo.data
    .filter((cliente) => cliente.activo)
    .map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      tipoDoc: cliente.tipoDoc,
      documento: cliente.nroDoc.replace(NO_DIGITOS, ""),
      cuentaCorriente: cliente.cuentaCorriente,
    }));
}

const CAMPOS_CLIENTE_API: Record<string, string> = { nroDoc: "documento" };

function errorDeAccion(error: ErrorApi["error"]): ErrorAccion {
  const detalles = Array.isArray(error.details)
    ? error.details.filter(
        (detalle): detalle is { campo: string; mensaje: string } =>
          typeof detalle === "object" &&
          detalle !== null &&
          "campo" in detalle &&
          "mensaje" in detalle,
      )
    : [];

  return {
    code: error.code as CodigoApi,
    message: error.message,
    details: detalles.map(({ campo, mensaje }) => ({
      campo: CAMPOS_CLIENTE_API[campo] ?? campo,
      mensaje,
    })),
  };
}

// RF-V2 y sección 11.5: el alta rápida desde Nueva venta usa POST /api/clientes, la misma ruta del alta normal.
export async function crearCliente(
  entrada: ClienteNuevo,
): Promise<ResultadoAccion<ClienteVenta>> {
  try {
    const { ok, cuerpo } = await pedir<ClienteApi>("/api/clientes", {
      method: "POST",
      body: JSON.stringify({
        tipoDoc: entrada.tipoDoc,
        nroDoc: entrada.documento,
        nombre: entrada.nombre,
        domicilio: entrada.domicilio,
        telefono: entrada.telefono,
        email: entrada.email,
        cuentaCorriente: entrada.cuentaCorriente,
        limiteCredito:
          entrada.limiteCredito == null
            ? null
            : aCentavos(entrada.limiteCredito),
      }),
    });

    if (!ok || "error" in cuerpo) {
      return {
        ok: false,
        error:
          "error" in cuerpo
            ? errorDeAccion(cuerpo.error)
            : {
                code: "ERROR_INTERNO",
                message: "No se pudo crear el cliente.",
              },
      };
    }

    return {
      ok: true,
      data: {
        id: cuerpo.id,
        nombre: cuerpo.nombre,
        tipoDoc: cuerpo.tipoDoc,
        documento: cuerpo.nroDoc.replace(NO_DIGITOS, ""),
        cuentaCorriente: cuerpo.cuentaCorriente,
      },
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "ERROR_INTERNO",
        message:
          "No se pudo crear el cliente. Revisá la conexión y probá de nuevo.",
      },
    };
  }
}

function erroresDe(error: ErrorApi["error"]) {
  const detalles = Array.isArray(error.details) ? error.details : [];
  const porProducto = detalles.filter(
    (detalle): detalle is { productoId?: number; mensaje: string } =>
      typeof detalle === "object" &&
      detalle !== null &&
      "mensaje" in detalle &&
      typeof detalle.mensaje === "string",
  );

  return porProducto.length > 0
    ? porProducto.map(({ productoId, mensaje }) => ({ productoId, mensaje }))
    : [{ mensaje: error.message }];
}

// Sección 10.6 y RF-V6: la confirmación de la venta consume POST /api/facturas (importes en centavos).
export async function confirmarVenta(
  entrada: VentaEntrada,
): Promise<ResultadoVenta> {
  const pago = {
    forma: entrada.formaPago,
    ...(entrada.formaPago === "contado" && entrada.montoRecibido
      ? { montoRecibido: aCentavos(entrada.montoRecibido) }
      : {}),
    ...(entrada.formaPago === "tarjeta" && entrada.tarjeta
      ? { tarjeta: entrada.tarjeta }
      : {}),
  };

  try {
    const { ok, cuerpo } = await pedir<FacturaApi>("/api/facturas", {
      method: "POST",
      body: JSON.stringify({
        clienteId: entrada.clienteId,
        items: entrada.items,
        pago,
      }),
    });

    if (!ok || "error" in cuerpo) {
      return {
        confirmada: false,
        errores:
          "error" in cuerpo
            ? erroresDe(cuerpo.error)
            : [{ mensaje: "No se pudo confirmar la venta." }],
      };
    }

    return {
      confirmada: true,
      ventaId: cuerpo.id,
      comprobante: cuerpo.numeroFormateado,
      vuelto:
        cuerpo.pago.vuelto === undefined
          ? null
          : deCentavos(cuerpo.pago.vuelto),
    };
  } catch {
    return {
      confirmada: false,
      errores: [
        {
          mensaje:
            "No se pudo confirmar la venta. Revisá la conexión y probá de nuevo.",
        },
      ],
    };
  }
}
