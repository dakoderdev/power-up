# AGENTS.md

Sistema de ventas y gestión comercial (ventas, productos y stock, clientes y cuentas corrientes, usuarios). Next.js, Tailwind, Drizzle sobre Postgres (Neon), Better Auth, Zod + drizzle-zod, deploy en Vercel. El resto de las librerías de UI se decide más adelante. Moneda única: pesos argentinos.

## Reglas
- Toda validación importante (stock, precios, permisos, saldo, cuenta corriente solo para clientes registrados) se hace en el servidor, aunque también exista en el cliente.
- Confirmar una venta es una sola transacción de Drizzle (`db.transaction`): comprobante, detalle, movimientos de stock y deuda se graban juntos o no se graba nada.
- No hagas `git commit` ni `git push`; dejá los cambios en el working tree. Excepción: ayuda pedida para resolver un conflicto de merge.
- Preguntá antes de agregar una dependencia o cambiar el esquema de Drizzle, salvo pedido explícito. Los cambios de esquema van con migración generada por `drizzle-kit generate`, no con `push` sobre la base publicada.
- Login, sesiones y hash de contraseñas los maneja Better Auth; no armes auth propia. El rol (administrador/operador) y el estado activo se chequean en cada server action que lo requiera.
- Los esquemas Zod salen de las tablas con drizzle-zod y se ajustan ahí; el formulario y la server action usan el mismo esquema.
- Preguntá antes de sumar un servicio con costo: el proyecto se publica en planes gratuitos.
- Credenciales y claves solo en variables de entorno (`.env`, ignorado por git); nunca en el código. Mantené `.env.example` al día.
- Prioridad de entrega: primero el flujo de venta integrado (venta → comprobante → stock → cuenta corriente), después productos y clientes, después usuarios, al final lo opcional.
- Al empezar una tarea que edita archivos existentes, corré git fetch y git status -sb. Si la rama está atrasada respecto del remoto, avisame y esperá a que haga pull antes de editar.

## No construir
Integración con ARCA o comprobantes fiscales, cobro real con tarjeta (no se piden ni guardan números de tarjeta), impuestos, descuentos, cuotas, intereses, pagos combinados, devoluciones, anulación o edición de ventas y pagos confirmados, asignación de pagos a facturas concretas, multiempresa, multidepósito, multimoneda, borrado físico de productos, usuarios o clientes. Gráficos, impresión, filtros y roles configurables solo cuando lo obligatorio esté terminado.

## Dominio en corto
- Comprobante con número único; guarda una copia de descripción, precio, cliente y datos del momento: nunca se recalcula desde el producto o cliente actual.
- Stock en unidades enteras, nunca negativo. Cada cambio de stock es un movimiento (entrada/salida, cantidad positiva, motivo, origen: manual o venta). El stock inicial mayor que cero se registra como entrada.
- Producto: código único, precio positivo, activo/inactivo. Un inactivo no entra en ventas nuevas pero sigue en los comprobantes viejos.
- Saldo = ventas en cuenta corriente − pagos. No se admite un pago mayor que el saldo. Contado y tarjeta no generan deuda.
- Usuario inactivo no inicia sesión. La administración de usuarios es solo del administrador, verificado en el servidor. Contraseñas hasheadas.

## Estilo
- Envolvé la lógica en funciones.
- Llaves siempre en if/else/for/while, aunque sea una línea.
- `const` antes que `let`; ternario en vez de reasignar.
- Sin comentarios salvo código genuinamente no obvio.
- Más de 2 argumentos: un objeto como parámetro.
- Constantes que nunca cambian en UPPER_SNAKE_CASE.
- Nombres de 1 a 3 palabras, máximo 5.
- Variables, props y funciones propias en español (`resultado`, `errores`, `pendiente`, `abierto`, `confirmar`, `onListo`). El inglés queda para APIs de librerías (`open`/`onOpenChange`, `db.select`). Nada de `result`, `res`, `data`, `d`, `isPending`, `submit`, `onDone`, `next`, `previous`.
- Archivos y componentes de UI en español (`nueva-venta.tsx`, `pago-dialog.tsx`, no `new-sale.tsx`).
- Importes de dinero sin floats sueltos: columna `numeric(12, 2)` en Drizzle (llega como string; operá en centavos enteros) y formateá con el helper de `lib/` (`$ 1.234,56`).
- Imports relativos dentro de una sección (`./`, `../actions`); alias `@/` para `lib/` y `components/`.
- Antes de terminar, Prettier sobre los archivos tocados (`npx prettier --write <archivos>`). No uses `npm run format`: también formatea componentes de librerías y las migraciones de `drizzle/`.

## Dónde vive cada cosa
- Separación en capas: UI en `app/` y `components/`; lógica de aplicación (casos de uso como `confirmarVenta`, `registrarPago`, `ajustarStock`) en `lib/<modulo>/`; acceso a datos con Drizzle solo desde esa capa, nunca desde componentes. Esquema en `lib/db/schema.ts`, cliente en `lib/db/index.ts`, seed en `lib/db/seed.ts`.
- Antes de crear una constante, etiqueta o helper, buscá en `lib/` si ya existe (formato de moneda y fechas, etiquetas de forma de pago y de tipo de movimiento, colores de badges).
- Una regla de dominio (precio positivo, cantidades enteras, largo de motivo, saldo máximo de pago) se escribe una vez en `lib/` (esquema compartido) y la usan el formulario y la server action.
- Piezas compartidas entre diálogos de una sección van a un archivo propio (p. ej. `clientes/_comun/campos-cliente.tsx`); un diálogo no importa de otro.
- Un componente de más de ~300 líneas o con pasos inline (p. ej. el armado de venta con alta de cliente) se separa en componentes.

## Specs: quién gana ante un conflicto
`specs/<modulo>.md` es la fuente de verdad de las reglas de negocio. Usala para desempatar: si lo que te pido, lo que encontraste en el código o una "buena práctica" contradicen la spec, no elijas vos. Frená, mostrame el choque y esperá. Si decido cambiar la regla, actualizá la spec en el mismo cambio que el código.

- Cada hecho vive en un solo lugar: reglas en la spec, datos en `lib/db/schema.ts`, estilo en este archivo. No los copies entre sí.
- Requisitos con ID, uno por línea y testeables (`V-03: un pago no puede superar el saldo.`). Los tests citan el ID.
- `[abierto]` = duda sin resolver: frená y preguntá, no adivines.
- **Descartado** y **Decisiones** (una línea fechada con el porqué) evitan reabrir lo ya resuelto.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->