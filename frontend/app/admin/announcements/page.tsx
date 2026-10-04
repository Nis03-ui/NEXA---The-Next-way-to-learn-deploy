"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, CheckCircle2, Megaphone, RefreshCw, Send } from "lucide-react"
import AppShell from "@/components/layout/AppShell"
import { admin, type AdminAnnouncement } from "@/lib/api"
import { notifications } from "@/lib/lms"

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncement[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function load() {
    try { setLoading(true); setError(""); setItems(await admin.getAnnouncements()) }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load announcements.") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || !message.trim()) return
    try {
      setSending(true); setError(""); setSuccess("")
      const result = await notifications.announcement({ title: title.trim(), message: message.trim() })
      setSuccess(`${result.recipients} student${result.recipients === 1 ? "" : "s"} notified successfully.`)
      setTitle(""); setMessage("")
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to send announcement.") }
    finally { setSending(false) }
  }

  return (
    <AppShell allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300"><Megaphone size={13}/> Communications</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Announcements</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Create a new college-wide announcement and keep a readable history of previous messages sent to students.</p>
        </motion.section>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17}/>{success}</div>}

        <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><Bell size={18}/></div><div><h2 className="text-xl font-black text-slate-950">New announcement</h2><p className="text-xs text-slate-500">Sent to all registered students.</p></div></div>
            <label className="mt-6 block text-xs font-bold text-slate-700">Title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Mid-term examination schedule" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400 focus:bg-white"/></label>
            <label className="mt-4 block text-xs font-bold text-slate-700">Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7} placeholder="Write the message students should receive..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-slate-400 focus:bg-white"/></label>
            <button type="submit" disabled={sending || !title.trim() || !message.trim()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40"><Send size={15}/>{sending ? "Sending…" : "Send announcement"}</button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6"><div><h2 className="text-xl font-black text-slate-950">Announcement history</h2><p className="mt-1 text-xs text-slate-500">{items.length} message{items.length === 1 ? "" : "s"} recorded</p></div><button type="button" onClick={load} disabled={loading} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50" aria-label="Refresh"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/></button></div>
            {loading ? <p className="p-8 text-sm text-slate-400">Loading history…</p> : items.length === 0 ? <div className="p-10 text-center"><Megaphone className="mx-auto text-slate-300" size={28}/><p className="mt-3 text-sm font-semibold text-slate-500">No announcements yet.</p></div> : <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.id} className="p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-base font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{formatDate(item.created_at)}</p></div><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{item.recipients} recipients</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p></article>)}</div>}
          </section>
        </section>
      </div>
    </AppShell>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}
