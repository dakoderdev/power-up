const VIOLACION_UNICA = "23505";

export function esDuplicado(error: unknown) {
  const causa =
    error instanceof Error && "cause" in error ? error.cause : undefined;

  return [error, causa].some(
    (posible) =>
      typeof posible === "object" &&
      posible !== null &&
      "code" in posible &&
      posible.code === VIOLACION_UNICA,
  );
}
