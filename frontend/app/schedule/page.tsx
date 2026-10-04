"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { courses, schedule, type Course, type ScheduleEvent } from "@/lib/lms"
import { useAuth } from "@/providers/AuthProvider"

function toInputDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function SchedulePage() {
  const { user } = useAuth()
  const canManage = user?.role === "TEACHER" || user?.role === "ADMIN"
  const [courseList, setCourseList] = useState<Course[]>([])
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<ScheduleEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    meeting_url: "",
  })

  async function loadCourses() {
    const data = user?.role === "STUDENT" ? await courses.my() : await courses.mine()
    setCourseList(data)
    if (data.length > 0 && !selectedCourse) setSelectedCourse(data[0].id)
  }

  async function loadEvents(courseId: number) {
    const data = await schedule.list(courseId)
    setEvents(data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
  }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    loadCourses()
      .catch(() => setError("Could not load your courses."))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!selectedCourse) {
      setEvents([])
      return
    }
    loadEvents(selectedCourse).catch(() => setError("Could not load the schedule."))
  }, [selectedCourse])

  const selected = useMemo(
    () => courseList.find((course) => course.id === selectedCourse),
    [courseList, selectedCourse],
  )

  function resetForm() {
    setForm({ title: "", description: "", start_time: "", end_time: "", location: "", meeting_url: "" })
    setEditing(null)
    setShowForm(false)
  }

  function beginEdit(event: ScheduleEvent) {
    setEditing(event)
    setForm({
      title: event.title,
      description: event.description || "",
      start_time: toInputDate(event.start_time),
      end_time: toInputDate(event.end_time),
      location: event.location || "",
      meeting_url: event.meeting_url || "",
    })
    setShowForm(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedCourse || saving) return

    if (!form.title.trim() || !form.start_time || !form.end_time) {
      setError("Title, start time, and end time are required.")
      return
    }

    if (new Date(form.end_time).getTime() <= new Date(form.start_time).getTime()) {
      setError("End time must be after start time.")
      return
    }

    setSaving(true)
    setError("")

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      location: form.location.trim() || undefined,
      meeting_url: form.meeting_url.trim() || undefined,
    }

    try {
      if (editing) {
        await schedule.update(selectedCourse, editing.id, payload)
      } else {
        await schedule.create(selectedCourse, payload)
      }
      await loadEvents(selectedCourse)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save schedule event.")
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(event: ScheduleEvent) {
    if (!selectedCourse || !window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return
    try {
      setError("")
      await schedule.delete(selectedCourse, event.id)
      await loadEvents(selectedCourse)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete schedule event.")
    }
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
        <motion.section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Learning calendar</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Schedule</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {canManage ? "Plan and manage sessions across your courses." : "Keep track of your upcoming learning sessions."}
                </p>
              </div>
              {canManage && selectedCourse && (
                <button type="button" onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950">
                  <Plus size={16} /> Add event
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3">
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Courses</p>
            </div>
            {loading ? (
              <p className="px-3 py-5 text-sm text-slate-400">Loading…</p>
            ) : courseList.length === 0 ? (
              <p className="px-3 py-5 text-sm leading-6 text-slate-500">No courses are available for your account yet.</p>
            ) : (
              <div className="space-y-1">
                {courseList.map((course) => (
                  <button key={course.id} type="button" onClick={() => setSelectedCourse(course.id)} className={`w-full rounded-xl px-3 py-3 text-left transition ${selectedCourse === course.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                    <p className="truncate text-sm font-bold">{course.title}</p>
                    <p className={`mt-1 truncate text-[11px] ${selectedCourse === course.id ? "text-slate-300" : "text-slate-400"}`}>{course.subject}</p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100"><CalendarDays size={20} className="text-slate-700" /></div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-950">{selected?.title || "Select a course"}</h2>
                <p className="text-xs text-slate-500">{events.length} event{events.length === 1 ? "" : "s"}</p>
              </div>
            </div>

            {showForm && canManage && selectedCourse && (
              <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-900">{editing ? "Edit event" : "New schedule event"}</h3>
                  <button type="button" onClick={resetForm} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white" aria-label="Close form"><X size={16} /></button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Title</span><input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" /></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-700">Start</span><input required type="datetime-local" value={form.start_time} onChange={e => setForm({...form,start_time:e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" /></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-700">End</span><input required type="datetime-local" value={form.end_time} onChange={e => setForm({...form,end_time:e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" /></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-700">Location</span><input value={form.location} onChange={e => setForm({...form,location:e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" /></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-700">Meeting URL</span><input type="url" value={form.meeting_url} onChange={e => setForm({...form,meeting_url:e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" /></label>
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Description</span><textarea rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200" /></label>
                </div>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={resetForm} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button>
                  <button disabled={saving} className="min-h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Create event"}</button>
                </div>
              </form>
            )}

            <div className="mt-5 space-y-3">
              {!selectedCourse ? (
                <div className="py-12 text-center text-sm text-slate-400">Choose a course to view its schedule.</div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <CalendarDays className="mx-auto text-slate-400" size={24} />
                  <p className="mt-3 text-sm font-bold text-slate-900">No schedule events</p>
                  <p className="mt-1 text-xs text-slate-500">{canManage ? "Add the first class, meeting, deadline, or session." : "Your teacher has not added any sessions yet."}</p>
                </div>
              ) : (
                events.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><CalendarDays size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs font-medium text-slate-500">{formatDate(item.start_time)} → {new Date(item.end_time).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</p></div>
                          {canManage && <div className="flex gap-1"><button type="button" onClick={() => beginEdit(item)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Edit event"><Pencil size={15} /></button><button type="button" onClick={() => removeEvent(item)} className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Delete event"><Trash2 size={15} /></button></div>}
                        </div>
                        {item.description && <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.location && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"><MapPin size={12}/>{item.location}</span>}
                          {item.meeting_url && <a href={item.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"><Video size={12}/>Join meeting</a>}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"><Clock3 size={12}/>{Math.max(1, Math.round((new Date(item.end_time).getTime()-new Date(item.start_time).getTime())/60000))} min</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
      </motion.div>
    </AppShell>
  )
}
