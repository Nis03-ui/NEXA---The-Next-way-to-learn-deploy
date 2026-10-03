
"use client"

import Link from "next/link"
import { ArrowRight, MessageSquare, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import { ai } from "@/lib/api"
import type { ChatSession } from "@/lib/api"

export default function ContinueLearning() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSessions() {
      try {
        const data = await ai.sessions()

        if (mounted) {
          setSessions(data.slice(0, 4))
        }
      } catch (error) {
        console.error("Failed to load learning sessions:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadSessions()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="nexa-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-blue-500" />
            <h2 className="text-base font-bold text-slate-950">
              Continue learning
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Pick up where you left off with NEXA.
          </p>
        </div>

        <Link
          href="/tutor"
          className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <span className="hidden sm:inline">Study with NEXA</span>
          <span className="sm:hidden">Open tutor</span>
          <ArrowRight
            size={13}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <LoadingState />
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          sessions.map((session) => (
            <Link
              key={session.id}
              href={`/tutor?session=${session.id}`}
              className="group block px-6 py-5 transition hover:bg-slate-50"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                  <MessageSquare size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {session.title || "NEXA study session"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatSessionDate(session.created_at)}
                      </p>
                    </div>

                    <ArrowRight
                      size={15}
                      className="mt-0.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
                    />
                  </div>

                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                      <Sparkles size={10} />
                      NEXA session
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="divide-y divide-slate-100">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-start gap-4 px-6 py-5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100" />

          <div className="min-w-0 flex-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />

            <div className="mt-3 h-5 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        <MessageSquare size={18} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        No study sessions yet
      </h3>

      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500">
        Start a conversation with NEXA and your recent learning sessions will
        appear here.
      </p>

      <Link
        href="/tutor"
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
      >
        Start learning
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function formatSessionDate(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "Recent session"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}
