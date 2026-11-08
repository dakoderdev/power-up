# Guía de diseño

Reglas visuales de la interfaz. Las marcadas `[abierto]` son propuesta a revisar; el resto está acordado. Si algo que necesitás no está acá, preguntá antes de inventar un valor.

## Color

- DI-01: solo se usan `verde`, `black`, la escala `neutral` y `yellow-400`/`red-400` (solo para marcar pendientes/errores). No se usan otros colores ni hex sueltos.
- DI-02: `verde` va solo en el botón primario, el ícono de la sección activa, la selección de texto y el foco. Es el color de acento.
- DI-03: el fondo de página, la barra lateral y el encabezado de página son `black`. Los campos van en `neutral-900`.
- DI-04: los bordes van en `neutral-800`, `neutral-600` al pasar el mouse y `neutral-400` con el foco. Los separadores internos van en `neutral-900`; el borde entre la barra lateral y el contenido va en `neutral-950`.
- DI-05: el texto principal va en `white` y el secundario en `neutral-400`. `neutral-500` queda solo para ayudas y placeholders, nunca para información necesaria.
- DI-20: `yellow-400` y `red-400` se usan solo como color de texto o de borde, nunca como fondo relleno.

## Foco y hover

- DI-21: el foco por teclado es el contorno verde global de `app/globals.css` (`:focus-visible`). No se agrega otro anillo ni se apaga, salvo en los campos.
- DI-22: los campos de texto son la única excepción: apagan el contorno y marcan el foco con borde `neutral-400` (ya lo hace `CLASE_CAMPO`).
- DI-23: pasar el mouse aclara el texto o el borde; nunca agrega un fondo. La única excepción es el botón primario, que baja la opacidad del verde.
- DI-19: en la barra lateral, el ítem activo lleva fondo `neutral-950`, borde `neutral-800`, texto `white` e ícono `verde`, sin cambios al pasar el mouse. Los demás ítems van en `neutral-400` con borde transparente y pasan a `white` al pasar el mouse. "Cerrar sesión" se comporta como un ítem no activo.

## Tipografía

- DI-06: `font-pixel` se usa solo en el h1 de página (`text-5xl leading-none tracking-[-0.01em]`, dentro de `EncabezadoPagina`) y en el h2 de sección (`text-3xl leading-none tracking-[-0.01em]`). El h3 y lo de abajo van en sans, `text-[0.9375rem] font-medium`. `font-pixel` no va en botones, tablas, etiquetas ni textos.
- [abierto] DI-07: solo hay tres tamaños de texto: `text-[0.9375rem]` para el cuerpo, `text-sm` para el secundario y `text-[0.8125rem]` para lo mínimo (rol del usuario, badges). Excepción única: el h1 del login, `text-7xl`.
- [abierto] DI-08: los importes y las cantidades usan `tabular-nums` y se alinean a la derecha en tablas. Se formatean con el helper de `lib/` (`$ 1.234,56`).

## Tamaños y forma

- DI-09: los campos y los botones de formulario miden `h-11`, los botones del encabezado de página `h-10` (`h-11` debajo de `lg`) y las filas de menú o tabla `h-9`.
- DI-10: los íconos miden `size-5`; la única excepción es el botón de menú en celular, que mide `size-6`.
- DI-11: todo lleva esquinas rectas, sin `rounded`. No se usan sombras, blur ni gradientes.
- DI-12: el espaciado usa solo `0.5, 2, 3, 4, 6, 8, 10, 12`. `0.5` es solo entre ítems apilados de un menú; `12` es solo el margen lateral del contenido en escritorio. Entre el encabezado de la página y el contenido va `gap-8`.
- DI-24: el contenido usa margen lateral `px-4` en celular, `sm:px-8` y `lg:px-12`. El único corte de diseño es `lg`: debajo de `lg`, la barra lateral pasa a menú.

## Componentes

- DI-13: hay tres tipos de botón: primario, secundario y de texto. Hay como máximo un primario por grupo de botones y máximo 2 por pantalla.
- DI-25: todo botón o enlace con forma de botón usa `claseBoton({ variante, enFormulario })` de `components/estilos.ts`; todo campo de texto usa `CLASE_CAMPO`. No se escriben clases de botón o campo a mano.
- DI-14: los íconos son solo de `pixelarticons`, se importan por archivo (`pixelarticons/react/Nombre.js`) y van con `aria-hidden` y texto al lado. No se usan emojis ni otra librería.
- DI-15: toda página del sistema empieza con `EncabezadoPagina` (`components/encabezado-pagina.tsx`): el h1 a la izquierda, en la misma fila que los botones "Nuevo producto" y "Nueva venta" a la derecha, y debajo una frase de descripción en `neutral-400`. Queda fijo arriba al bajar en la página. Debajo de `lg`, los dos botones salen del encabezado y quedan fijos abajo a la derecha, apilados con "Nueva venta" abajo de todo; el contenido deja `pb-36` libre para que no tapen nada. No lleva etiquetas encima del título.
- DI-26: en la página de alta de venta o de producto, `EncabezadoPagina` recibe `actual` y oculta el botón que lleva a esa misma página.
- DI-16: antes de crear un componente, buscá uno que ya exista en `components/` o en la sección y usalo. Si hace falta una variante nueva, se pregunta y no se inventa.
- DI-17: no se usan valores arbitrarios (`[...]`) salvo los que figuran en esta guía.

## Tablas y listados

- [abierto] DI-27: los encabezados de columna van en `text-sm font-medium text-neutral-400`; las filas, en `h-9` con separador `neutral-900` abajo. Sin fondos alternados ni bordes verticales.
- [abierto] DI-28: los badges (activo/inactivo, entrada/salida, forma de pago) son texto `text-[0.8125rem]` con borde `neutral-800`, `px-2`, `h-6`. Solo cambian el color del texto, nunca el fondo; las etiquetas y colores salen de `lib/`.

## Estados

- [abierto] DI-29: el estado vacío es un recuadro con borde punteado `neutral-800` y texto `text-sm text-neutral-500`, que dice qué falta y cómo cargarlo.
- [abierto] DI-30: mientras algo carga se muestran bloques `bg-neutral-900` del tamaño del contenido; no se usan spinners. Un botón que envía muestra el verbo en gerundio ("Ingresando…") y queda deshabilitado.
- [abierto] DI-31: los errores de campo van debajo del campo en `text-sm text-red-400`, con borde `red-400` en el campo; los errores generales van con `role="alert"` arriba del botón que envía.

## Textos

- [abierto] DI-18: los textos van en voseo rioplatense. Los botones dicen la acción con un verbo ("Confirmar venta" y no "Aceptar"). Los errores dicen qué pasó y cómo seguir.
