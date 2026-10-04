"use client"

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  Users,
  UserCog,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import AppShell from "@/components/layout/AppShell"
import AnalyticsChart from "@/components/dashboard/AnalyticsChart"
import { admin, type AdminStats, type User } from "@/lib/api"
import { notifications } from "@/lib/lms"

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [announcementMessage, setAnnouncementMessage] = useState("")
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)
  const [announcementSuccess, setAnnouncementSuccess] = useState("")
  const [announcementError, setAnnouncementError] = useState("")

  const [roleUpdating, setRoleUpdating] = useState<number | null>(null)
  const [deletingUser, setDeletingUser] = useState<number | null>(null)

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const [statsData, usersData] = await Promise.all([
        admin.getStats(),
        admin.getUsers(),
      ])

      setStats(statsData)
      setUsers(usersData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load administration data.",
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const recentUsers = useMemo(
    () => users.slice(0, 5),
    [users],
  )

  const sendAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault()

    const title = announcementTitle.trim()
    const message = announcementMessage.trim()

    if (!title || !message) {
      setAnnouncementError("Title and message are required.")
      return
    }

    try {
      setSendingAnnouncement(true)
      setAnnouncementError("")
      setAnnouncementSuccess("")

      const result = await notifications.announcement({
        title,
        message,
      })

      setAnnouncementSuccess(
        `${result.recipients} student${
          result.recipients === 1 ? "" : "s"
        } notified successfully.`,
      )

      setAnnouncementTitle("")
      setAnnouncementMessage("")
    } catch (err) {
      setAnnouncementError(
        err instanceof Error
          ? err.message
          : "Failed to send announcement.",
      )
    } finally {
      setSendingAnnouncement(false)
    }
  }

  const changeRole = async (
    user: User,
    role: "ADMIN" | "TEACHER" | "STUDENT",
  ) => {
    if (user.role === role) return

    try {
      setRoleUpdating(user.id)
      setError("")

      const updated = await admin.updateUserRole(user.id, role)

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? updated : item,
        ),
      )

      await loadDashboard(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update user role.",
      )
    } finally {
      setRoleUpdating(null)
    }
  }

  const deleteUser = async (user: User) => {
    if (
      !window.confirm(
        `Delete ${user.name || user.email}? This action cannot be undone.`,
      )
    ) {
      return
    }

    try {
      setDeletingUser(user.id)
      setError("")

      await admin.deleteUser(user.id)

      setUsers((current) =>
        current.filter((item) => item.id !== user.id),
      )

      await loadDashboard(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete user.",
      )
    } finally {
      setDeletingUser(null)
    }
  }

  return (
    <AppShell allowedRoles={["ADMIN"]}>
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 sm:space-y-8">
        {/* Header */}
        <motion.section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                <Shield size={13} />
                Admin Control Center
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                NEXA Administration
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                Manage your learning platform, monitor activity,
                control user access, and communicate with students.
              </p>
            </div>

            <motion.button whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </motion.button>
          </div>
        </motion.section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Users size={19} />}
            label="Total Users"
            value={stats?.total_users}
            loading={loading}
            detail="All platform accounts"
          />

          <StatCard
            icon={<GraduationCap size={19} />}
            label="Students"
            value={stats?.total_students}
            loading={loading}
            detail="Student accounts"
          />

          <StatCard
            icon={<UserCog size={19} />}
            label="Teachers"
            value={stats?.total_teachers}
            loading={loading}
            detail="Teaching accounts"
          />

          <StatCard
            icon={<BookOpen size={19} />}
            label="Quizzes"
            value={stats?.total_quizzes}
            loading={loading}
            detail="Available assessments"
          />
          <StatCard
            icon={<BookOpen size={19} />}
            label="Courses"
            value={stats?.total_courses}
            loading={loading}
            detail="Platform courses"
          />

          <StatCard
            icon={<Activity size={19} />}
            label="AI Sessions"
            value={stats?.chat_sessions}
            loading={loading}
            detail="Tutor conversations"
          />


        </section>

        {/* Platform analytics */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Live user data</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Users by role</h2>
              <p className="mt-1 text-xs text-slate-500">Distribution calculated from the users returned by the admin API.</p>
            </div>
            <AnalyticsChart
              labels={["Students", "Teachers", "Admins"]}
              values={[
                users.filter((item) => item.role === "STUDENT").length,
                users.filter((item) => item.role === "TEACHER").length,
                users.filter((item) => item.role === "ADMIN").length,
              ]}
              label="Users"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Platform activity</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Content & AI usage</h2>
              <p className="mt-1 text-xs text-slate-500">Current totals supplied by the live admin statistics endpoint.</p>
            </div>
            <AnalyticsChart
              labels={["Courses", "Content", "Quizzes", "AI sessions"]}
              values={[
                stats?.total_courses ?? 0,
                stats?.total_content ?? 0,
                stats?.total_quizzes ?? 0,
                stats?.chat_sessions ?? 0,
              ]}
              label="Platform totals"
            />
          </div>
        </section>

        {/* Main actions */}
        <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          {/* Announcement */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
                  <Megaphone size={19} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    College-wide announcement
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    Send an important message to every student.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAnnouncement((current) => !current)
                  setAnnouncementError("")
                  setAnnouncementSuccess("")
                }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Bell size={16} />
                {showAnnouncement ? "Close" : "New announcement"}
              </button>
            </div>

            {showAnnouncement && (
              <form
                onSubmit={sendAnnouncement}
                className="mt-6 border-t border-slate-100 pt-6"
              >
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="announcement-title"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Title
                    </label>
                    <input
                      id="announcement-title"
                      value={announcementTitle}
                      onChange={(event) =>
                        setAnnouncementTitle(event.target.value)
                      }
                      maxLength={200}
                      placeholder="e.g. Mid-term examination schedule"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="announcement-message"
                      className="mb-1.5 block text-xs font-bold text-slate-700"
                    >
                      Message
                    </label>
                    <textarea
                      id="announcement-message"
                      value={announcementMessage}
                      onChange={(event) =>
                        setAnnouncementMessage(event.target.value)
                      }
                      rows={5}
                      placeholder="Write the announcement students should receive..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  {announcementError && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                      {announcementError}
                    </div>
                  )}

                  {announcementSuccess && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      {announcementSuccess}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAnnouncement(false)}
                      className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        sendingAnnouncement ||
                        !announcementTitle.trim() ||
                        !announcementMessage.trim()
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={15} />
                      {sendingAnnouncement
                        ? "Sending..."
                        : "Send to students"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* System */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Activity size={19} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  System status
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  NEXA platform services
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <StatusRow label="API" status="Operational" />
              <StatusRow label="Authentication" status="Operational" />
              <StatusRow label="LMS" status="Operational" />
              <StatusRow label="Notifications" status="Operational" />
            </div>
          </div>
        </section>

        {/* Platform overview */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Platform overview
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                Learning ecosystem
              </h2>
            </div>

            <p className="text-xs text-slate-400">
              Live platform statistics
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              icon={<BookOpen size={17} />}
              label="Content"
              value={stats?.total_content}
              detail={`${stats?.published_content ?? 0} published`}
              loading={loading}
            />

            <OverviewCard
              icon={<Users size={17} />}
              label="Students"
              value={stats?.total_students}
              detail="Active learner accounts"
              loading={loading}
            />

            <OverviewCard
              icon={<Shield size={17} />}
              label="Admins"
              value={stats?.total_admins}
              detail="Platform administrators"
              loading={loading}
            />

            <OverviewCard
              icon={<BookOpen size={17} />}
              label="Quizzes"
              value={stats?.total_quizzes}
              detail="Assessment library"
              loading={loading}
            />
          </div>
        </section>

        {/* Users */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Access management
              </p>
              <h2 className="mt-1 text-lg font-black text-slate-900">
                Recent users
              </h2>
            </div>

            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
              {users.length} total loaded
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-3 w-32 rounded bg-slate-100" />
                    <div className="mt-2 h-2.5 w-48 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users
                size={24}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                No users found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  roleUpdating={roleUpdating === user.id}
                  deleting={deletingUser === user.id}
                  onRoleChange={changeRole}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick links / future management */}
        <section className="grid gap-3 sm:grid-cols-3">
          <QuickAction
            icon={<Users size={18} />}
            title="Users"
            description="Manage platform accounts and roles."
            onClick={() => {
              document
                .querySelector(
                  '[aria-label="Recent users section"]',
                )
                ?.scrollIntoView({ behavior: "smooth" })
            }}
          />

          <QuickAction
            icon={<Megaphone size={18} />}
            title="Announcements"
            description="Broadcast important updates to students."
            onClick={() => {
              setShowAnnouncement(true)
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }}
          />

          <QuickAction
            icon={<ArrowUpRight size={18} />}
            title="Learning platform"
            description="Open the student LMS experience."
            onClick={() => {
              window.location.href = "/courses"
            }}
          />
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value?: number
  detail: string
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white">
          {icon}
        </div>

        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
          Live
        </span>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {value ?? 0}
          </p>
        )}

        <p className="mt-1 text-xs font-bold text-slate-700">
          {label}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {detail}
        </p>
      </div>
    </div>
  )
}

