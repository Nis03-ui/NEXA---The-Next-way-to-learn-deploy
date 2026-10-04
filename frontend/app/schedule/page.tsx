"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, Video, X } from "lucide-react"
import AppShell from "@/components/layout/AppShell"
import { adminSchedule, courses, schedule, type AdminScheduleEvent, type Course, type ScheduleEvent } from "@/lib/lms"
import { useAuth } from "@/providers/AuthProvider"

type CalendarEvent = (ScheduleEvent & { scope: "course"; courseTitle?: string }) | (AdminScheduleEvent & { scope: "college"; course_id?: undefined; courseTitle?: string })

function toInputDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export default function SchedulePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const canManageCourse = user?.role === "TEACHER"
  const [courseList, setCourseList] = useState<Course[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "", location: "", meeting_url: "" })

  async function loadData() {
    if (isAdmin) {
      const data = await adminSchedule.list()
      setEvents(data.map(item => ({ ...item, scope: "college" as const })).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
      return
    }
    const data = user?.role === "STUDENT" ? await courses.my() : await courses.mine()
    setCourseList(data)
    const all: CalendarEvent[] = []
    for (const course of data) {
      const courseEvents = await schedule.list(course.id)
      all.push(...courseEvents.map(item => ({ ...item, scope: "course" as const, courseTitle: course.title })))
    }
    const college = await fetchCollegeEvents()
    all.push(...college)
    setEvents(all.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
    if (data.length > 0 && !selectedCourse) setSelectedCourse(data[0].id)
  }

  async function fetchCollegeEvents(): Promise<CalendarEvent[]> {
    return fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1") + "/schedule/college", {
      headers: { Authorization: `Bearer ${localStorage.getItem("nexa_token") || ""}` },
    }).then(async r => {
      if (!r.ok) return []
      const data = await r.json() as AdminScheduleEvent[]
      return data.map(item => ({ ...item, scope: "college" as const }))
    })
  }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    loadData().catch(err => setError(err instanceof Error ? err.message : "Could not load the calendar.")).finally(() => setLoading(false))
  }, [user])

  function resetForm() {
    setForm({ title: "", description: "", start_time: "", end_time: "", location: "", meeting_url: "" })
    setEditing(null)
    setShowForm(false)
  }

  function beginEdit(event: CalendarEvent) {
    setEditing(event)
    setForm({ title: event.title, description: event.description || "", start_time: toInputDate(event.start_time), end_time: toInputDate(event.end_time), location: event.location || "", meeting_url: event.meeting_url || "" })
    setShowForm(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving || !form.title.trim() || !form.start_time || !form.end_time) {
      if (!form.title.trim() || !form.start_time || !form.end_time) setError("Title, start time, and end time are required.")
      return
    }
    if (new Date(form.end_time).getTime() <= new Date(form.start_time).getTime()) {
      setError("End time must be after start time.")
      return
    }
    setSaving(true); setError("")
    const payload = { title: form.title.trim(), description: form.description.trim() || undefined, start_time: new Date(form.start_time).toISOString(), end_time: new Date(form.end_time).toISOString(), location: form.location.trim() || undefined, meeting_url: form.meeting_url.trim() || undefined }
    try {
      if (isAdmin) {
        if (editing && editing.scope === "college") await adminSchedule.update(editing.id, payload)
        else await adminSchedule.create(payload)
      } else if (canManageCourse && selectedCourse) {
        if (editing && editing.scope === "course") await schedule.update(selectedCourse, editing.id, payload)
        else await schedule.create(selectedCourse, payload)
      }
      await loadData(); resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the event.")
    } finally { setSaving(false) }
  }

  async function removeEvent(event: CalendarEvent) {
    if (!window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return
    try {
      setError("")
      if (event.scope === "college") await adminSchedule.delete(event.id)
      else if (selectedCourse) await schedule.delete(selectedCourse, event.id)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the event.") }
  }

  const visibleEvents = useMemo(() => {
    if (isAdmin) return events
    return selectedCourse ? events.filter(item => item.scope === "college" || item.course_id === selectedCourse) : events
  }, [events, selectedCourse, isAdmin])

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 sm:space-y-8">
          <motion.section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{isAdmin ? "College calendar" : "Learning calendar"}</p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Schedule</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{isAdmin ? "Create and manage college-wide activities for students and teachers." : "See your course sessions together with college-wide activities."}</p>
                </div>
                {(isAdmin || (canManageCourse && selectedCourse)) && <button type="button" onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950"><Plus size={16} /> Add event</button>}
              </div>
            </div>
          </motion.section>

          {error && <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss"><X size={16} /></button></div>}

          {!isAdmin && <aside className="rounded-2xl border border-slate-200 bg-white p-3"><p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Courses</p>{courseList.length === 0 ? <p className="px-3 py-5 text-sm text-slate-500">No courses are available yet.</p> : <div className="flex flex-wrap gap-2">{courseList.map(course => <button key={course.id} type="button" onClick={() => setSelectedCourse(course.id)} className={`rounded-xl px-3 py-2 text-left text-sm font-bold ${selectedCourse === course.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600"}`}>{course.title}</button>)}</div>}</aside>}

          {showForm && (isAdmin || canManageCourse) && <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{editing ? "Edit event" : isAdmin ? "New college activity" : "New course event"}</h3><button type="button" onClick={resetForm} aria-label="Close"><X size={16}/></button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Title</span><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="h-11 w-full rounded-xl border px-3 text-sm"/></label>
              <label><span className="mb-1 block text-xs font-semibold">Start</span><input required type="datetime-local" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} className="h-11 w-full rounded-xl border px-3 text-sm"/></label>
              <label><span className="mb-1 block text-xs font-semibold">End</span><input required type="datetime-local" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} className="h-11 w-full rounded-xl border px-3 text-sm"/></label>
              <label><span className="mb-1 block text-xs font-semibold">Location</span><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="h-11 w-full rounded-xl border px-3 text-sm"/></label>
              <label><span className="mb-1 block text-xs font-semibold">Meeting URL</span><input type="url" value={form.meeting_url} onChange={e=>setForm({...form,meeting_url:e.target.value})} className="h-11 w-full rounded-xl border px-3 text-sm"/></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Description</span><textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full rounded-xl border p-3 text-sm"/></label>
            </div>
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={resetForm} className="min-h-10 rounded-xl border px-4 text-sm font-semibold">Cancel</button><button disabled={saving} className="min-h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">{saving ? "Saving…" : editing ? "Save changes" : "Create event"}</button></div>
          </form>}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100"><CalendarDays size={20}/></div><div><h2 className="text-lg font-black text-slate-950">{isAdmin ? "College activities" : "Upcoming events"}</h2><p className="text-xs text-slate-500">{loading ? "Loading…" : `${visibleEvents.length} event${visibleEvents.length === 1 ? "" : "s"}`}</p></div></div>
            <div className="mt-5 space-y-3">{!loading && visibleEvents.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center"><CalendarDays className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-bold">No events yet</p></div> : visibleEvents.map(item => <article key={item.scope + "-" + item.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-col gap-4 sm:flex-row"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><CalendarDays size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="mb-1 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase">{item.scope === "college" ? "College activity" : item.courseTitle}</span></div><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs font-medium text-slate-500">{formatDate(item.start_time)} → {new Date(item.end_time).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</p></div>{((isAdmin && item.scope === "college") || (canManageCourse && item.scope === "course")) && <div className="flex gap-1"><button type="button" onClick={()=>beginEdit(item)} aria-label="Edit event" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100"><Pencil size={15}/></button><button type="button" onClick={()=>removeEvent(item)} aria-label="Delete event" className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={15}/></button></div>}</div>{item.description && <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>}<div className="mt-3 flex flex-wrap gap-2">{item.location && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px]"><MapPin size={12}/>{item.location}</span>}{item.meeting_url && <a href={item.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px]"><Video size={12}/>Join meeting</a>}<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px]"><Clock3 size={12}/>{Math.max(1, Math.round((new Date(item.end_time).getTime()-new Date(item.start_time).getTime())/60000))} min</span></div></div></div></article>)}</div>
          </section>
        </div>
      </motion.div>
    </AppShell>
  )
}
