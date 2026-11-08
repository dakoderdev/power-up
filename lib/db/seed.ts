import { randomUUID } from "node:crypto";
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { auth } from "../auth";
import { aCentavos, deCentavos } from "../moneda";
import { db } from "./index";
import {
  account,
  clientes,
  itemsVenta,
  movimientosCuenta,
  movimientosStock,
  productos,
  user,
  ventas,
} from "./schema";

const LARGO_MINIMO_CLAVE = 8;

const CONSUMIDOR_FINAL = "Consumidor final";

const CLIENTES: (typeof clientes.$inferInsert)[] = [
  { nombre: "Martina Gómez", documento: "30111222", telefono: "1155550101" },
  {
    nombre: "Lucas Fernández",
    documento: "28444555",
    email: "lucas@ejemplo.com",
  },
  { nombre: "Sofía Ramírez", documento: "35666777", telefono: "1155550102" },
  {
    nombre: "Tomás Herrera",
    documento: "33222111",
    email: "tomas@ejemplo.com",
  },
];

const VENTAS: {
  documento: string | null;
  formaPago: (typeof ventas.$inferInsert)["formaPago"];
  haceMinutos: number;
  items: { codigo: string; cantidad: number }[];
}[] = [
  {
    documento: null,
    formaPago: "contado",
    haceMinutos: 70,
    items: [
      { codigo: "GTA-V", cantidad: 1 },
      { codigo: "FIFA-23", cantidad: 1 },
    ],
  },
  {
    documento: "30111222",
    formaPago: "cuenta_corriente",
    haceMinutos: 55,
    items: [
      { codigo: "ZELDA-TOTK", cantidad: 1 },
      { codigo: "SMB-WONDER", cantidad: 1 },
    ],
  },
  {
    documento: null,
    formaPago: "tarjeta",
    haceMinutos: 40,
    items: [{ codigo: "POKE-ESC", cantidad: 1 }],
  },
  {
    documento: "28444555",
    formaPago: "cuenta_corriente",
    haceMinutos: 30,
    items: [{ codigo: "COD-MW3", cantidad: 1 }],
  },
  {
    documento: "35666777",
    formaPago: "cuenta_corriente",
    haceMinutos: 20,
    items: [{ codigo: "RE-4", cantidad: 2 }],
  },
  {
    documento: "33222111",
    formaPago: "tarjeta",
    haceMinutos: 10,
    items: [{ codigo: "SIMS-4", cantidad: 1 }],
  },
];

const PAGO_PARCIAL = { documento: "30111222", importe: "50000.00" };

const BASE_TAPAS = "https://upload.wikimedia.org/wikipedia/en";

const TAPAS: Record<string, string> = {
  "GTA-V": `${BASE_TAPAS}/a/a5/Grand_Theft_Auto_V.png`,
  "SIMS-4": `${BASE_TAPAS}/7/7f/Sims4_Rebrand.png`,
  "COD-MW3": `${BASE_TAPAS}/f/f6/MWIII_Cover_Art.png`,
  "FIFA-23": `${BASE_TAPAS}/a/a6/FIFA_23_Cover.jpg`,
  "SMB-WONDER": `${BASE_TAPAS}/a/a3/Mariowonder.png`,
  "ZELDA-TOTK": `${BASE_TAPAS}/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg`,
  "AC-VAL": `${BASE_TAPAS}/f/ff/Assassin%27s_Creed_Valhalla_cover.jpg`,
  "HALO-INF": `${BASE_TAPAS}/1/14/Halo_Infinite.png`,
  "RE-4": `${BASE_TAPAS}/d/df/Resident_Evil_4_remake_cover_art.jpg`,
  "SONIC-SS": `${BASE_TAPAS}/f/f7/Sonic_Superstars_Cover_Art.png`,
  "METROID-D": `${BASE_TAPAS}/f/f7/Metroid_Dread_Banner.png`,
};

