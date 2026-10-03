"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Users,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { useAuth } from "@/providers/AuthProvider"
import { courses, type Course } from "@/lib/lms"

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [courseList, setCourseList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courses.mine()
        setCourseList(data)
      } catch {
        setCourseList([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  const firstCourse = courseList[0]

  const workspaceLink = (tab: string) =>
    firstCourse
      ? `/teacher/courses/${firstCourse.id}?tab=${tab}`
      : "/teacher"

  return (
    <AppShell allowedRoles={["TEACHER", "ADMIN"]}>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Teacher workspace
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Manage your courses, students, learning materials, assignments,
              quizzes, and schedules from one place.
            </p>

            <Link
              href="/teacher"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Manage My Courses
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/teacher"
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <BookOpen size={20} className="text-slate-700" />
            <h2 className="mt-4 font-bold text-slate-950">My Courses</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage your courses.
            </p>
            <ArrowRight size={16} className="mt-4 text-slate-400" />
          </Link>

          <Link
            href={workspaceLink("students")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <GraduationCap size={20} className="text-slate-700" />
            <h2 className="mt-4 font-bold text-slate-950">Students</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage students enrolled in your course.
            </p>
            <ArrowRight size={16} className="mt-4 text-slate-400" />
          </Link>

          <Link
            href={workspaceLink("assignments")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <ClipboardList size={20} className="text-slate-700" />
            <h2 className="mt-4 font-bold text-slate-950">Assignments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create assignments and review submissions.
            </p>
            <ArrowRight size={16} className="mt-4 text-slate-400" />
          </Link>

          <Link
            href={workspaceLink("schedule")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <CalendarDays size={20} className="text-slate-700" />
            <h2 className="mt-4 font-bold text-slate-950">Schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage course sessions and meeting details.
            </p>
            <ArrowRight size={16} className="mt-4 text-slate-400" />
          </Link>
        </section>

        {!loading && courseList.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <h2 className="font-bold text-slate-950">
              Create your first course
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Course-specific tools become available after you create a course.
            </p>

            <Link
              href="/teacher"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Create Course
              <ArrowRight size={16} />
            </Link>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/tutor"
            className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100">
              <MessageSquare size={20} className="text-slate-700" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-slate-950">AI Tutor</h2>
              <p className="mt-1 text-sm text-slate-500">
                Open the NEXA AI study companion.
              </p>
            </div>

            <ArrowRight size={18} className="shrink-0 text-slate-400" />
          </Link>

          <Link
            href="/quizzes"
            className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100">
              <ClipboardList size={20} className="text-slate-700" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-slate-950">Quizzes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Access quiz management and assessments.
              </p>
            </div>

            <ArrowRight size={18} className="shrink-0 text-slate-400" />
          </Link>
        </section>
      </div>
    </AppShell>
  )
}
