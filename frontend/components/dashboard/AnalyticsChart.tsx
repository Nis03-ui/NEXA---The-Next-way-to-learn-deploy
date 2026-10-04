"use client"

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type AnalyticsChartProps = {
  labels: string[]
  values: number[]
  label: string
}

export default function AnalyticsChart({
  labels,
  values,
  label,
}: AnalyticsChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderRadius: 8,
        borderSkipped: false as const,
      },
    ],
  }

  return (
    <div className="h-64 w-full">
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: "#94a3b8",
                maxRotation: 0,
                autoSkip: true,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                color: "#94a3b8",
              },
              grid: {
                color: "rgba(148, 163, 184, 0.16)",
              },
            },
          },
        }}
      />
    </div>
  )
}
