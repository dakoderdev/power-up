"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
);

function leerToken(nombre: string) {
  return typeof document === "undefined"
    ? ""
    : getComputedStyle(document.documentElement)
        .getPropertyValue(`--${nombre}`)
        .trim();
}

if (typeof document !== "undefined") {
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
}

const TEXTO = leerToken("muted-foreground");
const GRILLA = leerToken("border");
const FONDO = leerToken("background");
const COLORES = [1, 2, 3, 4, 5].map((numero) => leerToken(`chart-${numero}`));

function pesos(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export function GraficoDiario({
  dias,
}: {
  dias: { fecha: string; importe: number }[];
}) {
  return (
    <div className="relative h-64">
      <Bar
        role="img"
        aria-label="Ventas diarias de los últimos 30 días"
        data={{
          labels: dias.map((d) => `${d.fecha.slice(8)}/${d.fecha.slice(5, 7)}`),
          datasets: [
            {
              data: dias.map((d) => d.importe),
              backgroundColor: COLORES[0],
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: (c) => pesos(c.parsed.y ?? 0) },
            },
          },
          scales: {
            x: {
              ticks: { color: TEXTO, maxTicksLimit: 10 },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: { color: TEXTO, callback: (v) => pesos(Number(v)) },
              grid: { color: GRILLA },
            },
          },
        }}
      />
    </div>
  );
}

export function GraficoFormas({
  formas,
}: {
  formas: { etiqueta: string; importe: number }[];
}) {
  return (
    <div className="relative h-64">
      <Doughnut
        role="img"
        aria-label="Ventas del mes por forma de pago"
        data={{
          labels: formas.map((f) => f.etiqueta),
          datasets: [
            {
              data: formas.map((f) => f.importe),
              backgroundColor: COLORES,
              borderColor: FONDO,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: TEXTO } },
            tooltip: {
              callbacks: { label: (c) => `${c.label}: ${pesos(c.parsed)}` },
            },
          },
        }}
      />
    </div>
  );
}
