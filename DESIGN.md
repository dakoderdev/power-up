# Guía de diseño

Reglas visuales de la interfaz. Las marcadas `[abierto]` son propuesta a revisar; el resto está acordado. Si algo que necesitás no está acá, preguntá antes de inventar un valor.

## Color

- DI-01: solo se usan `verde`, `black`, `white`, la escala `neutral` y `yellow-400`/`red-400` (solo para marcar pendientes/errores), y `red-500` solo para el total adeudado. No se usan otros colores ni hex sueltos.
- DI-02: `verde` va solo en el botón primario, el ícono de la sección activa, la selección de texto y el foco. Es el color de acento. Única excepción: las tapas de producto llevan el degradado de DI-32.
- DI-03: el fondo de página, la barra lateral y el encabezado de página son `black`. Los campos van en `neutral-900`. Excepción: un campo secundario que acompaña a uno principal (por ejemplo, un filtro u orden junto a la búsqueda) puede ir con `claseBoton({ variante: "secundario", enFormulario: true })` y fondo `black`. Dentro de un formulario, todos los campos van iguales.
- DI-04: los bordes van en `neutral-800`, `neutral-600` al pasar el mouse y `neutral-400` con el foco. Los separadores internos van en `neutral-900`; el borde entre la barra lateral y el contenido va en `neutral-950`.
- DI-05: el texto principal va en `white` y el secundario en `neutral-400`. En las filas de tablas y listados, el secundario va en `neutral-300`. `neutral-500` queda solo para ayudas y placeholders, nunca para información necesaria.
- DI-20: `yellow-400`, `red-400` y `red-500` se usan solo como color de texto o de borde, nunca como fondo relleno. En los avisos de texto, el amarillo va atenuado (`text-yellow-400/75`) y marca solo el dato clave, no la frase entera.

## Foco y hover

- DI-21: el foco por teclado es el contorno verde global de `app/globals.css` (`:focus-visible`). No se agrega otro anillo ni se apaga, salvo en los campos. Excepción: cuando un radio está oculto (`sr-only`) dentro de una etiqueta con forma de botón, la etiqueta muestra el mismo contorno con `has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-verde`, porque el contorno del radio no se ve.
- DI-22: los campos de texto son la única excepción: apagan el contorno y marcan el foco con borde `neutral-400` (ya lo hace `CLASE_CAMPO`).
- DI-23: pasar el mouse aclara el texto o el borde; nunca agrega un fondo. La única excepción es el botón primario, que baja la opacidad del verde. Un enlace de texto que ya está en `white` no puede aclararse: se subraya con `underline-offset-4`.
- DI-19: en la barra lateral, el ítem activo lleva fondo `neutral-950`, borde `neutral-800`, texto `white` e ícono `verde`, sin cambios al pasar el mouse. Los demás ítems van en `neutral-400` con borde transparente y pasan a `white` al pasar el mouse. "Cerrar sesión" se comporta como un ítem no activo.

## Tipografía

- DI-06: `font-pixel` se usa solo en el h1 de página (`uppercase text-5xl leading-none tracking-[-0.01em]`, dentro de `EncabezadoPagina`) y en el h2 de sección (`text-3xl leading-none tracking-[-0.01em]`). El h3 y lo de abajo van en sans, `text-[0.9375rem] font-medium`. `font-pixel` no va en botones, tablas, etiquetas ni textos.
- [abierto] DI-07: solo hay tres tamaños de texto: `text-[0.9375rem]` para el cuerpo, `text-sm` para el secundario y `text-[0.8125rem]` para lo mínimo (rol del usuario, badges). Excepción única: el h1 del login, `text-7xl`.
- DI-08: los importes y las cantidades usan `tabular-nums` y se alinean a la derecha en tablas. Se formatean con el helper de `lib/` (`$ 1.234,56`).

## Tamaños y forma

