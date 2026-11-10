export const ZONA = "America/Argentina/Buenos_Aires";

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

export function formatearHora(fecha: Date) {
  const { hour, minute } = partes(fecha);

  return `${hour}:${minute}`;
}

export function formatearFechaHora(fecha: Date) {
  const { day, month, year, hour, minute } = partes(fecha);

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

const DIA_SEMANA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function aClave(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

export function claveDia(fecha: Date) {
  const { day, month, year } = partes(fecha);

  return `${year}-${month}-${day}`;
}

export function etiquetaDia({ clave, ahora }: { clave: string; ahora: Date }) {
  const hoy = claveDia(ahora);
  const ayer = new Date(`${hoy}T00:00:00Z`);
  ayer.setUTCDate(ayer.getUTCDate() - 1);

  if (clave === hoy) {
    return "Hoy";
  }

  if (clave === aClave(ayer)) {
    return "Ayer";
  }

  const dia = new Date(`${clave}T12:00:00Z`);

  if (clave.slice(0, 4) !== hoy.slice(0, 4)) {
    return formatearFecha(dia);
  }

  const texto = DIA_SEMANA.format(dia);

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