const JUEGOS: (typeof productos.$inferInsert)[] = [
  {
    codigo: "GTA-V",
    nombre: "Grand Theft Auto V",
    precio: "29999.00",
    stock: 25,
  },
  { codigo: "SIMS-4", nombre: "Los Sims 4", precio: "24999.00", stock: 30 },
  {
    codigo: "COD-MW3",
    nombre: "Call of Duty: Modern Warfare III",
    precio: "69999.00",
    stock: 20,
  },
  { codigo: "FIFA-23", nombre: "FIFA 23", precio: "39999.00", stock: 40 },
  {
    codigo: "SMB-WONDER",
    nombre: "Super Mario Bros. Wonder",
    precio: "64999.00",
    stock: 18,
  },
  {
    codigo: "POKE-ESC",
    nombre: "Pokémon Escarlata",
    precio: "64999.00",
    stock: 22,
  },
  {
    codigo: "ZELDA-TOTK",
    nombre: "The Legend of Zelda: Tears of the Kingdom",
    precio: "69999.00",
    stock: 15,
  },
  {
    codigo: "AC-VAL",
    nombre: "Assassin's Creed Valhalla",
    precio: "34999.00",
    stock: 12,
  },
  {
    codigo: "HALO-INF",
    nombre: "Halo Infinite",
    precio: "39999.00",
    stock: 10,
  },
  { codigo: "RE-4", nombre: "Resident Evil 4", precio: "49999.00", stock: 14 },
  {
    codigo: "SONIC-SS",
    nombre: "Sonic Superstars",
    precio: "44999.00",
    stock: 0,
  },
  {
    codigo: "METROID-D",
    nombre: "Metroid Dread",
    precio: "59999.00",
    stock: 0,
  },
];

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
  const creados = await db.transaction(async (tx) => {
    const insertados = await tx
      .insert(productos)
      .values(JUEGOS)
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
          motivo: "Stock inicial",
          usuarioId,
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

  await db.transaction(async (tx) => {
    await tx
      .insert(clientes)
      .values(CLIENTES)
      .onConflictDoNothing({ target: clientes.documento });

    const clientesGuardados = await tx
      .select()
      .from(clientes)
      .where(
        inArray(
          clientes.documento,
          CLIENTES.map((cliente) => cliente.documento),
        ),
      );
    const productosGuardados = await tx
      .select()
      .from(productos)
      .where(
        inArray(
          productos.codigo,
          JUEGOS.map((juego) => juego.codigo),
        ),
      );
    const clientePorDocumento = new Map(
      clientesGuardados.map((cliente) => [cliente.documento, cliente]),
    );
    const productoPorCodigo = new Map(
      productosGuardados.map((producto) => [producto.codigo, producto]),
    );

    for (const venta of VENTAS) {
      const cliente = venta.documento
        ? clientePorDocumento.get(venta.documento)!
        : null;
      const lineas = venta.items.map((item) => {
        const producto = productoPorCodigo.get(item.codigo)!;

        return {
          producto,
          cantidad: item.cantidad,
          centavos: aCentavos(producto.precio) * item.cantidad,
        };
      });
      const total = deCentavos(
        lineas.reduce((suma, linea) => suma + linea.centavos, 0),
      );

      const [{ ventaId }] = await tx
        .insert(ventas)
        .values({
          creadoEn: new Date(Date.now() - venta.haceMinutos * 60_000),
          clienteId: cliente?.id ?? null,
          clienteNombre: cliente?.nombre ?? CONSUMIDOR_FINAL,
          clienteDocumento: cliente?.documento ?? null,
          formaPago: venta.formaPago,
          total,
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
        })),
      );

      for (const linea of lineas) {
        await tx
          .update(productos)
          .set({ stock: sql`${productos.stock} - ${linea.cantidad}` })
          .where(eq(productos.id, linea.producto.id));
      }

      if (venta.formaPago === "cuenta_corriente" && cliente) {
        await tx.insert(movimientosCuenta).values({
          clienteId: cliente.id,
          tipo: "venta",
          importe: total,
          ventaId,
          usuarioId,
        });
      }
    }

    await tx.insert(movimientosCuenta).values({
      clienteId: clientePorDocumento.get(PAGO_PARCIAL.documento)!.id,
      tipo: "pago",
      importe: PAGO_PARCIAL.importe,
      observacion: "Pago parcial de prueba",
      usuarioId,
    });
  });

  console.log(`Ventas creadas: ${VENTAS.length}.`);
}

async function asignarTapas() {
  await db.transaction(async (tx) => {
    for (const [codigo, imagenUrl] of Object.entries(TAPAS)) {
      await tx
        .update(productos)
        .set({ imagenUrl })
        .where(and(eq(productos.codigo, codigo), isNull(productos.imagenUrl)));
    }
  });

  console.log("Tapas asignadas a los productos sin imagen.");
}

async function sembrar() {
  const usuarioId = await crearAdministrador();
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
