"use client";

import { useEffect, useRef } from "react";
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
);

const TEXTO = "#a3a3a3";
const GRILLA = "#262626";
const COLORES = ["#4ade80", "#facc15", "#60a5fa", "#f87171"];

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
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }

    const grafico = new Chart(canvas.current, {
      type: "bar",
      data: {
        labels: dias.map((d) => `${d.fecha.slice(8)}/${d.fecha.slice(5, 7)}`),
        datasets: [
          {
            data: dias.map((d) => d.importe),
            backgroundColor: COLORES[0],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
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
      },
    });

    return () => grafico.destroy();
  }, [dias]);

  return (
    <div className="relative h-64">
      <canvas
        ref={canvas}
        role="img"
        aria-label="Ventas diarias de los últimos 30 días"
      />
    </div>
  );
}

export function GraficoFormas({
  formas,
}: {
  formas: { etiqueta: string; importe: number }[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }

    const grafico = new Chart(canvas.current, {
      type: "doughnut",
      data: {
        labels: formas.map((f) => f.etiqueta),
        datasets: [
          {
            data: formas.map((f) => f.importe),
            backgroundColor: COLORES,
            borderColor: "#0a0a0a",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: TEXTO } },
          tooltip: {
            callbacks: { label: (c) => `${c.label}: ${pesos(c.parsed)}` },
          },
        },
      },
    });

    return () => grafico.destroy();
  }, [formas]);

  return (
    <div className="relative h-64">
      <canvas
        ref={canvas}
        role="img"
        aria-label="Ventas del mes por forma de pago"
      />
    </div>
  );
}
