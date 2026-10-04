"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import {
  BookOpen,
  Check,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { courses, type Course } from "@/lib/lms"

type CourseForm = {
  title: string
  subject: string
  description: string
  published: boolean
}

const emptyForm: CourseForm = {
  title: "",
  subject: "",
  description: "",
  published: false,
}

export default function TeacherPage() {
  const [courseList, setCourseList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function loadCourses() {
    try {
      setLoading(true)
      setError("")

      const data = await courses.mine()
      setCourseList(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load courses.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return courseList

    return courseList.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.subject.toLowerCase().includes(query) ||
        (course.description ?? "")
          .toLowerCase()
          .includes(query),
    )
  }, [courseList, search])

  function openCreate() {
    setEditingCourse(null)
    setForm(emptyForm)
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function openEdit(course: Course) {
    setEditingCourse(course)

    setForm({
      title: course.title,
      subject: course.subject,
      description: course.description ?? "",
      published: course.published,
    })

    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return

    setShowForm(false)
    setEditingCourse(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError("Course title is required.")
      return
    }

    if (!form.subject.trim()) {
      setError("Subject is required.")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (editingCourse) {
        const updated = await courses.update(
          editingCourse.id,
          {
            title: form.title.trim(),
            subject: form.subject.trim(),
            description: form.description.trim() || undefined,
            published: form.published,
          },
        )

        setCourseList((current) =>
          current.map((course) =>
            course.id === updated.id
              ? updated
              : course,
          ),
        )

        setSuccess("Course updated successfully.")
      } else {
        const created = await courses.create({
          title: form.title.trim(),
          subject: form.subject.trim(),
          description: form.description.trim() || undefined,
          published: form.published,
        })

        setCourseList((current) => [
          created,
          ...current,
        ])

        setSuccess("Course created successfully.")
      }

      setForm(emptyForm)
      setEditingCourse(null)

      setTimeout(() => {
        setShowForm(false)
      }, 700)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save course.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(course: Course) {
    try {
      setActionId(course.id)
      setError("")
      setSuccess("")

      const updated = await courses.publish(course.id)

      setCourseList((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      )

      setSuccess(
        updated.published
          ? "Course published."
          : "Course unpublished.",
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update course.",
      )
    } finally {
      setActionId(null)
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = window.confirm(
      `Delete "${course.title}"? This may also remove its course content.`,
    )

    if (!confirmed) return

    try {
      setActionId(course.id)
      setError("")
      setSuccess("")

      await courses.delete(course.id)

      setCourseList((current) =>
        current.filter(
          (item) => item.id !== course.id,
        ),
      )

      setSuccess("Course deleted.")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete course.",
      )
    } finally {
      setActionId(null)
    }
  }

  return (
    <AppShell allowedRoles={["TEACHER", "ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Teacher LMS
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Course Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Create and manage your courses, then add
                materials, assignments, quizzes, and schedules.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create Course
            </button>
          </div>
        </motion.section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                My Courses
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {courseList.length} course
                {courseList.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search courses..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-950">
                {search
                  ? "No courses found"
                  : "No courses yet"}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? "Try another search."
                  : "Create your first course to start building your LMS."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
                >
                  Create Course
                </button>
              )}
            </div>
          ) : (
            <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course, index) => (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.3 }}
                  whileHover={{ y: -3 }}
                  className="flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex max-w-full truncate rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {course.subject}
                      </span>

                      <h3 className="mt-4 break-words text-lg font-bold text-slate-950">
                        {course.title}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        course.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {course.published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {course.description ||
                      "No course description yet."}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Link
                      href={`/teacher/courses/${course.id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 sm:col-span-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Open Course
                    </Link>

                    <button
                      type="button"
                      onClick={() => openEdit(course)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={actionId === course.id}
                      onClick={() =>
                        handlePublish(course)
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {actionId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : course.published ? (
                        <>
                          <X className="h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Publish
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(course)
                      }
                      disabled={actionId === course.id}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:col-span-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Course
                    </button>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </section>

        <AnimatePresence>{showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6">
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.99 }} transition={{ duration: 0.2 }} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    Teacher LMS
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                    {editingCourse
                      ? "Edit Course"
                      : "Create Course"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Course title
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Full Stack Web Development"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Subject
                  </label>

                  <input
                    value={form.subject}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    placeholder="e.g. Web Development"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Describe what students will learn..."
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        published: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Publish immediately
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Students can discover published courses.
                    </span>
                  </span>
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {editingCourse
                      ? "Save Changes"
                      : "Create Course"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </AppShell>
  )
}
