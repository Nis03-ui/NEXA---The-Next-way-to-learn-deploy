"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Shield, Trash2, UserCog, Users, RefreshCw } from "lucide-react"
import AppShell from "@/components/layout/AppShell"
import { admin, type Role, type User } from "@/lib/api"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<"ALL" | Role>("ALL")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState("")

  async function load() {
    try {
      setLoading(true); setError("")
      setUsers(await admin.getUsers())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.")
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const matchesRole = role === "ALL" || u.role === role
      const matchesQuery = !q || [u.name, u.email, u.role].join(" ").toLowerCase().includes(q)
      return matchesRole && matchesQuery
    })
  }, [users, query, role])

  async function updateRole(user: User, nextRole: Role) {
    if (user.role === nextRole) return
    try {
      setBusy(user.id); setError("")
      const updated = await admin.updateUserRole(user.id, nextRole)
      setUsers((current) => current.map((item) => item.id === user.id ? updated : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.")
    } finally { setBusy(null) }
  }

  async function removeUser(user: User) {
    if (!window.confirm(`Delete ${user.name || user.email}? This cannot be undone.`)) return
    try {
      setBusy(user.id); setError("")
      await admin.deleteUser(user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.")
    } finally { setBusy(null) }
  }

  return (
    <AppShell allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300"><Users size={13} /> User management</span>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Registered users</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Dedicated access management for every NEXA account. Change roles or remove accounts without mixing this workflow into the overview.</p></div>
            <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
          </div>
        </motion.section>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><h2 className="text-xl font-black text-slate-950">Account registry</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} of {users.length} accounts</p></div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"/></div>
              <select value={role} onChange={(e) => setRole(e.target.value as "ALL" | Role)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"><option value="ALL">All roles</option><option value="STUDENT">Students</option><option value="TEACHER">Teachers</option><option value="ADMIN">Admins</option></select>
            </div>
          </div>
          {loading ? <div className="p-10 text-center text-sm text-slate-400">Loading users…</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-400">No matching accounts.</div> : (
            <div className="divide-y divide-slate-100">
              {filtered.map((user) => <div key={user.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500"><UserCog size={18}/></div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{user.name || "Unnamed user"}</p><p className="truncate text-xs text-slate-400">{user.email}</p><p className="mt-1 text-[10px] text-slate-400">Account #{user.id}</p></div></div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <select value={user.role} disabled={busy === user.id} onChange={(e) => updateRole(user, e.target.value as Role)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"><option value="STUDENT">STUDENT</option><option value="TEACHER">TEACHER</option><option value="ADMIN">ADMIN</option></select>
                  <button type="button" disabled={busy === user.id} onClick={() => removeUser(user)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14}/> Delete</button>
                </div>
              </div>)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
