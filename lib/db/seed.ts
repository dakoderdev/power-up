import { randomUUID } from "node:crypto";
import {
  and,
  count,
  eq,
  getTableName,
  inArray,
  isNull,
  max,
  sql,
} from "drizzle-orm";
import { auth } from "../auth";
import { formatearHora } from "../fechas";
import { aCentavos, deCentavos } from "../moneda";
import { MOTIVO_STOCK_INICIAL, MOTIVOS_SUGERIDOS } from "../stock/etiquetas";
import { PUNTO_VENTA } from "../ventas/comprobante";
import { CONSUMIDOR_FINAL, MARCAS_TARJETA } from "../ventas/etiquetas";
import { siguienteNumero } from "../ventas/numeracion";
import { db } from "./index";
import {
  account,
  clientes,
  itemsVenta,
  movimientosCuenta,
  movimientosStock,
  productos,
  TIPOS_TARJETA,
  user,
  ventas,
} from "./schema";

const LARGO_MINIMO_CLAVE = 8;

const CONFIGURACION = {
  clientes: { min: 4, max: 8 },
  ventasHoy: { min: 8, max: 18 },
  ventasDiasAnteriores: { min: 4, max: 10 },
  diasAnteriores: 5,
  productosPorVenta: { min: 1, max: 3 },
  unidadesPorProducto: { min: 1, max: 2 },
  stockInicial: { min: 4, max: 40 },
  productosSinStock: 1,
  productosStockBajo: 3,
  pesosFormaPago: { contado: 3, tarjeta: 3, cuenta_corriente: 2 },
  probabilidadConsumidorFinal: 0.5,
  probabilidadPago: 0.5,
  probabilidadLimite: 0.5,
  margenLimite: { min: 1, max: 4 },
  ajustesManuales: { min: 3, max: 8 },
  unidadesPorAjuste: { min: 1, max: 5 },
  probabilidadSalida: 0.5,
};

const FLAG_REINICIAR = "--reiniciar";

const TABLAS_DEMOSTRACION = [
  movimientosCuenta,
  movimientosStock,
  itemsVenta,
  ventas,
  clientes,
  productos,
];

const NOMBRES = [
  "Martina",
  "Lucas",
  "Sofía",
  "Tomás",
  "Valentina",
  "Mateo",
  "Camila",
  "Joaquín",
  "Julieta",
  "Benjamín",
  "Agustina",
  "Facundo",
];

const APELLIDOS = [
  "Gómez",
  "Fernández",
  "Ramírez",
  "Herrera",
  "López",
  "Díaz",
  "Martínez",
  "Romero",
  "Sosa",
  "Álvarez",
  "Torres",
  "Benítez",
];

const STOCK_BAJO = { min: 1, max: 3 };

const MINUTOS_POR_DIA = 24 * 60;

const ESCALON_LIMITE = 5_000_000;

type Rango = { min: number; max: number };

type FormaPago = keyof typeof CONFIGURACION.pesosFormaPago;

const BASE_TAPAS = "https://images.igdb.com/igdb/image/upload/t_cover_big";

const TAPAS: Record<string, string> = {
  "GTA-V": "co2lbd",
  "SIMS-4": "co3h3l",
  "COD-MW3": "co1wkn",
  "FIFA-23": "co4zw5",
  "SMB-WONDER": "co6nnl",
  "POKE-ESC": "co5sfi",
  "ZELDA-TOTK": "co5vmg",
  "AC-VAL": "co2ed3",
  "HALO-INF": "co2dto",
  "RE-4": "co2wki",
  "SONIC-SS": "cobbw4",
  "METROID-D": "coba9g",
  "SIMS-3": "co99qs",
  "TOMO-LTD": "cobdqd",
  "SPLA-3": "co59x3",
  "SPLA-2": "cob8r9",
  "PORTAL-2": "co1rs4",
  PEAK: "cocokj",
  SMO: "co1mxf",
  SMS: "cob8q1",
  "GTA-IV": "co2lbv",
  DELTARUNE: "co9m71",
  "JD-2014": "co1xf3",
  "JD-4": "co1xf6",
  CUPHEAD: "co62ao",
};

