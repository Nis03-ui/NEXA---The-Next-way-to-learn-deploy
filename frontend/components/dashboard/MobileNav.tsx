"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageSquare,
  UserCircle,
  Users,
} from "lucide-react"

import { useAuth } from "@/providers/AuthProvider"

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard }

const studentItems: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: Library },
  { name: "Tutor", href: "/tutor", icon: MessageSquare },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Profile", href: "/profile", icon: UserCircle },
]

const teacherItems: NavItem[] = [
  { name: "Home", href: "/teacher/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/teacher", icon: GraduationCap },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Profile", href: "/profile", icon: UserCircle },
]

const adminItems: NavItem[] = [
  { name: "Home", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin#users", icon: Users },
  { name: "Courses", href: "/teacher", icon: GraduationCap },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Profile", href: "/profile", icon: UserCircle },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  const items = user?.role === "ADMIN" ? adminItems : user?.role === "TEACHER" ? teacherItems : studentItems

  function isActive(item: NavItem) {
    const basePath = item.href.split("#")[0]
    if (item.href === "/teacher") return pathname === "/teacher" || pathname.startsWith("/teacher/courses/")
    return pathname === basePath || pathname.startsWith(`${basePath}/`)
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pt-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className={`mx-auto grid max-w-lg gap-1 ${items.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={["flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition", "outline-none focus-visible:ring-2 focus-visible:ring-slate-400", active ? "bg-slate-950 text-white" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"].join(" ")}
            >
              <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}