- DI-09: los campos, los botones de formulario y las filas de tabla o listado miden `h-11`; los botones del encabezado de página `h-10` (`h-11` debajo de `lg`); los ítems de menú y los encabezados de columna `h-9`. Excepción: en el detalle de una venta en armado, la fila de producto lleva dos líneas (nombre arriba; código y stock abajo, en `text-sm`) con `py-2`, para dejar a la vista el stock sin quitarle espacio a cantidad, precio y subtotal.
- DI-10: los íconos miden `size-5`; la única excepción es el botón de menú en celular, que mide `size-6`.
- DI-11: todo lleva esquinas rectas, sin `rounded`. No se usan sombras, blur ni gradientes. Excepciones: las tapas de producto (DI-32), los botones flotantes en celular (DI-15) y el brillo de los bloques de carga (DI-30).
- DI-32: las tapas de producto llevan `rounded-xs` y miden `h-8 w-6`. Sin imagen, o si la imagen no carga, se ve el fondo `bg-linear-to-br from-white to-verde to-60%`. Cuando se apilan dos, la de atrás mide `h-7 w-5`, va centrada en alto (`top-0.5`, excepción a DI-12) y corrida `left-3`, con `opacity-50`; la de adelante lleva `shadow-[2px_0_0_0_black]`, sólida y sin desenfoque, para separarlas. En un listado de ventas, la tapa va seguida de `×N` (unidades del primer juego, si son más de una; va a la izquierda, excepción a DI-08), su nombre y, si la venta tiene otros juegos, un badge `+N más` con el estilo de DI-28. En la grilla de productos, la tapa ocupa todo el ancho de la celda con proporción `aspect-3/4`.
- DI-33: el botón badge `+N más` (excepción a DI-25) tiene un borde que pasa a `neutral-600` al pasar el mouse. Abre, con mouse, foco o toque, un panel `popover` en `black` con borde `neutral-800`, `p-3` y esquinas rectas, que lista todos los juegos de la venta con tapa, `×N` y nombre.
- DI-34: debajo de `lg`, las secciones apiladas de una página se separan con `border-t border-neutral-900` y `pt-10`, salvo la primera. Lo mismo vale para secciones apiladas en una misma columna en escritorio.
- DI-12: el espaciado usa solo `0.5, 2, 3, 4, 6, 8, 10, 12`. `0.5` es solo entre ítems apilados de un menú; `12` es solo el margen lateral del contenido en escritorio. Entre el encabezado de la página y el contenido va `gap-8`.
- DI-24: el contenido usa margen lateral `px-4` en celular, `sm:px-8` y `lg:px-12`. El único corte de la estructura es `lg`: debajo de `lg`, la barra lateral pasa a menú. `sm` solo se admite para la densidad de las tablas.

## Componentes

