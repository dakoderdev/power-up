const RESTRICCION = "SQLITE_CONSTRAINT";
const MENSAJE_UNICA = "UNIQUE constraint failed";

function esViolacionUnica(posible: unknown) {
  return (
    posible instanceof Error &&
    "code" in posible &&
    typeof posible.code === "string" &&
    posible.code.startsWith(RESTRICCION) &&
    posible.message.includes(MENSAJE_UNICA)
  );
}

export function esDuplicado(error: unknown) {
  const causa =
    error instanceof Error && "cause" in error ? error.cause : undefined;

  return [error, causa].some(esViolacionUnica);
}
