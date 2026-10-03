"use client"

import {
  Bell,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import Sidebar from "@/components/dashboard/Sidebar"
import { useAuth } from "@/providers/AuthProvider"

export default function Topbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const router = useRouter()
  const { user, logout } = useAuth()

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "N"

  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)
    setProfileOpen(false)

    try {
      await logout()
    } finally {
      router.replace("/login")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:h-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hidden lg:block">
          <h2 className="text-sm font-semibold text-slate-900">
            Learning Workspace
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            AI-powered education assistant
          </p>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white">
            <Sparkles size={15} />
          </div>

          <span className="text-sm font-black tracking-tight text-slate-950">
            NEXA
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-10 items-center gap-2 rounded-xl px-1.5 transition hover:bg-slate-100"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                {initials}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-[140px] truncate text-xs font-semibold text-slate-900">
                  {user?.name || "NEXA User"}
                </p>

                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {user?.role || "STUDENT"}
                </p>
              </div>
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close profile menu"
                />

                <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {user?.name || "NEXA User"}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {user?.role || "STUDENT"}
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        router.push("/profile")
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      <User size={17} />
                      <span>Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        router.push("/profile")
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      <Settings size={17} />
                      <span>Account settings</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogOut size={17} />

                      <span>
                        {loggingOut
                          ? "Signing out..."
                          : "Logout"}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            aria-label="Close navigation"
          />

          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-2xl">
            <Sidebar
              mobile
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
