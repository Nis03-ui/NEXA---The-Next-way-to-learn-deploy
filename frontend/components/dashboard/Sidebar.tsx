"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Users,
  Megaphone,
  UserCircle,
  Sparkles,
  Library,
  CalendarDays,
} from "lucide-react"

import { useAuth } from "@/providers/AuthProvider"

type SidebarProps = {
  mobile?: boolean
  onNavigate?: () => void
}

type NavItem = {
  name: string
  href: string
  icon: typeof LayoutDashboard
}

const studentLinks: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: Library },
  { name: "AI Tutor", href: "/tutor", icon: MessageSquare },
  { name: "Quizzes", href: "/quizzes", icon: BookOpen },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
]

const teacherLinks: NavItem[] = [
  { name: "Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
  { name: "My Courses", href: "/teacher", icon: GraduationCap },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
]

const adminLinks: NavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Courses", href: "/teacher", icon: GraduationCap },
  { name: "Users", href: "/admin#users", icon: Users },
  { name: "Announcements", href: "/admin#announcements", icon: Megaphone },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
]

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const links =
    user?.role === "ADMIN"
      ? adminLinks
      : user?.role === "TEACHER"
        ? teacherLinks
        : studentLinks

  const homeHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "TEACHER"
        ? "/teacher/dashboard"
        : "/dashboard"

  function isActive(item: NavItem) {
    const basePath = item.href.split("#")[0]

    if (item.href === "/teacher/dashboard") {
      return pathname === "/teacher/dashboard"
    }

    if (item.href === "/teacher") {
      return pathname === "/teacher" || pathname.startsWith("/teacher/courses/")
    }

    return pathname === basePath || pathname.startsWith(`${basePath}/`)
  }

  return (
    <aside
      className={
        mobile
          ? "h-full w-full bg-white"
          : "fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block"
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-20 shrink-0 items-center px-5 sm:px-6">
          <Link
            href={homeHref}
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
              <Sparkles size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black tracking-tight text-slate-950">NEXA</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Learn smarter
              </p>
            </div>
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:py-5">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1" aria-label="Main navigation">
            {links.map((item) => {
              const Icon = item.icon
              const active = isActive(item)

              return (
                <motion.div key={item.name} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    "outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                    active
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Icon size={17} className="shrink-0" strokeWidth={active ? 2.2 : 1.9} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
                </Link>
                </motion.div>
              )
            })}

            <Link
              href="/profile"
              onClick={onNavigate}
              className={[
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                "outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                pathname === "/profile"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <UserCircle size={17} className="shrink-0" strokeWidth={pathname === "/profile" ? 2.2 : 1.9} />
              <span className="min-w-0 flex-1 truncate">Profile</span>
              {pathname === "/profile" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
            </Link>
          </nav>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-3 sm:p-4">
          <div className="rounded-2xl bg-slate-50 p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="shrink-0 text-blue-600" />
              <p className="text-xs font-bold text-slate-900">NEXA AI</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Your intelligent study companion for understanding difficult concepts.
            </p>
            <Link
              href="/tutor"
              onClick={onNavigate}
              className="mt-3 flex min-h-10 items-center justify-center rounded-lg bg-white px-3 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Ask NEXA
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
