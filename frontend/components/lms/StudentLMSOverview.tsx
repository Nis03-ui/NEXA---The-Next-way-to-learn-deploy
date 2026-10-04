"use client"

import Link from "next/link"
import AnalyticsChart from "@/components/dashboard/AnalyticsChart"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react"

import {
  assignments,
  courses,
  notifications,
  schedule,
  type Assignment,
  type Course,
  type Notification,
  type ScheduleEvent,
} from "@/lib/lms"

export default function StudentLMSOverview() {
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([])
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [alerts, setAlerts] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const coursesData = await courses.my()

        if (!active) return
        setMyCourses(coursesData)

        const results = await Promise.all(
          coursesData.map(async (course) => {
            const [courseAssignments, courseEvents] =
              await Promise.all([
                assignments.list(course.id),
                schedule.list(course.id),
              ])

            return {
              assignments: courseAssignments,
              events: courseEvents,
            }
          }),
        )

        if (!active) return

        setCourseAssignments(
          results.flatMap((result) => result.assignments),
        )

        setEvents(
          results
            .flatMap((result) => result.events)
            .sort(
              (a, b) =>
                new Date(a.start_time).getTime() -
                new Date(b.start_time).getTime(),
            ),
        )

        const notificationData = await notifications.list()

        if (active) {
          setAlerts(notificationData)
        }
      } catch (error) {
        console.error("Failed to load LMS overview:", error)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const upcomingAssignments = courseAssignments
    .filter((item) => item.published)
    .filter(
      (item) =>
        !item.due_date ||
        new Date(item.due_date).getTime() >= Date.now(),
    )
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1

      return (
        new Date(a.due_date).getTime() -
        new Date(b.due_date).getTime()
      )
    })
    .slice(0, 4)

  const upcomingEvents = events
    .filter(
      (event) =>
        new Date(event.start_time).getTime() >= Date.now(),
    )
    .slice(0, 4)

  const unread = alerts.filter((item) => !item.is_read)

  function courseName(courseId: number) {
    return (
      myCourses.find((course) => course.id === courseId)?.title ||
      "Course"
    )
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(value))
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-7">
      {/* LMS Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
              <Sparkles size={14} />
              NEXA Learning Space
            </div>

            <h2 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">
              Your courses, assignments and learning schedule — in one place.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Continue learning from your enrolled courses or discover
              something new.
            </p>
          </div>

          <motion.div whileTap={{ scale: 0.97 }}><Link
            href="/courses"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Browse courses
            <ArrowRight size={16} />
          </Link></motion.div>
        </div>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Enrolled", myCourses.length, "Active courses"],
          ["Assignments", upcomingAssignments.length, "Upcoming tasks"],
          ["Sessions", upcomingEvents.length, "Upcoming events"],
          ["Unread", unread.length, "New updates"],
        ].map(([label, value, note]) => (
          <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-slate-500">{label as string}</p>
            <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-950">{value as number}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{note as string}</p>
          </div>
        ))}
      </div>

      {/* Learning analytics */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Your activity</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Assignments by course</h2>
            <p className="mt-1 text-xs text-slate-500">Published assignments available across your enrolled courses.</p>
          </div>
          {myCourses.length === 0 ? (
            <div className="grid h-64 place-items-center rounded-2xl bg-slate-50 text-xs text-slate-400">Enroll in a course to see your learning analytics.</div>
          ) : (
            <AnalyticsChart
              labels={myCourses.map((course) => course.title)}
              values={myCourses.map((course) => courseAssignments.filter((item) => item.course_id === course.id && item.published).length)}
              label="Published assignments"
            />
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Learning load</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Upcoming work</h2>
            <p className="mt-1 text-xs text-slate-500">Live counts from your current assignments and schedule.</p>
          </div>
          <AnalyticsChart
            labels={["Assignments", "Sessions", "Notifications"]}
            values={[upcomingAssignments.length, upcomingEvents.length, unread.length]}
            label="Current items"
          />
        </div>
      </div>

      {/* Courses */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Learning
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              My Courses
            </h2>
          </div>

          <Link
            href="/courses"
            className="text-xs font-semibold text-slate-500 hover:text-slate-950"
          >
            View all
          </Link>
        </div>

        {myCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <BookOpen className="mx-auto text-slate-400" size={24} />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No enrolled courses yet
            </p>
            <Link
              href="/courses"
              className="mt-3 inline-flex text-xs font-bold text-blue-600"
            >
              Explore courses →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {myCourses.slice(0, 6).map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.3 }}
                whileHover={{ y: -3 }}
              ><Link
                href={`/courses/${course.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white">
                    <BookOpen size={18} />
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {course.subject}
                  </span>
                </div>

                <h3 className="mt-5 line-clamp-2 text-base font-bold text-slate-950">
                  {course.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {course.description || "Continue your learning journey."}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-medium text-slate-400">
                    Course #{course.id}
                  </span>

                  <ArrowRight
                    size={15}
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950"
                  />
                </div>
              </Link></motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Assignments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Tasks
              </p>
              <h3 className="mt-1 font-black text-slate-950">
                Upcoming assignments
              </h3>
            </div>

            <FileText size={18} className="text-slate-400" />
          </div>

          <div className="mt-5 space-y-3">
            {upcomingAssignments.length === 0 ? (
              <p className="py-5 text-center text-xs text-slate-400">
                No upcoming assignments.
              </p>
            ) : (
              upcomingAssignments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {courseName(item.course_id)}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <Clock3 size={12} />
                    {item.due_date
                      ? `Due ${formatDate(item.due_date)}`
                      : "No deadline"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Calendar
              </p>
              <h3 className="mt-1 font-black text-slate-950">
                Upcoming schedule
              </h3>
            </div>

            <CalendarDays size={18} className="text-slate-400" />
          </div>

          <div className="mt-5 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="py-5 text-center text-xs text-slate-400">
                No upcoming events.
              </p>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {event.title}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {courseName(event.course_id)}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <CalendarDays size={12} />
                    {formatDate(event.start_time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Updates
              </p>
              <h3 className="mt-1 font-black text-slate-950">
                Notifications
              </h3>
            </div>

            <div className="relative">
              <Bell size={18} className="text-slate-400" />

              {unread.length > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-slate-950 px-1 text-[8px] font-bold text-white">
                  {unread.length}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {alerts.length === 0 ? (
              <p className="py-5 text-center text-xs text-slate-400">
                You're all caught up.
              </p>
            ) : (
              alerts.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className={[
                    "rounded-xl p-3",
                    item.is_read
                      ? "bg-slate-50"
                      : "bg-blue-50/70",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2">
                    {!item.is_read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
        <CheckCircle2 size={14} />
        <span>{myCourses.length} enrolled course{myCourses.length === 1 ? "" : "s"}</span>
        <span>•</span>
        <span>{unread.length} unread notification{unread.length === 1 ? "" : "s"}</span>
      </div>
    </motion.section>
  )
}
