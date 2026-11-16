import { ApiError } from "./errores";

export const PAGINA_INICIAL = 1;
export const TAMANO_PAGINA = 20;
export const TAMANO_PAGINA_MAXIMO = 100;

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const DESFASE_ARGENTINA = "-03:00";
const MS_POR_DIA = 86_400_000;

function enteroDesde({
  valor,
  minimo,
  maximo,
  porDefecto,
}: {
  valor: string | null;
  minimo: number;
  maximo: number;
  porDefecto: number;
}) {
  if (valor === null || valor === "") {
    return porDefecto;
  }

  const numero = Number(valor);

  return Number.isSafeInteger(numero)
    ? Math.min(Math.max(numero, minimo), maximo)
    : porDefecto;
}

// Sección 11.1: paginación con page (desde 1) y pageSize (por defecto 20, máximo 100).
export function leerPaginacion(parametros: URLSearchParams) {
  return {
    page: enteroDesde({
      valor: parametros.get("page"),
      minimo: PAGINA_INICIAL,
      maximo: Number.MAX_SAFE_INTEGER,
      porDefecto: PAGINA_INICIAL,
    }),
    pageSize: enteroDesde({
      valor: parametros.get("pageSize"),
      minimo: 1,
      maximo: TAMANO_PAGINA_MAXIMO,
      porDefecto: TAMANO_PAGINA,
    }),
  };
}

export function leerEnteroOpcional(
  parametros: URLSearchParams,
  nombre: string,
) {
  const valor = parametros.get(nombre);

  if (valor === null || valor === "") {
    return undefined;
  }

  const numero = Number(valor);

  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new ApiError(422, "VALIDACION", "Hay parámetros con errores.", [
      { campo: nombre, mensaje: "Debe ser un entero positivo." },
    ]);
  }

  return numero;
}

export function leerBooleano(parametros: URLSearchParams, nombre: string) {
  return parametros.get(nombre) === "true";
}

export function leerOpcion<T extends string>({
  parametros,
  nombre,
  opciones,
}: {
  parametros: URLSearchParams;
  nombre: string;
  opciones: readonly T[];
}) {
  const valor = parametros.get(nombre);

  if (valor === null || valor === "") {
    return undefined;
  }

  const opcion = opciones.find((candidata) => candidata === valor);

  if (!opcion) {
    throw new ApiError(422, "VALIDACION", "Hay parámetros con errores.", [
      { campo: nombre, mensaje: `Valores admitidos: ${opciones.join(", ")}.` },
    ]);
  }

  return opcion;
}

function inicioDeDiaArgentina(dia: string) {
  return new Date(`${dia}T00:00:00${DESFASE_ARGENTINA}`);
}

// Sección 11.1: desde y hasta en AAAA-MM-DD, interpretados en hora de Argentina.
export function leerRangoDias(parametros: URLSearchParams) {
  const leer = (nombre: string) => {
    const valor = parametros.get(nombre);

    if (valor === null || valor === "") {
      return undefined;
    }

    const fecha = FORMATO_DIA.test(valor) ? inicioDeDiaArgentina(valor) : null;

    if (!fecha || Number.isNaN(fecha.getTime())) {
      throw new ApiError(422, "VALIDACION", "Hay parámetros con errores.", [
        { campo: nombre, mensaje: "Debe tener el formato AAAA-MM-DD." },
      ]);
    }

    return fecha;
  };

  const desde = leer("desde");
  const hastaDia = leer("hasta");

  return {
    desde,
    hasta: hastaDia ? new Date(hastaDia.getTime() + MS_POR_DIA) : undefined,
  };
}

export function leerBusqueda(parametros: URLSearchParams) {
  return (parametros.get("q") ?? "").trim();
}
