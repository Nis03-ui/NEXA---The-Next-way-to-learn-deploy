"use client"

import { useState } from "react"
import { BookOpen, BrainCircuit, Code2, Database, Globe2, Sigma } from "lucide-react"

type Props = {
  title: string
  subject: string
  thumbnailUrl?: string | null
  className?: string
}

const themes = [
  { match: ["ai", "machine", "ml", "artificial"], icon: BrainCircuit, gradient: "from-violet-700 via-indigo-700 to-slate-950" },
  { match: ["web", "frontend", "backend", "programming", "code"], icon: Code2, gradient: "from-blue-700 via-cyan-700 to-slate-950" },
  { match: ["database", "data", "sql"], icon: Database, gradient: "from-emerald-700 via-teal-700 to-slate-950" },
  { match: ["math", "statistics", "calculus"], icon: Sigma, gradient: "from-amber-600 via-orange-700 to-slate-950" },
  { match: ["english", "language", "communication"], icon: Globe2, gradient: "from-pink-700 via-rose-700 to-slate-950" },
]

function getTheme(subject: string) {
  const value = subject.toLowerCase()
  return themes.find((theme) => theme.match.some((word) => value.includes(word))) ?? {
    icon: BookOpen,
    gradient: "from-slate-800 via-slate-700 to-slate-950",
  }
}

export default function CourseThumbnail({ title, subject, thumbnailUrl, className = "" }: Props) {
  const [failed, setFailed] = useState(false)
  const theme = getTheme(subject)
  const Icon = theme.icon

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {thumbnailUrl && !failed ? (
        <img
          src={thumbnailUrl}
          alt={`${title} course thumbnail`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}>
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur">
                <Icon size={22} />
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur">
                {subject}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">NEXA course</p>
              <p className="mt-1 line-clamp-2 text-lg font-black text-white">{title}</p>
            </div>
          </div>
        </div>
      )}
      {thumbnailUrl && !failed && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10" />
      )}
    </div>
  )
}
