# Power Up

Sistema de ventas y gestión comercial: ventas con comprobante, productos y stock, clientes, cuentas corrientes y pagos, y usuarios con roles. Moneda única: pesos argentinos.

Stack: Next.js, Tailwind, Drizzle ORM sobre Postgres (Neon), Better Auth, Zod con drizzle-zod, deploy en Vercel.

Las reglas de negocio están en [`specs/sistema.md`](specs/sistema.md). El diseño visual está en [`DESIGN.md`](DESIGN.md).

## Credenciales de evaluación

| Rol           | Correo              | Contraseña     |
| ------------- | ------------------- | -------------- |
| Administrador | `admin@ejemplo.com` | `PowerUp2026!` |

Son credenciales de demostración de un proyecto de evaluación. No se usan en ningún entorno real.

Hoy el seed solo crea el administrador. El usuario operador de prueba está pendiente de la definición de las reglas abiertas US-22 a US-24 de la spec.

## Requisitos

- Node.js 20 o superior
- Una base Postgres (Neon, plan gratuito)

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

| Variable                | Descripción                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`          | Cadena de conexión a Postgres                                    |
| `DATABASE_URL_UNPOOLED` | Conexión directa a Postgres, sin pooler                          |
| `AUTH_SECRET`           | Secreto de Better Auth para firmar sesiones                      |
| `BETTER_AUTH_URL`       | URL base del sistema (`http://localhost:3000` en desarrollo)     |
| `SEED_ADMIN_EMAIL`      | Correo del administrador que crea el seed                        |
| `SEED_ADMIN_PASSWORD`   | Contraseña del administrador (mínimo 8 caracteres)               |
| `SEED_ADMIN_NAME`       | Nombre del administrador (opcional, por defecto `Administrador`) |

Para que el seed cree el usuario de evaluación, usar estos valores:

```
SEED_ADMIN_EMAIL=admin@ejemplo.com
SEED_ADMIN_PASSWORD=PowerUp2026!
```

## Seed

`npm run db:seed` hace lo siguiente:

- Crea el administrador con las variables `SEED_ADMIN_*`. Si el correo ya existe, no lo modifica: si se cambia la contraseña en el `.env`, hay que cambiarla también en la base.
- Crea 12 productos de demostración, con su movimiento de stock inicial.
- Crea 4 clientes, 6 ventas (contado, tarjeta y cuenta corriente) y un pago parcial de prueba.
- Es seguro volver a correrlo: no duplica productos, y si ya hay ventas no agrega más.

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
