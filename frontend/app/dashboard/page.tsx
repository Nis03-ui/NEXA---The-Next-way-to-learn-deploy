"use client"

import AppShell from "@/components/layout/AppShell"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import { useAuth } from "@/providers/AuthProvider"
import StudentLMSOverview from "@/components/lms/StudentLMSOverview"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <AppShell allowedRoles={["STUDENT"]}>
      <div className="relative mx-auto max-w-7xl space-y-7 sm:space-y-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-blue-500/[0.06] blur-3xl"
        />

        <DashboardHeader
          name={user?.name || ""}
          loading={!user}
        />

        <StudentLMSOverview />
      </div>
    </AppShell>
  )
}
