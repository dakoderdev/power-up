# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Operadores y administradores de un comercio que vende principalmente videojuegos y consolas. Usan el sistema todo el día desde escritorio o notebook (mostrador, mouse y teclado) para registrar ventas, consultar productos y stock, y llevar cuentas corrientes de clientes registrados. Hay dos roles: administrador y operador. El celular es solo de consulta.

## Product Purpose

Sistema interno de ventas y gestión comercial: ventas con comprobante, productos y stock, clientes y cuentas corrientes, usuarios. Éxito: una venta se confirma rápido y deja comprobante, stock y deuda consistentes. Moneda única: pesos argentinos. Interfaz en español rioplatense.

## Positioning

Herramienta de trabajo de un comercio gamer: la identidad retro/pixel es de la marca "Power Up", pero el sistema se usa durante horas, así que prima la legibilidad.

## Operating Context

- Todo requiere sesión iniciada; no hay registro público. Los usuarios los crea el administrador; el primero sale del seed.
- Un usuario inactivo no inicia sesión. Mensajes de error de login genéricos.
- Login con Better Auth. Identificador de acceso: se prefiere correo electrónico, sin cerrar la decisión.
- Fuente de verdad de reglas: `specs/sistema.md`.

## Capabilities and Constraints

Next.js, Tailwind, Drizzle sobre Postgres (Neon), Better Auth, Zod, deploy en Vercel. Planes gratuitos. Sin lógica de negocio todavía: el diseño se hace antes. Librería de UI sin decidir.

## Brand Commitments

Nombre: Power Up. Identidad retro/pixel/gaming (inspiración: pixel art, terminal verde neón sobre negro, Xbox 2013/360, Wizardshock, Internet Pin). Alcance acordado: la identidad vive en detalles de marca (login, logo, íconos, estados vacíos, comprobante); tablas y formularios de trabajo se mantienen limpios y legibles.

## Evidence on Hand

Imagen de referencias del usuario (mosaico de inspiración). No hay logo ni paleta definidos. No inventar clientes, productos ni cifras de negocio.

## Product Principles

- Legibilidad de trabajo por encima de la nostalgia: el pixel es marca, no ruido.
- Cada pantalla sirve a la tarea de quien opera, de escritorio, con teclado.
- Las reglas importantes viven en el servidor; la interfaz las explica, no las decide.
- El login no revela qué cuentas existen.
