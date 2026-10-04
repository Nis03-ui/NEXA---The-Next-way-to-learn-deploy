"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import Sidebar from "@/components/dashboard/Sidebar"
import Topbar from "@/components/dashboard/Topbar"
import MobileNav from "@/components/dashboard/MobileNav"
import { useAuth } from "@/providers/AuthProvider"
import type { Role } from "@/lib/api"

type AppShellProps = {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export default function AppShell({
  children,
  allowedRoles,
}: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated || !user) {
      router.replace(
        `/login?next=${encodeURIComponent(pathname)}`,
      )
      return
    }

    if (
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      if (user.role === "ADMIN") {
        router.replace("/admin")
      } else if (user.role === "TEACHER") {
        router.replace("/teacher")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [
    loading,
    isAuthenticated,
    user,
    allowedRoles,
    pathname,
    router,
  ])

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
            N
          </div>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-900" />
          </div>
          <p className="text-xs font-medium text-slate-400">
            Loading NEXA...
          </p>
        </div>
      </div>
    )
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Redirecting...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="lg:ml-64">
        <Topbar />

        <main className="min-h-[calc(100vh-4rem)] overflow-x-hidden px-3 pb-24 pt-4 sm:p-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