- DI-13: hay cuatro tipos de botón: primario, secundario, de texto y badge (DI-33). Hay como máximo un primario por grupo de botones y máximo 2 por pantalla.
- DI-25: todo botón o enlace con forma de botón usa `claseBoton({ variante, enFormulario })` de `components/estilos.ts`; todo campo de texto usa `CLASE_CAMPO`. No se escriben clases de botón o campo a mano.
- DI-14: los íconos son solo de `pixelarticons`, se importan por archivo (`pixelarticons/react/Nombre.js`) y van con `aria-hidden`, con texto al lado o, si el control es solo un ícono, con `aria-label` en el control. No se usan emojis ni otra librería.
- DI-15: toda página del sistema empieza con `EncabezadoPagina` (`components/encabezado-pagina.tsx`): el h1 a la izquierda, en la misma fila que los botones "Nuevo producto" y "Nueva venta" a la derecha, y debajo una frase de descripción en `neutral-400`. Queda fijo arriba al bajar en la página. Debajo de `lg`, los dos botones salen del encabezado y quedan fijos abajo a la derecha, apilados con "Nueva venta" abajo de todo; el contenido deja `pb-36` libre para que no tapen nada. Flotando, llevan `shadow-[0_8px_24px_black]` para separarse del contenido que pasa por detrás. No lleva etiquetas encima del título.
- DI-26: en la página de alta de venta o de producto, `EncabezadoPagina` recibe `actual` y oculta el botón que lleva a esa misma página.
- DI-16: antes de crear un componente, buscá uno que ya exista en `components/` o en la sección y usalo. Si hace falta una variante nueva, se pregunta y no se inventa.
- DI-17: no se usan valores arbitrarios (`[...]`) salvo los que figuran en esta guía.
- DI-37: un grupo de opciones excluyentes con forma de botón (vista lista/grilla, forma de pago) muestra la elegida con `claseBoton({ variante: "secundario" })` y las demás con la variante de texto y `border border-transparent`, para que el cambio no mueva nada.
- DI-38: un combobox (campo con búsqueda) usa `CLASE_CAMPO` con un `ChevronDown` de `size-5` en `neutral-400` a la derecha. Su lista se abre debajo, con `mt-2`, en un panel como el de DI-33 (`black`, borde `neutral-800`, `p-3`); las opciones miden `h-11`, van en `neutral-300`, pasan a `white` al pasar el mouse y se separan con `neutral-900`.
- DI-39: el título de una sección (h2) va en una fila con su acción opcional a la derecha (botón de texto o badge); la fila mide `min-h-10`, así la altura no cambia cuando la acción aparece o desaparece.
- [abierto] DI-40: un componente de campo compartido en `components/` (etiqueta, campo, ayuda y error, con el estilo de DI-31) para los formularios. Hoy ese bloque se repite casi igual en `ventas/nueva/alta-cliente.tsx` y `productos/_comun/formulario-producto.tsx`. Se discutió el 2026-11-10 y se dejó para el módulo de clientes, donde aparece un tercer uso.

## Tablas y listados

- DI-27: los encabezados de columna van en `text-sm font-medium text-neutral-400`, en una fila `h-9`; las filas, con la altura de DI-09 y separador `neutral-900` abajo, menos la última. Sin fondos alternados ni bordes verticales.
- DI-28: los badges (activo/inactivo, entrada/salida, forma de pago y contadores como "N productos") son texto `text-[0.8125rem]` con borde `neutral-800`, `px-2`, `h-6`. Solo cambian el color del texto, nunca el fondo; las etiquetas y colores salen de `lib/`.
- DI-35: debajo de `sm`, las tablas ocultan sus columnas secundarias: la de ventas oculta Comprobante, Hora y Forma de pago; la de productos, Código y Estado; el detalle de una venta en armado, Precio.
- DI-36: en un listado agrupado por día, cada grupo lleva un título (el día en `text-[0.9375rem] font-medium` y `white` a la izquierda; cantidad y total en `text-sm text-neutral-400` a la derecha) seguido de su propia fila de encabezados de columna. Entre grupos va `pt-10`.

## Estados

- DI-29: el estado vacío es un recuadro con borde punteado `neutral-800` y texto `text-sm text-neutral-500`, que dice qué falta y, si hay algo por hacer, cómo cargarlo.
- DI-30: mientras carga una página se muestran bloques con la clase `esqueleto` (de `app/globals.css`: base `neutral-950` con un brillo `neutral-900` que la recorre y borde `neutral-900`, excepción a DI-04) del tamaño del contenido; no se usan spinners. Un botón que envía muestra el verbo en gerundio ("Ingresando…") y queda deshabilitado.
- [abierto] DI-31: los errores de campo van debajo del campo en `text-sm text-red-400`, con borde `red-400` en el campo; los errores generales van con `role="alert"` arriba del botón que envía.

## Textos

- [abierto] DI-18: los textos van en voseo rioplatense. Los botones dicen la acción con un verbo ("Confirmar venta" y no "Aceptar"). Los errores dicen qué pasó y cómo seguir.