function OverviewCard({
  icon,
  label,
  value,
  detail,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value?: number
  detail: string
  loading: boolean
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        {loading ? (
          <div className="h-7 w-12 animate-pulse rounded bg-slate-200" />
        ) : (
          <span className="text-2xl font-black text-slate-950">
            {value ?? 0}
          </span>
        )}

        <span className="text-right text-[10px] leading-4 text-slate-400">
          {detail}
        </span>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  status,
}: {
  label: string
  status: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
      <span className="text-xs font-semibold text-slate-600">
        {label}
      </span>

      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    </div>
  )
}

function UserRow({
  user,
  roleUpdating,
  deleting,
  onRoleChange,
  onDelete,
}: {
  user: User
  roleUpdating: boolean
  deleting: boolean
  onRoleChange: (
    user: User,
    role: "ADMIN" | "TEACHER" | "STUDENT",
  ) => void
  onDelete: (user: User) => void
}) {
  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ||
    user.email?.[0]?.toUpperCase() ||
    "U"

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {user.name || "Unnamed user"}
          </p>

          <p className="truncate text-xs text-slate-400">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={user.role}
          disabled={roleUpdating || deleting}
          onChange={(event) =>
            onRoleChange(
              user,
              event.target.value as
                | "ADMIN"
                | "TEACHER"
                | "STUDENT",
            )
          }
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
          aria-label={`Change role for ${user.name || user.email}`}
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button
          type="button"
          disabled={roleUpdating || deleting}
          onClick={() => onDelete(user)}
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          aria-label={`Delete ${user.name || user.email}`}
        >
          {deleting ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
        </button>
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-900">
          {title}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={15}
        className="shrink-0 text-slate-300 transition group-hover:text-slate-700"
      />
    </button>
  )
}