const JUEGOS: (typeof productos.$inferInsert)[] = [
  {
    codigo: "GTA-V",
    nombre: "Grand Theft Auto V",
    precio: "29999.00",
  },
  { codigo: "SIMS-4", nombre: "Los Sims 4", precio: "24999.00" },
  {
    codigo: "COD-MW3",
    nombre: "Call of Duty: Modern Warfare III",
    precio: "69999.00",
  },
  { codigo: "FIFA-23", nombre: "FIFA 23", precio: "39999.00" },
  {
    codigo: "SMB-WONDER",
    nombre: "Super Mario Bros. Wonder",
    precio: "64999.00",
  },
  {
    codigo: "POKE-ESC",
    nombre: "Pokémon Escarlata",
    precio: "64999.00",
  },
  {
    codigo: "ZELDA-TOTK",
    nombre: "The Legend of Zelda: Tears of the Kingdom",
    precio: "69999.00",
  },
  {
    codigo: "AC-VAL",
    nombre: "Assassin's Creed Valhalla",
    precio: "34999.00",
  },
  {
    codigo: "HALO-INF",
    nombre: "Halo Infinite",
    precio: "39999.00",
  },
  { codigo: "RE-4", nombre: "Resident Evil 4", precio: "49999.00" },
  {
    codigo: "SONIC-SS",
    nombre: "Sonic Superstars",
    precio: "44999.00",
  },
  {
    codigo: "METROID-D",
    nombre: "Metroid Dread",
    precio: "59999.00",
  },
  { codigo: "SIMS-3", nombre: "Los Sims 3", precio: "19999.00" },
  {
    codigo: "TOMO-LTD",
    nombre: "Tomodachi Life: Living the Dream",
    precio: "69999.00",
  },
  { codigo: "SPLA-3", nombre: "Splatoon 3", precio: "64999.00" },
  { codigo: "SPLA-2", nombre: "Splatoon 2", precio: "54999.00" },
  { codigo: "PORTAL-2", nombre: "Portal 2", precio: "14999.00" },
  { codigo: "PEAK", nombre: "Peak", precio: "9999.00" },
  {
    codigo: "SMO",
    nombre: "Super Mario Odyssey",
    precio: "59999.00",
  },
  {
    codigo: "SMS",
    nombre: "Super Mario Sunshine",
    precio: "44999.00",
  },
  {
    codigo: "GTA-IV",
    nombre: "Grand Theft Auto IV",
    precio: "19999.00",
  },
  { codigo: "DELTARUNE", nombre: "Deltarune", precio: "24999.00" },
  {
    codigo: "JD-2014",
    nombre: "Just Dance 2014",
    precio: "12999.00",
  },
  { codigo: "JD-4", nombre: "Just Dance 4", precio: "9999.00" },
  { codigo: "CUPHEAD", nombre: "Cuphead", precio: "19999.00" },
];

function entero({ min, max }: Rango) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function elegir<T>(lista: T[]) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function mezclar<T>(lista: T[]) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function elegirFormaPago() {
  const pesos = Object.entries(CONFIGURACION.pesosFormaPago) as [
    FormaPago,
    number,
  ][];
  const total = pesos.reduce((suma, [, peso]) => suma + peso, 0);
  let tirada = Math.random() * total;

  for (const [formaPago, peso] of pesos) {
    tirada -= peso;

    if (tirada < 0) {
      return formaPago;
    }
  }

  return pesos[pesos.length - 1][0];
}

