
"use client"

import { motion } from "framer-motion"
import { Brain, Sparkles, ArrowUpRight } from "lucide-react"
import Link from "next/link"

type DashboardHeaderProps = {
  name: string
  loading?: boolean
}

export default function DashboardHeader({
  name,
  loading = false,
}: DashboardHeaderProps) {
  const firstName = name?.split(" ")[0] || "Student"

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/[0.08] blur-3xl"
      />

      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
            <Sparkles size={13} />
            BCA · Semester 4
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {loading
              ? "Welcome back"
              : `Welcome back, ${firstName}`}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
            Continue your academic journey, track your progress, and
            ask NEXA whenever you need help understanding something.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Learning workspace active
            </span>

            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

            <span>AI-powered study companion</span>
          </div>
        </div>

        <Link
          href="/tutor"
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          <Brain size={17} />

          Ask NEXA

          <ArrowUpRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </motion.section>
  )
}
