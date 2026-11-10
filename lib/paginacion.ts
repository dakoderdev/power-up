export function limpiarPagina(texto: string | string[] | undefined) {
  const valor = Number(Array.isArray(texto) ? texto[0] : texto);

  return Number.isSafeInteger(valor) && valor >= 1 ? valor : 1;
}

export function ubicarPagina({
  cantidad,
  porPagina,
  pedida,
}: {
  cantidad: number;
  porPagina: number;
  pedida: number;
}) {
  const paginas = Math.max(1, Math.ceil(cantidad / porPagina));
  const pagina = Math.min(pedida, paginas);

  return { pagina, paginas, desde: (pagina - 1) * porPagina };
}
