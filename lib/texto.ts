type Palabras = { cantidad: number; singular: string; plural: string };

export function pluralizar({ cantidad, singular, plural }: Palabras) {
  return cantidad === 1 ? singular : plural;
}

export function contar(palabras: Palabras) {
  return `${palabras.cantidad} ${pluralizar(palabras)}`;
}
