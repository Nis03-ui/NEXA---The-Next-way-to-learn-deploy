"use client"

import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  FileText,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import Sidebar from "@/components/dashboard/Sidebar"
import { useAuth } from "@/providers/AuthProvider"
import { notifications, type Notification } from "@/lib/lms"

export default function Topbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationList, setNotificationList] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const notificationRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { user, logout } = useAuth()

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "N"

  async function loadNotifications() {
    try {
      setLoadingNotifications(true)

      const [list, count] = await Promise.all([
        notifications.list(),
        notifications.unreadCount(),
      ])

      setNotificationList(list)
      setUnreadCount(count.unread_count)
    } catch {
      // Notification failure should never break the main workspace.
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (!user) return

    loadNotifications()

    const interval = window.setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [user])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  async function handleNotificationClick(notification: Notification) {
    try {
      if (!notification.is_read) {
        await notifications.markRead(notification.id)

        setNotificationList((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item,
          ),
        )

        setUnreadCount((current) => Math.max(0, current - 1))
      }
    } catch {
      // Keep the notification visible if marking it read fails.
    }
  }

  async function handleMarkAllRead() {
    if (markingAllRead || unreadCount === 0) return

    try {
      setMarkingAllRead(true)

      await notifications.markAllRead()

      setNotificationList((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      )

      setUnreadCount(0)
    } catch {
      // Keep the current state if the request fails.
    } finally {
      setMarkingAllRead(false)
    }
  }

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

  function notificationIcon(type: string) {
    switch (type) {
      case "ASSIGNMENT":
      case "GRADE":
        return <FileText size={16} />

      case "QUIZ":
        return <BookOpen size={16} />

      case "SCHEDULE":
        return <CalendarDays size={16} />

      case "ANNOUNCEMENT":
        return <MessageSquare size={16} />

      default:
        return <Bell size={16} />
    }
  }

  function notificationTime(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return ""

    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:h-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((open) => !open)
                setProfileOpen(false)
              }}
              className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
              aria-expanded={notificationOpen}
            >
              <Bell size={18} />

              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-bold leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-13 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Notifications
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : "You're all caught up"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={markingAllRead}
                        className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        {markingAllRead ? "Saving..." : "Mark all read"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close notifications"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="max-h-[min(480px,65vh)] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex gap-3 animate-pulse"
                        >
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100" />
                          <div className="min-w-0 flex-1">
                            <div className="h-3 w-2/3 rounded bg-slate-100" />
                            <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                            <div className="mt-2 h-2 w-1/4 rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notificationList.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                        <Bell size={20} />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No notifications
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        New course activity will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notificationList.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                          className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                            notification.is_read
                              ? "bg-white"
                              : "bg-slate-50/80"
                          }`}
                        >
                          <div
                            className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                              notification.is_read
                                ? "bg-slate-100 text-slate-400"
                                : "bg-slate-950 text-white"
                            }`}
                          >
                            {notificationIcon(notification.type)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <p className="min-w-0 flex-1 text-xs font-bold text-slate-900">
                                {notification.title}
                              </p>

                              {!notification.is_read && (
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-950" />
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {notification.message}
                            </p>

                            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                              {notificationTime(notification.created_at)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open)
                setNotificationOpen(false)
              }}
              className="flex h-11 items-center gap-2 rounded-xl px-1.5 transition hover:bg-slate-100"
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

                <div className="absolute right-0 top-12 z-50 w-[min(288px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
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
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
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
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
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
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogOut size={17} />

                      <span>
                        {loggingOut ? "Signing out..." : "Logout"}
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

          <div className="absolute left-0 top-0 h-full w-[min(280px,86vw)] bg-white shadow-2xl">
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
