"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Plus,
  Users,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import AnalyticsChart from "@/components/dashboard/AnalyticsChart"
import { useAuth } from "@/providers/AuthProvider"
import { courses, assignments, schedule, quizzes, type Course } from "@/lib/lms"

type Metric = { label: string; value: number; note: string }

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [courseList, setCourseList] = useState<Course[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [assignmentCount, setAssignmentCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [quizCount, setQuizCount] = useState(0)
  const [courseAnalytics, setCourseAnalytics] = useState<{ title: string; students: number; assignments: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const owned = await courses.mine()
        if (!active) return
        setCourseList(owned)

        const courseIds = new Set(owned.map((course) => course.id))

        const details = await Promise.all(
          owned.map(async (course) => {
            const [students, assignmentsForCourse, events] = await Promise.all([
              courses.students(course.id),
              assignments.list(course.id),
              schedule.list(course.id),
            ])
            return {
              students: students.filter((student) => student.status === "ACTIVE").length,
              assignments: assignmentsForCourse.filter((item) => item.published).length,
              events: events.length,
            }
          }),
        )

        const allQuizzes = await quizzes.getAll()

        if (!active) return

        setCourseAnalytics(owned.map((course, index) => ({ title: course.title, students: details[index].students, assignments: details[index].assignments })))
        setStudentCount(details.reduce((sum, item) => sum + item.students, 0))
        setAssignmentCount(details.reduce((sum, item) => sum + item.assignments, 0))
        setEventCount(details.reduce((sum, item) => sum + item.events, 0))
        setQuizCount(allQuizzes.filter((quiz) => quiz.course_id != null && courseIds.has(quiz.course_id)).length)
      } catch {
        if (active) {
          setCourseList([])
          setStudentCount(0)
          setAssignmentCount(0)
          setEventCount(0)
          setQuizCount(0)
          setCourseAnalytics([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const firstCourse = courseList[0]
  const workspaceLink = (tab: string) =>
    firstCourse ? `/teacher/courses/${firstCourse.id}?tab=${tab}` : "/teacher"

  const metrics: Metric[] = useMemo(
    () => [
      { label: "Students", value: studentCount, note: "Active enrollments" },
      { label: "Courses", value: courseList.length, note: "Courses you own" },
      { label: "Assignments", value: assignmentCount, note: "Published assignments" },
      { label: "Quizzes", value: quizCount, note: "Course assessments" },
    ],
    [studentCount, courseList.length, assignmentCount, quizCount],
  )

  return (
    <AppShell allowedRoles={["TEACHER", "ADMIN"]}>
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-8 sm:space-y-8">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Teacher analytics</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {user?.name ? `Welcome back, ${user.name}.` : "Teacher dashboard"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                See your teaching workload at a glance, then jump directly into the work that needs attention.
              </p>
            </div>
            <Link href="/teacher" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              <Plus size={16} /> Manage courses
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {loading ? "—" : metric.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{metric.note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Real-time course data</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Learners by course</h2>
              <p className="mt-1 text-xs text-slate-500">Active enrollments loaded from your courses.</p>
            </div>
            {loading ? <div className="h-64 animate-pulse rounded-2xl bg-slate-50" /> : courseAnalytics.length === 0 ? <div className="grid h-64 place-items-center rounded-2xl bg-slate-50 text-xs text-slate-400">Create a course to see analytics.</div> : <AnalyticsChart labels={courseAnalytics.map((item) => item.title)} values={courseAnalytics.map((item) => item.students)} label="Active students" />}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Workload</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">Published assignments</h2>
              <p className="mt-1 text-xs text-slate-500">Published assignments currently attached to each course.</p>
            </div>
            {loading ? <div className="h-64 animate-pulse rounded-2xl bg-slate-50" /> : <AnalyticsChart labels={courseAnalytics.map((item) => item.title)} values={courseAnalytics.map((item) => item.assignments)} label="Assignments" />}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Your courses</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">Teaching workspace</h2>
              </div>
              <Link href="/teacher" className="text-xs font-bold text-slate-600 hover:text-slate-950">View all</Link>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-400">Loading course analytics…</div>
              ) : courseList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                  <GraduationCap className="mx-auto text-slate-400" size={24} />
                  <p className="mt-3 text-sm font-bold text-slate-900">No course yet</p>
                  <p className="mt-1 text-xs text-slate-500">Create a course to start teaching through NEXA.</p>
                  <Link href="/teacher" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white">
                    Create course <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                courseList.slice(0, 5).map((course) => (
                  <Link key={course.id} href={`/teacher/courses/${course.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100"><BookOpen size={18} className="text-slate-700" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{course.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{course.subject} · {course.published ? "Published" : "Draft"}</p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-slate-400" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Link href={workspaceLink("students")} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
              <Users size={19} className="text-slate-700" />
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">Students</p><p className="mt-1 text-xs text-slate-500">Review enrolled learners.</p></div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link href="/schedule" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
              <CalendarDays size={19} className="text-slate-700" />
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">Schedule</p><p className="mt-1 text-xs text-slate-500">{eventCount} scheduled event{eventCount === 1 ? "" : "s"} across your courses.</p></div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link href="/tutor" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
              <MessageSquare size={19} className="text-slate-700" />
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">NEXA AI Tutor</p><p className="mt-1 text-xs text-slate-500">Use the AI companion when planning lessons.</p></div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link href="/quizzes" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
              <ClipboardList size={19} className="text-slate-700" />
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">Quizzes</p><p className="mt-1 text-xs text-slate-500">Manage course assessments.</p></div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
