# Power Up

Sistema de ventas y gestión comercial: ventas con comprobante, productos y stock, clientes, cuentas corrientes y pagos, y usuarios con roles. Moneda única: pesos argentinos.

Stack: Next.js, Tailwind, Drizzle ORM sobre Turso (libSQL/SQLite), Better Auth, Zod con drizzle-zod, deploy en Vercel.

Las reglas de negocio están en [`specs/sistema.md`](specs/sistema.md). El diseño visual está en [`DESIGN.md`](DESIGN.md).

## Credenciales de evaluación

| Rol           | Correo              | Contraseña     |
| ------------- | ------------------- | -------------- |
| Administrador | `admin@ejemplo.com` | `PowerUp2026!` |

Son credenciales de demostración de un proyecto de evaluación. No se usan en ningún entorno real.

Hoy el seed solo crea el administrador. El usuario operador de prueba está pendiente de la definición de las reglas abiertas US-22 a US-24 de la spec.

## Requisitos

- Node.js 20 o superior
- Una base en Turso (plan gratuito). En desarrollo también sirve un archivo local: `TURSO_DATABASE_URL=file:local.db`, sin token

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env.local` a partir de `.env.example` y completar las variables (ver tabla abajo).

3. Aplicar las migraciones:

   ```bash
   npm run db:migrate
   ```

4. Cargar el administrador y los datos de demostración:

   ```bash
   npm run db:seed
   ```

5. Levantar el sistema:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con las credenciales de evaluación.

## Variables de entorno

Las credenciales y claves van solo en variables de entorno (`.env.local` o `.env`, ignorados por git). Nunca en el código.

| Variable              | Descripción                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `TURSO_DATABASE_URL`  | URL de la base en Turso (`libsql://...`) o `file:local.db`                                |
| `TURSO_AUTH_TOKEN`    | Token de la base en Turso (no hace falta con un archivo local)                            |
| `AUTH_SECRET`         | Secreto de Better Auth para firmar sesiones                                               |
| `BETTER_AUTH_URL`     | URL base del sistema (`http://localhost:3000` en desarrollo)                              |
| `SEED_ADMIN_EMAIL`    | Correo del administrador que crea el seed                                                 |
| `SEED_ADMIN_PASSWORD` | Contraseña del administrador (mínimo 8 caracteres)                                        |
| `SEED_ADMIN_NAME`     | Nombre del administrador (opcional, por defecto `Administrador`)                          |
| `IGDB_CLIENT_ID`      | Opcional: cuenta de IGDB para cargar juegos en bloque con el asistente (la app no la lee) |
| `IGDB_CLIENT_SECRET`  | Opcional: secreto de la cuenta de IGDB (ídem)                                             |

Para que el seed cree el usuario de evaluación, usar estos valores:

```
SEED_ADMIN_EMAIL=admin@ejemplo.com
SEED_ADMIN_PASSWORD=PowerUp2026!
```

## Seed

`npm run db:seed` hace lo siguiente:

- Crea el administrador con las variables `SEED_ADMIN_*`. Si el correo ya existe, no lo modifica: si se cambia la contraseña en el `.env`, hay que cambiarla también en la base.
- Crea 25 productos de demostración con stock al azar (siempre algunos sin stock y otros con stock bajo), con su movimiento de stock inicial.
- Crea clientes, ventas (la mayoría de hoy, el resto de los días anteriores) (contado, tarjeta y cuenta corriente), pagos parciales y ajustes manuales de stock, todo al azar en cada corrida. Las cantidades y rangos se ajustan en `CONFIGURACION`, al principio de `lib/db/seed.ts`.
- Es seguro volver a correrlo: no duplica productos, y si ya hay ventas no agrega más.
- `npm run db:seed -- --reiniciar` borra productos, clientes, ventas, pagos y movimientos (no los usuarios) y los vuelve a generar. Muestra a qué base apunta antes de borrar y no corre en Vercel. Usalo solo contra una base de desarrollo.

## Roles

| Rol           | Valor interno | Alcance                                                                 |
| ------------- | ------------- | ----------------------------------------------------------------------- |
| Administrador | `admin`       | Opera ventas, productos, clientes, stock y pagos, y administra usuarios |
| Operador      | `operator`    | Opera ventas, productos, clientes, stock y pagos                        |

El rol y el estado activo se verifican en el servidor. Un usuario inactivo no puede iniciar sesión.

## Scripts

| Comando               | Qué hace                                    |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Servidor de desarrollo                      |
| `npm run build`       | Build de producción                         |
| `npm run start`       | Sirve el build de producción                |
| `npm run lint`        | ESLint                                      |
| `npm run db:generate` | Genera una migración desde el esquema       |
| `npm run db:migrate`  | Aplica las migraciones                      |
| `npm run db:seed`     | Carga administrador y datos de demostración |
| `npm run db:demo-hoy` | Mueve las ventas de demostración a hoy      |
