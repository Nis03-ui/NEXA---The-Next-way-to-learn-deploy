"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Search,
  Sparkles,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { courses, type Course } from "@/lib/lms"
import CourseThumbnail from "@/components/courses/CourseThumbnail"

export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<number | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const [browse, enrolled] = await Promise.all([
          courses.browse(),
          courses.my(),
        ])

        setAllCourses(browse)
        setMyCourses(enrolled)
      } catch (error) {
        console.error("Failed to load courses:", error)
        setMessage("Unable to load courses.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const enrolledIds = useMemo(
    () => new Set(myCourses.map((course) => course.id)),
    [myCourses],
  )

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return allCourses

    return allCourses.filter((course) =>
      [
        course.title,
        course.subject,
        course.description || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
  }, [allCourses, search])

  async function enroll(courseId: number) {
    setEnrolling(courseId)
    setMessage("")

    try {
      await courses.enroll(courseId)

      const enrolled = await courses.my()
      setMyCourses(enrolled)

      setMessage("Course enrolled successfully.")
    } catch (error) {
      console.error("Enrollment failed:", error)
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to enroll in this course.",
      )
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <AppShell allowedRoles={["STUDENT"]}>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
          />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              <Sparkles size={14} />
              NEXA LMS
            </div>

            <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              Explore your next course.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Discover courses published by your teachers and build your
              personalized learning space.
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Course catalog
            </p>

            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              Available courses
            </h2>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </section>

        {message && (
          <div
            role="status"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600"
          >
            {message}
          </div>
        )}

        {/* Courses */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookOpen
              size={28}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 font-bold text-slate-950">
              No courses found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => {
              const enrolled = enrolledIds.has(course.id)
              const busy = enrolling === course.id

              return (
                <motion.article
                  key={course.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <CourseThumbnail
                    title={course.title}
                    subject={course.subject}
                    thumbnailUrl={course.thumbnail_url}
                    className="h-36"
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-lg font-black tracking-tight text-slate-950">
                      {course.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500">
                      {course.description ||
                        "Start learning with NEXA."}
                    </p>

                    <div className="mt-auto pt-6">
                      {enrolled ? (
                        <Link
                          href={`/courses/${course.id}`}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          <CheckCircle2 size={16} />
                          Open course
                          <ArrowRight size={15} />
                        </Link>
                      ) : (
                        <motion.button whileTap={{ scale: 0.97 }}
                          type="button"
                          disabled={busy}
                          onClick={() => enroll(course.id)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy ? "Enrolling..." : "Enroll in course"}
                          {!busy && <ArrowRight size={15} />}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <BookOpen size={14} />
            {filteredCourses.length} course
            {filteredCourses.length === 1 ? "" : "s"} available
          </div>
        )}
      </div>
    </AppShell>
  )
}
