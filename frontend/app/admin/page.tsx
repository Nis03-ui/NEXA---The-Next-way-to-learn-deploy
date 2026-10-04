"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowRight,
  BookOpen,
  Megaphone,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import AppShell from "@/components/layout/AppShell"
import { admin, type AdminAnnouncement, type AdminStats, type User } from "@/lib/api"

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  async function load(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true)
      setError("")
      const [statsData, usersData, announcementData] = await Promise.all([
        admin.getStats(),
        admin.getUsers(),
        admin.getAnnouncements(),
      ])
      setStats(statsData)
      setUsers(usersData)
      setAnnouncements(announcementData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin overview.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const roleData = [
    { name: "Students", value: stats?.total_students ?? 0 },
    { name: "Teachers", value: stats?.total_teachers ?? 0 },
    { name: "Admins", value: stats?.total_admins ?? 0 },
  ]

  const platformData = [
    { name: "Courses", value: stats?.total_courses ?? 0 },
    { name: "Content", value: stats?.total_content ?? 0 },
    { name: "Quizzes", value: stats?.total_quizzes ?? 0 },
    { name: "AI sessions", value: stats?.chat_sessions ?? 0 },
  ]

  return (
    <AppShell allowedRoles={["ADMIN"]}>
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                <Shield size={13} /> Admin overview
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Platform at a glance</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                A compact control center. Open Users or Announcements for the full management experience.
              </p>
            </div>
            <button type="button" onClick={() => load(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </motion.section>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Users", stats?.total_users, Users],
            ["Students", stats?.total_students, Users],
            ["Teachers", stats?.total_teachers, Users],
            ["Courses", stats?.total_courses, BookOpen],
            ["Quizzes", stats?.total_quizzes, BookOpen],
            ["AI sessions", stats?.chat_sessions, Activity],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {(() => { const IconComponent = Icon as LucideIcon; return <IconComponent className="text-slate-400" size={17} /> })()}
              <p className="mt-4 text-2xl font-black text-slate-950">{loading ? "—" : String(value ?? 0)}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{String(label)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">People</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">User distribution</h2>
              <p className="mt-1 text-xs text-slate-500">Live role totals from the admin API.</p>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                    {roleData.map((_, index) => <Cell key={index} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Activity</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Platform usage</h2>
              <p className="mt-1 text-xs text-slate-500">Current totals across the learning platform.</p>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ opacity: 0.08 }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <MiniUsers users={users} loading={loading} />
          <MiniAnnouncements announcements={announcements} loading={loading} />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <QuickLink href="/admin/users" icon={<Users size={17} />} title="Manage users" text="Roles, access and accounts" />
          <QuickLink href="/admin/announcements" icon={<Megaphone size={17} />} title="Announcements" text="Create and review messages" />
          <QuickLink href="/admin/courses" icon={<BookOpen size={17} />} title="Course registry" text="View teacher-owned courses" />
        </section>
      </div>
    </AppShell>
  )
}

function MiniUsers({ users, loading }: { users: User[]; loading: boolean }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Mini registry</p><h2 className="mt-1 text-xl font-black text-slate-950">Recent users</h2></div>
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">View all <ArrowRight size={14} /></Link>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? <p className="p-6 text-sm text-slate-400">Loading users…</p> : users.slice(0, 5).map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
            <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{user.name || "Unnamed user"}</p><p className="truncate text-xs text-slate-400">{user.email}</p></div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{user.role}</span>
          </div>
        ))}
        {!loading && users.length === 0 && <p className="p-6 text-sm text-slate-400">No users registered yet.</p>}
      </div>
    </section>
  )
}

function MiniAnnouncements({ announcements, loading }: { announcements: AdminAnnouncement[]; loading: boolean }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Mini feed</p><h2 className="mt-1 text-xl font-black text-slate-950">Latest announcements</h2></div>
        <Link href="/admin/announcements" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">View all <ArrowRight size={14} /></Link>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? <p className="p-6 text-sm text-slate-400">Loading announcements…</p> : announcements.slice(0, 3).map((item) => (
          <div key={item.id} className="px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-bold text-slate-900">{item.title}</p><span className="shrink-0 text-[10px] font-semibold text-slate-400">{item.recipients} sent</span></div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.message}</p>
            <p className="mt-2 text-[10px] font-medium text-slate-400">{formatDate(item.created_at)}</p>
          </div>
        ))}
        {!loading && announcements.length === 0 && <p className="p-6 text-sm text-slate-400">No announcements yet.</p>}
      </div>
    </section>
  )
}

function QuickLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:-translate-y-0.5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white">{icon}</span><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="text-xs text-slate-500">{text}</p></div><ArrowRight className="ml-auto text-slate-300 transition group-hover:text-slate-700" size={16} /></div></Link>
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
