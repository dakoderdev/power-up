import { FORMAS_PAGO } from "@/lib/db/schema";
import { DESFASE_HORAS } from "@/lib/fechas";
import { ESTADOS_VENTA, type FiltrosListado } from "./listado";

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const MS_HORA = 3_600_000;
const MS_DIA = 86_400_000;

type Parametros = Record<string, string | string[] | undefined>;

export type ValoresFiltro = {
  q: string;
  desde: string;
  hasta: string;
  cliente: string;
  vendedor: string;
  forma: string;
  estado: string;
};

function unico(parametros: Parametros, nombre: string) {
  const valor = parametros[nombre];

  return Array.isArray(valor) ? valor[0] : valor;
}

function inicioDia(dia: string) {
  if (!FORMATO_DIA.test(dia)) {
    return undefined;
  }

  const [anio, mes, diaMes] = dia.split("-").map(Number);
  const utc = new Date(Date.UTC(anio, mes - 1, diaMes));

  return utc.toISOString().slice(0, 10) === dia
    ? new Date(utc.getTime() - DESFASE_HORAS * MS_HORA)
    : undefined;
}

function leerDia(valor: string | undefined) {
  const fecha = valor ? inicioDia(valor) : undefined;

  return valor && fecha ? { valor, fecha } : undefined;
}

// RF-V8: lee los filtros del listado de ventas desde la URL; los días se
// interpretan en hora de Argentina y "hasta" incluye ese día completo.
export function leerFiltros(parametros: Parametros) {
  const busqueda = (unico(parametros, "q") ?? "").trim();
  const desde = leerDia(unico(parametros, "desde"));
  const hasta = leerDia(unico(parametros, "hasta"));
  const numeroCliente = Number(unico(parametros, "cliente"));
  const clienteId =
    Number.isSafeInteger(numeroCliente) && numeroCliente > 0
      ? numeroCliente
      : undefined;
  const vendedorId = unico(parametros, "vendedor") || undefined;
  const formaPago = FORMAS_PAGO.find(
    (forma) => forma === unico(parametros, "forma"),
  );
  const estado = ESTADOS_VENTA.find(
    (opcion) => opcion === unico(parametros, "estado"),
  );

  const filtros: FiltrosListado = {
    busqueda,
    desde: desde?.fecha,
    hasta: hasta ? new Date(hasta.fecha.getTime() + MS_DIA) : undefined,
    clienteId,
    vendedorId,
    formaPago,
    estado,
  };

  const valores: ValoresFiltro = {
    q: busqueda,
    desde: desde?.valor ?? "",
    hasta: hasta?.valor ?? "",
    cliente: clienteId ? String(clienteId) : "",
    vendedor: vendedorId ?? "",
    forma: formaPago ?? "",
    estado: estado ?? "",
  };

  return {
    filtros,
    valores,
    activos: Object.values(valores).some((valor) => valor !== ""),
  };
}

export function enlaceVentas({
  valores,
  pagina,
}: {
  valores: ValoresFiltro;
  pagina: number;
}) {
  const consulta = new URLSearchParams();

  for (const [clave, valor] of Object.entries(valores)) {
    if (valor) {
      consulta.set(clave, valor);
    }
  }

  if (pagina > 1) {
    consulta.set("pagina", String(pagina));
  }

  const cadena = consulta.toString();

  return cadena ? `/ventas?${cadena}` : "/ventas";
}
