"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownToLine,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Link2,
  PlayCircle,
  Sparkles,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import {
  assignments,
  courses,
  materials,
  courseMaterialFileUrl,
  schedule,
  type Assignment,
  type Course,
  type CourseMaterial,
  type ScheduleEvent,
} from "@/lib/lms"

type Tab = "overview" | "materials" | "assignments" | "quizzes" | "schedule"

type QuizSummary = {
  id: number
  course_id?: number | null
  title: string
  description?: string | null
  subject?: string
  published?: boolean
  time_limit_minutes?: number | null
}

export default function CoursePage() {
  const params = useParams()
  const courseId = Number(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([])
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([])
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!Number.isFinite(courseId)) return

    async function load() {
      try {
        setLoading(true)
        setError("")

        const [myCourses, courseMaterialData, assignmentData, scheduleData] =
          await Promise.all([
            courses.my(),
            materials.list(courseId),
            assignments.list(courseId),
            schedule.list(courseId),
          ])

        const foundCourse = myCourses.find(
          (item) => item.id === courseId,
        )

        if (!foundCourse) {
          setError("You are not enrolled in this course.")
          return
        }

        setCourse(foundCourse)
        setCourseMaterials(courseMaterialData)
        setCourseAssignments(assignmentData)
        setEvents(scheduleData)

        /*
         * The existing quiz API returns all quizzes.
         * We filter locally because the backend quiz list already
         * includes course_id.
         */
        try {
          const response = await fetchQuizzes()
          setQuizzes(
            response.filter(
              (quiz) =>
                quiz.course_id === courseId &&
                quiz.published !== false,
            ),
          )
        } catch (quizError) {
          console.error("Failed to load course quizzes:", quizError)
          setQuizzes([])
        }
      } catch (loadError) {
        console.error("Failed to load course:", loadError)
        setError("Unable to load this course.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId])

  if (loading) {
    return (
      <AppShell allowedRoles={["STUDENT"]}>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-52 animate-pulse rounded-3xl bg-slate-100" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>

          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </AppShell>
    )
  }

  if (error || !course) {
    return (
      <AppShell allowedRoles={["STUDENT"]}>
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
              <BookOpen size={24} className="text-slate-500" />
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              Course unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error || "This course could not be found."}
            </p>

            <Link
              href="/courses"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"
            >
              <ArrowLeft size={16} />
              Back to courses
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const upcomingAssignments = courseAssignments
    .filter((item) => item.published)
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1

      return (
        new Date(a.due_date).getTime() -
        new Date(b.due_date).getTime()
      )
    })

  const upcomingEvents = [...events].sort(
    (a, b) =>
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime(),
  )

  return (
    <AppShell allowedRoles={["STUDENT"]}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* Breadcrumb */}
        <Link
          href="/courses"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          All courses
        </Link>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
          />

          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-200">
                {course.subject}
              </span>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">
                <CheckCircle2 size={12} />
                Enrolled
              </span>
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              {course.title}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {course.description ||
                "Continue your learning journey with NEXA."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} />
                Course #{course.id}
              </span>

              <span>•</span>

              <span className="flex items-center gap-1.5">
                <BookOpen size={14} />
                {courseMaterials.length} materials
              </span>

              <span>•</span>

              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                {courseAssignments.length} assignments
              </span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={<BookOpen size={17} />}
            label="Materials"
            value={courseMaterials.length}
          />

          <Stat
            icon={<FileText size={17} />}
            label="Assignments"
            value={courseAssignments.length}
          />

          <Stat
            icon={<PlayCircle size={17} />}
            label="Quizzes"
            value={quizzes.length}
          />

          <Stat
            icon={<CalendarDays size={17} />}
            label="Events"
            value={events.length}
          />
        </div>

        {/* Tabs */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-1 rounded-2xl border border-slate-200 bg-white p-1.5">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>

            <TabButton
              active={activeTab === "materials"}
              onClick={() => setActiveTab("materials")}
            >
              Materials
            </TabButton>

            <TabButton
              active={activeTab === "assignments"}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
            </TabButton>

            <TabButton
              active={activeTab === "quizzes"}
              onClick={() => setActiveTab("quizzes")}
            >
              Quizzes
            </TabButton>

            <TabButton
              active={activeTab === "schedule"}
              onClick={() => setActiveTab("schedule")}
            >
              Schedule
            </TabButton>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <Overview
            course={course}
            materials={courseMaterials}
            assignments={upcomingAssignments}
            events={upcomingEvents}
            quizzes={quizzes}
            setTab={setActiveTab}
          />
        )}

        {activeTab === "materials" && (
          <MaterialsList items={courseMaterials} />
        )}

        {activeTab === "assignments" && (
          <AssignmentsList items={courseAssignments} />
        )}

        {activeTab === "quizzes" && (
          <QuizzesList items={quizzes} />
        )}

        {activeTab === "schedule" && (
          <ScheduleList items={upcomingEvents} />
        )}
        </AnimatePresence>
      </motion.div>
    </AppShell>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-lg font-black text-slate-950">
            {value}
          </p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={[
        "min-h-10 rounded-xl px-4 text-xs font-bold transition sm:px-5",
        active
          ? "bg-slate-950 text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
    >
      {children}
    </motion.button>
  )
}

function Overview({
  course,
  materials,
  assignments,
  events,
  quizzes,
  setTab,
}: {
  course: Course
  materials: CourseMaterial[]
  assignments: Assignment[]
  events: ScheduleEvent[]
  quizzes: QuizSummary[]
  setTab: (tab: Tab) => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={17} className="text-blue-600" />
          <h2 className="font-black text-slate-950">
            Continue learning
          </h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {course.description ||
            "Explore your course materials and complete the activities assigned by your teacher."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <QuickAction
            icon={<BookOpen size={18} />}
            label="Materials"
            value={`${materials.length} resources`}
            onClick={() => setTab("materials")}
          />

          <QuickAction
            icon={<FileText size={18} />}
            label="Assignments"
            value={`${assignments.length} tasks`}
            onClick={() => setTab("assignments")}
          />

          <QuickAction
            icon={<PlayCircle size={18} />}
            label="Quizzes"
            value={`${quizzes.length} quizzes`}
            onClick={() => setTab("quizzes")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-slate-950">
            Next on your schedule
          </h2>

          <button
            type="button"
            onClick={() => setTab("schedule")}
            className="text-xs font-bold text-slate-500 hover:text-slate-950"
          >
            View all
          </button>
        </div>

        {events.length === 0 ? (
          <Empty text="No upcoming course events." />
        ) : (
          <div className="mt-5 space-y-3">
            {events.slice(0, 3).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="text-slate-300 transition group-hover:text-slate-700"
        />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-950">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-400">{value}</p>
    </button>
  )
}

function MaterialsList({
  items,
}: {
  items: CourseMaterial[]
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <SectionHeading
        icon={<BookOpen size={18} />}
        title="Course materials"
        description="Resources shared by your teacher."
      />

      {items.length === 0 ? (
        <Empty text="No course materials have been published yet." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  {item.file_url ? (
                    <FileText size={19} />
                  ) : (
                    <Link2 size={19} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description || "Course resource"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.file_url && (
                      <>
                        <a href={courseMaterialFileUrl(item.course_id, item.id)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white">
                          View PDF
                          <ExternalLink size={13} />
                        </a>
                        <a href={courseMaterialFileUrl(item.course_id, item.id, true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700">
                          Download
                          <ArrowDownToLine size={13} />
                        </a>
                      </>
                    )}

                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700"
                      >
                        Open resource
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function AssignmentsList({
  items,
}: {
  items: Assignment[]
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <SectionHeading
        icon={<FileText size={18} />}
        title="Assignments"
        description="Tasks, deadlines and submission resources."
      />

      {items.length === 0 ? (
        <Empty text="No assignments have been published yet." />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">
                      {item.title}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                      {item.max_marks} marks
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {item.instructions || "Complete this assignment."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock3 size={12} />
                      {item.due_date
                        ? `Due ${formatDateTime(item.due_date)}`
                        : "No deadline"}
                    </span>

                    {item.file_url && (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-600"
                      >
                        <FileText size={12} />
                        Assignment file
                      </a>
                    )}

                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-600"
                      >
                        <ExternalLink size={12} />
                        Resource
                      </a>
                    )}
                  </div>
                </div>

                <Link
                  href={`/assignments/${item.id}`}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white"
                >
                  Open
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function QuizzesList({
  items,
}: {
  items: QuizSummary[]
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <SectionHeading
        icon={<PlayCircle size={18} />}
        title="Course quizzes"
        description="Test your understanding and track your progress."
      />

      {items.length === 0 ? (
        <Empty text="No quizzes have been added to this course yet." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((quiz) => (
            <article
              key={quiz.id}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
                  <PlayCircle size={19} className="text-slate-600" />
                </div>

                {quiz.time_limit_minutes && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Clock3 size={12} />
                    {quiz.time_limit_minutes} min
                  </span>
                )}
              </div>

              <h3 className="mt-5 font-bold text-slate-950">
                {quiz.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {quiz.description || "Course quiz"}
              </p>

              <Link
                href={`/quizzes/${quiz.id}`}
                className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-bold text-white"
              >
                Start quiz
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ScheduleList({
  items,
}: {
  items: ScheduleEvent[]
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <SectionHeading
        icon={<CalendarDays size={18} />}
        title="Course schedule"
        description="Lectures, sessions and other course events."
      />

      {items.length === 0 ? (
        <Empty text="No schedule events have been added yet." />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((event) => (
            <EventRow key={event.id} event={event} detailed />
          ))}
        </div>
      )}
    </section>
  )
}

function EventRow({
  event,
  detailed = false,
}: {
  event: ScheduleEvent
  detailed?: boolean
}) {
  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <CalendarDays size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-950">
            {event.title}
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatDateTime(event.start_time)}
          </p>

          {event.description && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {event.description}
            </p>
          )}

          {detailed && (
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-slate-400">
              {event.location && (
                <span>{event.location}</span>
              )}

              {event.meeting_url && (
                <a
                  href={event.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-700"
                >
                  Join meeting
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div>
        <h2 className="font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

async function fetchQuizzes(): Promise<QuizSummary[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/quizzes`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to fetch quizzes")
  }

  return response.json()
}

function ArrowRight({
  size,
}: {
  size: number
}) {
  return <ArrowUpRight size={size} />
}
