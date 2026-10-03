
"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

import { weeklyStudyData } from "@/lib/dashboard/data"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
)

export default function WeeklyStudyChart() {
  const totalHours = weeklyStudyData.reduce(
    (total, item) => total + item.hours,
    0,
  )

  const averageHours =
    weeklyStudyData.length > 0
      ? totalHours / weeklyStudyData.length
      : 0

  const data = {
    labels: weeklyStudyData.map((item) => item.day),
    datasets: [
      {
        data: weeklyStudyData.map((item) => item.hours),
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        displayColors: false,

        callbacks: {
          label: (context: { parsed: { y: number | null } }) =>
            `${context.parsed.y ?? 0} hours`,
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        border: {
          display: false,
        },

        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
      },

      y: {
        beginAtZero: true,

        border: {
          display: false,
        },

        grid: {
          color: "#f1f5f9",
        },

        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },

          callback: (value: string | number) => `${value}h`,
        },
      },
    },
  }

  return (
    <section className="nexa-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />

            <h2 className="text-base font-bold text-slate-950">
              Weekly study activity
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Your study time over the last seven days.
          </p>
        </div>

        <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-right">
          <p className="text-xs font-semibold text-blue-600">
            {totalHours % 1 === 0
              ? totalHours
              : totalHours.toFixed(1)}
            h total
          </p>

          <p className="mt-0.5 text-[9px] font-medium text-blue-400">
            {averageHours.toFixed(1)}h/day avg.
          </p>
        </div>
      </div>

      <div className="mt-6 h-64">
        <Line data={data} options={options} />
      </div>
    </section>
  )
}