function sinAcentos(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function generarClientes() {
  const cantidad = entero(CONFIGURACION.clientes);
  const documentos = new Set<string>();
  const nombres = new Set<string>();
  const generados: (typeof clientes.$inferInsert)[] = [];

  while (generados.length < cantidad) {
    const nombre = `${elegir(NOMBRES)} ${elegir(APELLIDOS)}`;
    const documento = String(entero({ min: 20_000_000, max: 45_999_999 }));

    if (nombres.has(nombre) || documentos.has(documento)) {
      continue;
    }

    nombres.add(nombre);
    documentos.add(documento);

    const contacto = entero({ min: 0, max: 2 });
    const usuario = sinAcentos(nombre).toLowerCase().replace(" ", ".");

    generados.push({
      nombre,
      documento,
      telefono:
        contacto === 1
          ? null
          : `11${entero({ min: 10_000_000, max: 99_999_999 })}`,
      email: contacto === 0 ? null : `${usuario}@ejemplo.com`,
    });
  }

  return generados;
}

function sortearStock() {
  const codigos = mezclar(JUEGOS.map((juego) => juego.codigo));
  const sinStock = CONFIGURACION.productosSinStock;
  const bajo = sinStock + CONFIGURACION.productosStockBajo;

  return new Map(
    codigos.map((codigo, indice) => [
      codigo,
      indice < sinStock
        ? 0
        : indice < bajo
          ? entero(STOCK_BAJO)
          : entero(CONFIGURACION.stockInicial),
    ]),
  );
}

function haceMinutos(minutos: number) {
  return new Date(Date.now() - minutos * 60_000);
}

function minutosDesdeMedianoche() {
  const [horas, minutos] = formatearHora(new Date()).split(":").map(Number);

  return Math.max(1, horas * 60 + minutos);
}

function sortearMinutos({
  cantidad,
  rango,
}: {
  cantidad: number;
  rango: Rango;
}) {
  return Array.from({ length: cantidad }, () => entero(rango));
}

function sortearEventos() {
  const hoy = { min: 1, max: minutosDesdeMedianoche() };
  const anteriores = {
    min: hoy.max + 1,
    max: hoy.max + CONFIGURACION.diasAnteriores * MINUTOS_POR_DIA,
  };
  const ventasEnMinutos = [
    ...sortearMinutos({
      cantidad: entero(CONFIGURACION.ventasHoy),
      rango: hoy,
    }),
    ...sortearMinutos({
      cantidad: entero(CONFIGURACION.ventasDiasAnteriores),
      rango: anteriores,
    }),
  ];
  const ajustes = sortearMinutos({
    cantidad: entero(CONFIGURACION.ajustesManuales),
    rango: { min: hoy.min, max: anteriores.max },
  });

  return [
    ...ventasEnMinutos.map((minutos) => ({ minutos, esAjuste: false })),
    ...ajustes.map((minutos) => ({ minutos, esAjuste: true })),
  ]
    .sort((a, b) => b.minutos - a.minutos)
    .map((evento) => ({
      fecha: haceMinutos(evento.minutos),
      esAjuste: evento.esAjuste,
    }));
}

async function reiniciarDemostracion() {
  if (!process.argv.includes(FLAG_REINICIAR)) {
    return;
  }

  if (process.env.VERCEL) {
    throw new Error(`${FLAG_REINICIAR} no se puede usar en Vercel.`);
  }

  const base = leerVariable("TURSO_DATABASE_URL");
  console.log(`Borrando los datos de demostración de ${base}…`);

  await db.transaction(async (tx) => {
    for (const tabla of TABLAS_DEMOSTRACION) {
      await tx.delete(tabla);
      await tx.run(
        sql`delete from sqlite_sequence where name = ${getTableName(tabla)}`,
      );
    }
  });
}

function leerVariable(nombre: string) {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}.`);
  }

  return valor;
}

async function crearAdministrador() {
  const correo = leerVariable("SEED_ADMIN_EMAIL").toLowerCase();
  const clave = leerVariable("SEED_ADMIN_PASSWORD");
  const nombre = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";

  if (clave.length < LARGO_MINIMO_CLAVE) {
    throw new Error(
      `SEED_ADMIN_PASSWORD necesita al menos ${LARGO_MINIMO_CLAVE} caracteres.`,
    );
  }

  const [existente] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, correo));

  if (existente) {
    console.log(`El administrador ${correo} ya existe; no se modifica.`);
    return existente.id;
  }

  const contexto = await auth.$context;
  const hash = await contexto.password.hash(clave);
  const id = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: nombre,
      email: correo,
      emailVerified: true,
      role: "admin",
      active: true,
    });
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hash,
    });
  });

  console.log(`Administrador ${correo} creado.`);

  return id;
}

async function crearProductos(usuarioId: string) {
  const stock = sortearStock();
  const creados = await db.transaction(async (tx) => {
    const insertados = await tx
      .insert(productos)
      .values(
        JUEGOS.map((juego) => ({
          ...juego,
          stock: stock.get(juego.codigo),
        })),
      )
      .onConflictDoNothing({ target: productos.codigo })
      .returning({ id: productos.id, stock: productos.stock });

    const conStock = insertados.filter((producto) => producto.stock > 0);

    if (conStock.length > 0) {
      await tx.insert(movimientosStock).values(
        conStock.map((producto) => ({
          productoId: producto.id,
          tipo: "entrada" as const,
          origen: "manual" as const,
          cantidad: producto.stock,
          motivo: MOTIVO_STOCK_INICIAL,
          usuarioId,
          creadoEn: haceMinutos(
            (CONFIGURACION.diasAnteriores + 1) * MINUTOS_POR_DIA,
          ),
        })),
      );
    }

    return insertados.length;
  });

  console.log(`Productos creados: ${creados} de ${JUEGOS.length}.`);
}

async function crearVentas(usuarioId: string) {
  const [{ cantidad }] = await db.select({ cantidad: count() }).from(ventas);

  if (cantidad > 0) {
    console.log("Ya hay ventas cargadas; no se agregan.");
    return;
  }

  const generados = generarClientes();

  const resumen = await db.transaction(async (tx) => {
    await tx
      .insert(clientes)
      .values(generados)
      .onConflictDoNothing({ target: clientes.documento });

    const registrados = await tx
      .select()
      .from(clientes)
      .where(
        inArray(
          clientes.documento,
          generados.map((cliente) => cliente.documento),
        ),
      );
    const disponibles = await tx
      .select()
      .from(productos)
      .where(
        inArray(
          productos.codigo,
          JUEGOS.map((juego) => juego.codigo),
        ),
      );
    const restante = new Map(
      disponibles.map((producto) => [producto.id, producto.stock]),
    );
    const saldos = new Map<number, number>();
    let creadas = 0;
    let ajustes = 0;

    for (const { fecha, esAjuste } of sortearEventos()) {
      const conStock = disponibles.filter(
        (producto) => restante.get(producto.id)! > 0,
      );

      if (esAjuste) {
        const reponibles = disponibles.filter(
          (producto) => restante.get(producto.id)! > STOCK_BAJO.max,
        );
        const tipo =
          conStock.length > 0 &&
          (reponibles.length === 0 ||
            Math.random() < CONFIGURACION.probabilidadSalida)
            ? "salida"
            : "entrada";
        const candidatos = tipo === "salida" ? conStock : reponibles;

        if (candidatos.length === 0) {
          continue;
        }

        const producto = elegir(candidatos);
        const actual = restante.get(producto.id)!;
        const sorteadas = entero(CONFIGURACION.unidadesPorAjuste);
        const unidades =
          tipo === "salida" ? Math.min(sorteadas, actual) : sorteadas;
        const diferencia = tipo === "salida" ? -unidades : unidades;

        await tx.insert(movimientosStock).values({
          productoId: producto.id,
          tipo,
          origen: "manual",
          cantidad: unidades,
          motivo: elegir(MOTIVOS_SUGERIDOS[tipo]),
          usuarioId,
          creadoEn: fecha,
        });
        await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} + ${diferencia}` })
          .where(eq(productos.id, producto.id));
        restante.set(producto.id, actual + diferencia);
        ajustes++;
        continue;
      }

      if (conStock.length === 0) {
        continue;
      }

      const formaPago = elegirFormaPago();
      const cliente =
        formaPago === "cuenta_corriente" ||
        Math.random() >= CONFIGURACION.probabilidadConsumidorFinal
          ? elegir(registrados)
          : null;
      const lineas = mezclar(conStock)
        .slice(0, entero(CONFIGURACION.productosPorVenta))
        .map((producto) => {
          const disponible = restante.get(producto.id)!;
          const unidades = Math.min(
            entero(CONFIGURACION.unidadesPorProducto),
            disponible,
          );
          restante.set(producto.id, disponible - unidades);

          return {
            producto,
            cantidad: unidades,
            centavos: aCentavos(producto.precio) * unidades,
          };
        });
      const centavos = lineas.reduce((suma, linea) => suma + linea.centavos, 0);
      const total = deCentavos(centavos);

      const [{ ventaId }] = await tx
        .insert(ventas)
        .values({
          puntoVenta: PUNTO_VENTA,
          numero: siguienteNumero(PUNTO_VENTA),
          creadoEn: fecha,
          clienteId: cliente?.id ?? null,
          clienteNombre: cliente?.nombre ?? CONSUMIDOR_FINAL,
          clienteDocumento: cliente?.documento ?? null,
          formaPago,
          total,
          montoRecibido: formaPago === "contado" ? total : null,
          tarjetaTipo:
            formaPago === "tarjeta" ? elegir([...TIPOS_TARJETA]) : null,
          tarjetaMarca:
            formaPago === "tarjeta" ? elegir([...MARCAS_TARJETA]) : null,
          tarjetaUltimos4:
            formaPago === "tarjeta"
              ? String(Math.floor(Math.random() * 10000)).padStart(4, "0")
              : null,
          usuarioId,
        })
        .returning({ ventaId: ventas.id });

      await tx.insert(itemsVenta).values(
        lineas.map((linea) => ({
          ventaId,
          productoId: linea.producto.id,
          codigo: linea.producto.codigo,
          descripcion: linea.producto.nombre,
          cantidad: linea.cantidad,
          precioUnitario: linea.producto.precio,
          subtotal: deCentavos(linea.centavos),
        })),
      );
      await tx.insert(movimientosStock).values(
        lineas.map((linea) => ({
          productoId: linea.producto.id,
          tipo: "salida" as const,
          origen: "venta" as const,
          cantidad: linea.cantidad,
          ventaId,
          usuarioId,
          creadoEn: fecha,
        })),
      );

      for (const linea of lineas) {
        await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} - ${linea.cantidad}` })
          .where(eq(productos.id, linea.producto.id));
      }

      if (formaPago === "cuenta_corriente" && cliente) {
        await tx.insert(movimientosCuenta).values({
          clienteId: cliente.id,
          tipo: "venta",
          importe: total,
          ventaId,
          usuarioId,
          fecha,
        });
        saldos.set(cliente.id, (saldos.get(cliente.id) ?? 0) + centavos);
      }

      creadas++;
    }

    const pagos = [...saldos].flatMap(([clienteId, saldo]) => {
      const porcentaje = entero({ min: 20, max: 80 });
      const centavos =
        Math.floor((saldo * porcentaje) / 100 / 100_000) * 100_000;

      return Math.random() < CONFIGURACION.probabilidadPago && centavos > 0
        ? [{ clienteId, importe: deCentavos(centavos) }]
        : [];
    });

    if (pagos.length > 0) {
      const [{ ultimo }] = await tx
        .select({ ultimo: max(movimientosCuenta.reciboNumero) })
        .from(movimientosCuenta);
      const primero = (ultimo ?? 0) + 1;

      await tx.insert(movimientosCuenta).values(
        pagos.map((pago, indice) => ({
          ...pago,
          tipo: "pago" as const,
          observacion: "Pago parcial de prueba",
          reciboNumero: primero + indice,
          usuarioId,
        })),
      );
    }

    const limites = registrados.filter(
      () => Math.random() < CONFIGURACION.probabilidadLimite,
    );

    for (const cliente of limites) {
      const pagado = pagos.find((pago) => pago.clienteId === cliente.id);
      const saldo =
        (saldos.get(cliente.id) ?? 0) -
        (pagado ? aCentavos(pagado.importe) : 0);
      const escalones =
        Math.floor(saldo / ESCALON_LIMITE) + entero(CONFIGURACION.margenLimite);

      await tx
        .update(clientes)
        .set({ limiteCredito: deCentavos(escalones * ESCALON_LIMITE) })
        .where(eq(clientes.id, cliente.id));
    }

    return {
      clientes: registrados.length,
      limites: limites.length,
      ventas: creadas,
      pagos: pagos.length,
      ajustes,
    };
  });

  console.log(
    `Clientes: ${resumen.clientes} (${resumen.limites} con límite de crédito). Ventas: ${resumen.ventas}. Pagos: ${resumen.pagos}. Ajustes de stock: ${resumen.ajustes}.`,
  );
}

async function asignarTapas() {
  await db.transaction(async (tx) => {
    for (const [codigo, imagenId] of Object.entries(TAPAS)) {
      await tx
        .update(productos)
        .set({ imagenUrl: `${BASE_TAPAS}/${imagenId}.webp` })
        .where(and(eq(productos.codigo, codigo), isNull(productos.imagenUrl)));
    }
  });

  console.log("Tapas asignadas a los productos sin imagen.");
}

async function sembrar() {
  const usuarioId = await crearAdministrador();
  await reiniciarDemostracion();
  await crearProductos(usuarioId);
  await asignarTapas();
  await crearVentas(usuarioId);
}

sembrar()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
