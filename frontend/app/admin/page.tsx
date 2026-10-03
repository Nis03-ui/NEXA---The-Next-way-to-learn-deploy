"use client"

import {
  Activity,
  BookOpen,
  Loader2,
  Shield,
  Trash2,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import AppShell from "@/components/layout/AppShell"
import { admin, type AdminUser, type Role } from "@/lib/api"
import { useAuth } from "@/providers/AuthProvider"

export default function AdminPage() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  async function loadUsers() {
    try {
      setLoading(true)
      setError("")

      const data = await admin.getUsers()
      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const stats = useMemo(() => {
    return {
      users: users.length,
      teachers: users.filter(
        (item) => item.role === "TEACHER",
      ).length,
      students: users.filter(
        (item) => item.role === "STUDENT",
      ).length,
      admins: users.filter(
        (item) => item.role === "ADMIN",
      ).length,
    }
  }, [users])

  async function handleRoleChange(
    userId: number,
    role: Role,
  ) {
    if (userId === currentUser?.id) return

    try {
      setActionUserId(userId)
      setError("")

      const updated = await admin.updateRole(
        userId,
        role,
      )

      setUsers((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update role.",
      )
    } finally {
      setActionUserId(null)
    }
  }

  async function handleDelete(
    target: AdminUser,
  ) {
    if (target.id === currentUser?.id) return

    const confirmed = window.confirm(
      `Delete ${target.name}'s account? This action cannot be undone.`,
    )

    if (!confirmed) return

    try {
      setActionUserId(target.id)
      setError("")

      await admin.deleteUser(target.id)

      setUsers((current) =>
        current.filter(
          (item) => item.id !== target.id,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete user.",
      )
    } finally {
      setActionUserId(null)
    }
  }

  return (
    <AppShell allowedRoles={["ADMIN"]}>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Admin Control Center
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            NEXA Administration
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage members and control access across
            the NEXA learning platform.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users size={19} />}
            value={stats.users}
            label="Total users"
          />

          <StatCard
            icon={<Shield size={19} />}
            value={stats.teachers}
            label="Teachers"
          />

          <StatCard
            icon={<BookOpen size={19} />}
            value={stats.students}
            label="Students"
          />

          <StatCard
            icon={<Activity size={19} />}
            value={stats.admins}
            label="Administrators"
          />
        </div>

        {/* Members */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Team Members
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Assign roles and manage NEXA accounts.
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              {users.length} members
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Loading members...
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center px-6 text-center">
              <div>
                <Users
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No users found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Registered users will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Member
                    </th>

                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Role
                    </th>

                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((member) => {
                    const isCurrentUser =
                      member.id === currentUser?.id

                    const busy =
                      actionUserId === member.id

                    const initials =
                      member.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(
                          (part) =>
                            part[0]?.toUpperCase(),
                        )
                        .join("") || "U"

                    return (
                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {member.name}
                                </p>

                                {isCurrentUser && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                                    You
                                  </span>
                                )}
                              </div>

                              <p className="truncate text-xs text-slate-400">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={member.role}
                            disabled={
                              isCurrentUser || busy
                            }
                            onChange={(event) =>
                              handleRoleChange(
                                member.id,
                                event.target
                                  .value as Role,
                              )
                            }
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                            aria-label={`Role for ${member.name}`}
                          >
                            <option value="STUDENT">
                              Student
                            </option>

                            <option value="TEACHER">
                              Teacher
                            </option>

                            <option value="ADMIN">
                              Admin
                            </option>
                          </select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={
                              isCurrentUser || busy
                            }
                            onClick={() =>
                              handleDelete(member)
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            {busy ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}

                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Role explanation */}
        <section className="grid gap-4 md:grid-cols-3">
          <RoleCard
            title="Admin"
            description="Manages members and controls platform access."
          />

          <RoleCard
            title="Teacher"
            description="Creates learning content, uploads resources and manages quizzes."
          />

          <RoleCard
            title="Student"
            description="Learns through NEXA Tutor, resources and quizzes."
          />
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <p className="mt-5 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-400">
        {label}
      </p>
    </div>
  )
}

function RoleCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  )
}
