const ZONA = "America/Argentina/Buenos_Aires";

const formato = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partes(fecha: Date) {
  return Object.fromEntries(
    formato.formatToParts(fecha).map((parte) => [parte.type, parte.value]),
  );
}

export function formatearFecha(fecha: Date) {
  const { day, month, year } = partes(fecha);

  return `${day}/${month}/${year}`;
}

export function formatearFechaHora(fecha: Date) {
  const { day, month, year, hour, minute } = partes(fecha);

  return `${day}/${month}/${year} ${hour}:${minute}`;
}
