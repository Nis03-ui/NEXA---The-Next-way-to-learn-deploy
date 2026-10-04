"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, CheckCircle2, Clock3, Loader2, Search, UserCircle2, Users } from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { courses, type AdminCourse } from "@/lib/lms"

export default function AdminCoursesPage() {
  const [courseList, setCourseList] = useState<AdminCourse[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError("")
        setCourseList(await courses.adminOverview())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load registered courses.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return courseList
    return courseList.filter((course) =>
      [course.title, course.subject, course.teacher_name, course.teacher_email].join(" ").toLowerCase().includes(q),
    )
  }, [courseList, search])

  return (
    <AppShell allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-slate-950 p-5 text-white sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Admin view</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Registered Courses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
            View every registered course, its teacher, publication status, and active student enrollment.
            Course creation and editing remain teacher responsibilities.
          </p>
        </motion.section>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-black text-slate-950">Course registry</h2>
              <p className="mt-1 text-sm text-slate-500">{courseList.length} registered course{courseList.length === 1 ? "" : "s"}</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search course or teacher..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100" />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-4 text-sm font-semibold text-slate-600">{search ? "No matching courses" : "No registered courses yet"}</p></div>
          ) : (
            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
              {filtered.map((course, index) => (
                <motion.article key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.18) }} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{course.subject}</span>
                      <h3 className="mt-3 break-words text-lg font-bold text-slate-950">{course.title}</h3>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${course.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {course.published ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{course.description || "No description provided."}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-slate-400"><UserCircle2 size={14} /><span className="text-[10px] font-bold uppercase tracking-wide">Teacher</span></div><p className="mt-2 truncate text-xs font-bold text-slate-800">{course.teacher_name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{course.teacher_email}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-slate-400"><Users size={14} /><span className="text-[10px] font-bold uppercase tracking-wide">Students</span></div><p className="mt-2 text-xl font-black text-slate-950">{course.enrolled_students}</p><p className="text-[10px] text-slate-400">Active enrollments</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-slate-400"><BookOpen size={14} /><span className="text-[10px] font-bold uppercase tracking-wide">Course ID</span></div><p className="mt-2 text-xl font-black text-slate-950">#{course.id}</p><p className="text-[10px] text-slate-400">Registry record</p></div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
