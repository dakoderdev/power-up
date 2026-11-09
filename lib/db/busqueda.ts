import { or, sql, type SQLWrapper } from "drizzle-orm";

const CON_ACENTOS = "áàäâãéèëêíìïîóòöôõúùüûñç";
const SIN_ACENTOS = "aaaaaeeeeiiiiooooouuuunc";

function normalizar(valor: SQLWrapper) {
  return sql`translate(lower(${valor}), ${CON_ACENTOS}, ${SIN_ACENTOS})`;
}

export function coincideBusqueda({
  columnas,
  busqueda,
}: {
  columnas: SQLWrapper[];
  busqueda: string;
}) {
  const buscado = normalizar(sql`${busqueda}::text`);

  return or(
    ...columnas.map(
      (columna) => sql`strpos(${normalizar(columna)}, ${buscado}) > 0`,
    ),
  );
}
