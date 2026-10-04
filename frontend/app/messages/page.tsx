"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Paperclip, Link2, Send, Image as ImageIcon, MessageCircle, Search, X, FileText } from "lucide-react"
import AppShell from "@/components/layout/AppShell"
import { useAuth } from "@/providers/AuthProvider"
import { messages, messageFileUrl, type DirectMessage, type MessageContact } from "@/lib/lms"

export default function MessagesPage() {
  const { user } = useAuth()
  const params = useSearchParams()
  const requestedUserId = Number(params.get("userId"))
  const requestedCourseId = Number(params.get("courseId"))
  const [contacts, setContacts] = useState<MessageContact[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(Number.isFinite(requestedUserId) && requestedUserId > 0 ? requestedUserId : null)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(Number.isFinite(requestedCourseId) && requestedCourseId > 0 ? requestedCourseId : null)
  const [thread, setThread] = useState<DirectMessage[]>([])
  const [text, setText] = useState("")
  const [link, setLink] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => contacts.filter((contact) => (contact.name + " " + contact.email + " " + contact.course_title).toLowerCase().includes(search.toLowerCase())),
    [contacts, search],
  )

  const selected = contacts.find((contact) => contact.id === selectedId) ?? null

  async function loadContacts() {
    try {
      setError("")
      const data = await messages.contacts()
      setContacts(data)
      if (!selectedId && data.length) {
        setSelectedId(data[0].id)
        setSelectedCourseId(data[0].course_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contacts")
    } finally {
      setLoading(false)
    }
  }

  async function loadThread(userId: number) {
    try {
      const data = await messages.list(userId)
      setThread(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load messages")
    }
  }

  useEffect(() => {
    void loadContacts()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    void loadThread(selectedId)
    const timer = window.setInterval(() => void loadThread(selectedId), 5000)
    return () => window.clearInterval(timer)
  }, [selectedId])

  async function send() {
    if (!selectedId || (!text.trim() && !link.trim() && !file)) return
    if (file && file.size > 10 * 1024 * 1024) {
      setError("Files must be 10 MB or smaller.")
      return
    }

    try {
      setSending(true)
      setError("")
      await messages.send(selectedId, {
        body: text,
        link_url: link,
        course_id: selectedCourseId ?? selected?.course_id,
        file: file ?? undefined,
      })
      setText("")
      setLink("")
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      await loadThread(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <AppShell allowedRoles={["STUDENT", "TEACHER"]}>
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><MessageCircle size={18} /></div>
            <div><h1 className="text-lg font-black text-slate-950">Messages</h1><p className="text-xs text-slate-500">Simple course communication between students and teachers.</p></div>
          </div>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid min-h-0 flex-1 md:grid-cols-[300px_1fr]">
          <aside className="hidden min-h-0 border-r border-slate-200 bg-slate-50/60 md:flex md:flex-col">
            <div className="border-b border-slate-200 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <Search size={15} className="text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people..." className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {loading ? <p className="p-4 text-sm text-slate-400">Loading...</p> : filtered.map((contact) => (
                <button type="button" key={contact.id} onClick={() => { setSelectedId(contact.id); setSelectedCourseId(contact.course_id) }} className={["mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition", selectedId === contact.id ? "bg-slate-950 text-white" : "hover:bg-white"].join(" ")}>
                  <div className={["grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold", selectedId === contact.id ? "bg-white/15 text-white" : "bg-slate-200 text-slate-700"].join(" ")}>{contact.name.slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{contact.name}</p><p className={selectedId === contact.id ? "truncate text-xs text-white/60" : "truncate text-xs text-slate-500"}>{contact.course_title}</p></div>
                </button>
              ))}
            </div>
          </aside>

          <main className="flex min-h-0 flex-col">
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">{selected.name.slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{selected.name}</p><p className="truncate text-xs text-slate-500">{selected.role.toLowerCase()} · {selected.course_title}</p></div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
                  {thread.length === 0 && <div className="grid h-full place-items-center text-center text-slate-400"><div><MessageCircle className="mx-auto mb-3" size={28} /><p className="text-sm font-semibold">Start the conversation</p><p className="mt-1 text-xs">Ask about the course, assignments, materials, or anything academic.</p></div></div>}
                  {thread.map((message) => {
                    const mine = message.sender_id === user?.id
                    return (
                      <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                        <div className={["max-w-[82%] rounded-2xl px-4 py-3 shadow-sm", mine ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-800"].join(" ")}>
                          {message.body && <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>}
                          {message.link_url && <a href={message.link_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold underline underline-offset-2"><Link2 size={14} /> {message.link_url}</a>}
                          {message.file_url && (message.file_type?.startsWith("image/") ? (
                            <a href={messageFileUrl(message.file_url)} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl">
                              <img src={messageFileUrl(message.file_url)} alt={message.file_name || "Shared image"} className="max-h-72 w-auto max-w-full rounded-xl object-contain" />
                            </a>
                          ) : (
                            <a href={messageFileUrl(message.file_url)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"><FileText size={15} /> {message.file_name || "Download attachment"}</a>
                          ))}
                          <p className={mine ? "mt-2 text-[10px] text-white/50" : "mt-2 text-[10px] text-slate-400"}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
                  {file && <div className="mb-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"><FileText size={14} /><span className="min-w-0 flex-1 truncate">{file.name}</span><button type="button" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = "" }}><X size={14} /></button></div>}
                  <div className="mb-2 flex gap-2"><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a useful link..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" /></div>
                  <div className="flex items-end gap-2">
                    <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" title="Attach file"><Paperclip size={17} /><input ref={inputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }} rows={1} placeholder="Write a message..." className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400" />
                    <button type="button" disabled={sending || (!text.trim() && !link.trim() && !file)} onClick={() => void send()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">Images and files up to 10 MB · Enter to send · Shift + Enter for a new line</p>
                </div>
              </>
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-slate-400"><div><ImageIcon className="mx-auto mb-3" size={30} /><p className="text-sm font-semibold">Select a teacher or student</p><p className="mt-1 text-xs">Your course connections will appear here.</p></div></div>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  )
}
