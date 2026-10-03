
"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  WandSparkles,
} from "lucide-react"

export default function NexaDashboardCard() {
  return (
    <section className="nexa-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles size={18} />

              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-950">
                Your NEXA companion
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Ready whenever you need help.
              </p>
            </div>
          </div>

          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 sm:inline-flex">
            ONLINE
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Companion area */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white">
          {/* Ambient effects */}
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-start justify-between">
              {/* Original NEXA placeholder/avatar mark */}
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] shadow-lg"
              >
                <div className="absolute inset-2 rounded-xl border border-blue-400/20" />

                <Brain
                  size={27}
                  strokeWidth={1.7}
                  className="relative text-blue-300"
                />

                <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              </motion.div>

              <div className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                AI COMPANION
              </div>
            </div>

            <h3 className="mt-6 text-lg font-bold">
              What are you studying today?
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-300">
              Ask NEXA to explain a difficult concept, work through a
              problem, or help you understand your course material.
            </p>

            <Link
              href="/tutor"
              className="group mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold text-slate-950 transition hover:bg-slate-100"
            >
              <MessageCircle size={14} />

              Start a conversation

              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <WandSparkles size={13} className="text-blue-500" />

            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              NEXA can help with
            </p>
          </div>

          <div className="grid gap-2">
            <FeatureItem text="Explain difficult concepts" />
            <FeatureItem text="Answer course questions" />
            <FeatureItem text="Work through problems" />
            <FeatureItem text="Use relevant study material" />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-xs text-slate-600">
      <CheckCircle2
        size={14}
        className="shrink-0 text-emerald-500"
      />

      <span>{text}</span>
    </div>
  )
}