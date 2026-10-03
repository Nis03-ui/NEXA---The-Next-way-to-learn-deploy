"use client"

import {
  ArrowLeft,
  LogOut,
  Mail,
  Shield,
  User,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import AppShell from "@/components/layout/AppShell"
import { useAuth } from "@/providers/AuthProvider"

function ProfileContent() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logout()
    } finally {
      router.replace("/login")
    }
  }

  if (!user) return null

  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "N"

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

        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your NEXA account information.
        </p>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl font-black text-white">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {user.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {user.email}
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
                <Shield size={12} />
                {user.role}
              </div>
            </div>
          </div>
        </div>

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
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
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
