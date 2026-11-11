import { or, sql, type SQLWrapper } from "drizzle-orm";

const BUSQUEDA_MAXIMA = 120;
const CON_ACENTOS = "áàäâãéèëêíìïîóòöôõúùüûñç";
const SIN_ACENTOS = "aaaaaeeeeiiiiooooouuuunc";
const ESPECIALES_GLOB = "*?[";

function variantes(letra: string) {
  const minuscula = letra.toLowerCase();
  const indice = CON_ACENTOS.indexOf(minuscula);
  const base = indice < 0 ? minuscula : SIN_ACENTOS[indice];
  const acentuadas = [...CON_ACENTOS].filter(
    (_, posicion) => SIN_ACENTOS[posicion] === base,
  );
  const minusculas = [base, ...acentuadas].join("");

  return [...new Set(minusculas + minusculas.toUpperCase())].join("");
}

function patronGlob(busqueda: string) {
  const clases = [...busqueda].map((letra) => {
    const opciones = variantes(letra);

    return opciones.length > 1 || ESPECIALES_GLOB.includes(letra)
      ? `[${opciones}]`
      : letra;
  });

  return `*${clases.join("")}*`;
}

export function coincideBusqueda({
  columnas,
  busqueda,
}: {
  columnas: SQLWrapper[];
  busqueda: string;
}) {
  const patron = patronGlob(busqueda);

  return or(...columnas.map((columna) => sql`${columna} glob ${patron}`));
}

export function limpiarBusqueda(texto: string | string[] | undefined) {
  const valor = Array.isArray(texto) ? texto[0] : texto;

  return (valor ?? "").trim().slice(0, BUSQUEDA_MAXIMA);
}
