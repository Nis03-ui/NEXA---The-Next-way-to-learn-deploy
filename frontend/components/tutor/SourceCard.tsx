import {
  BookOpen,
  Layers3,
} from "lucide-react"

type SourceCardProps = {
  title: string
  subject: string
  chunkIndex?: number
}

export default function SourceCard({
  title,
  subject,
  chunkIndex,
}: SourceCardProps) {
  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
        <BookOpen size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">
          {title}
        </p>

        <div className="mt-1 flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[10px] text-slate-400">
            {subject}
          </span>

          {chunkIndex !== undefined && (
            <>
              <span className="text-slate-300">
                ·
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-medium text-slate-400">
                <Layers3 size={9} />
                Section {chunkIndex + 1}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}