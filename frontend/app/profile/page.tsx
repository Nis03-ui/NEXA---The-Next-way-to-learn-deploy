"use client"

import {
  ArrowLeft,
  Check,
  LogOut,
  Mail,
  Pencil,
  Shield,
  User,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import AppShell from "@/components/layout/AppShell"
import { users } from "@/lib/api"
import { useAuth } from "@/providers/AuthProvider"

function ProfileContent() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!user) return

    setName(user.name)
    setEmail(user.email)
  }, [user])

  if (!user) return null

  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "N"

  function startEditing() {
    if (!user) return

    setName(user.name)
    setEmail(user.email)
    setError("")
    setSuccess("")
    setEditing(true)
  }

  function cancelEditing() {
    if (!user) return

    setName(user.name)
    setEmail(user.email)
    setError("")
    setSuccess("")
    setEditing(false)
  }

  async function handleSave() {
    if (saving) return

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedName.length < 2) {
      setError("Name must contain at least 2 characters.")
      return
    }

    if (!trimmedEmail) {
      setError("Email address is required.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const updatedUser = await users.updateMe({
        name: trimmedName,
        email: trimmedEmail,
      })

      /*
       * The backend has returned the updated user.
       *
       * We update the local browser auth state through
       * a small page-level refresh so AuthProvider reloads
       * the current user from /users/me.
       */
      setName(updatedUser.name)
      setEmail(updatedUser.email)

      setSuccess("Profile updated successfully.")
      setEditing(false)

      window.location.reload()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update your profile.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logout()
    } finally {
      router.replace("/login")
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your NEXA account information.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Pencil size={15} />
              Edit profile
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl font-black text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-950">
                {user.name}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user.email}
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                <Shield size={12} />
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Full name
              </label>

              <div className="relative">
                <User
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={saving}
                  autoComplete="name"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={saving}
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="you@example.com"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Changing your email may require email
                verification depending on your account
                configuration.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <Shield
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Account role
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your role is managed by an administrator and
                    cannot be changed from your profile.
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={16} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center gap-4 px-5 py-5 sm:px-8">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <User size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Full name
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-5 sm:px-8">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Mail size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email address
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-5 sm:px-8">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Shield size={18} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account role
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:px-8">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={16} />
                {loggingOut
                  ? "Signing out..."
                  : "Logout"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  )
}