"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import {
  assignments,
  assignmentFileUrl,
  courses,
  type Assignment,
  type AssignmentSubmission,
  type Course,
} from "@/lib/lms"

export default function AssignmentPage() {
  const params = useParams()
  const assignmentId = Number(params.id)

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [submission, setSubmission] =
    useState<AssignmentSubmission | null>(null)

  const [externalUrl, setExternalUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!Number.isFinite(assignmentId)) return

    async function load() {
      try {
        setLoading(true)
        setError("")

        /*
         * The assignment API does not expose GET /assignments/{id}.
         * We discover it through the student's enrolled courses.
         */
        const myCourses = await courses.my()

        let foundAssignment: Assignment | null = null
        let foundCourse: Course | null = null

        for (const item of myCourses) {
          try {
            const list = await assignments.list(item.id)
            const found = list.find(
              (assignment) => assignment.id === assignmentId,
            )

            if (found) {
              foundAssignment = found
              foundCourse = item
              break
            }
          } catch (courseError) {
            console.error(
              `Failed to load assignments for course ${item.id}:`,
              courseError,
            )
          }
        }

        if (!foundAssignment) {
          setError("Assignment not found or you are not enrolled in its course.")
          return
        }

        setAssignment(foundAssignment)
        setCourse(foundCourse)

        try {
          const existing = await assignments.getSubmission(assignmentId)
          setSubmission(existing)

          if (existing?.external_url) {
            setExternalUrl(existing.external_url)
          }
        } catch (submissionError) {
          console.error(
            "Failed to load submission:",
            submissionError,
          )
        }
      } catch (loadError) {
        console.error("Failed to load assignment:", loadError)
        setError("Unable to load this assignment.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [assignmentId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = externalUrl.trim()

    if (!selectedFile && !value) {
      setMessage("Upload a file or enter a submission link.")
      return
    }

    if (value) {
      try {
        new URL(value)
      } catch {
        setMessage("Please enter a valid URL.")
        return
      }
    }

    setSubmitting(true)
    setMessage("")

    try {
      const result = selectedFile
        ? await assignments.submitFile(assignmentId, selectedFile, value)
        : await assignments.submit(assignmentId, { external_url: value })

      setSubmission(result)
      setMessage("Assignment submitted successfully.")
    } catch (submitError) {
      console.error("Assignment submission failed:", submitError)

      setMessage(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the assignment.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function openSubmissionFile(download = false) {
    if (!submission?.file_url) return
    const token = localStorage.getItem("nexa_token")
    if (!token) { setMessage("You are not authenticated."); return }
    void fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/assignments/${assignmentId}/submissions/${submission.id}/file${download ? "?download=true" : ""}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Unable to open submission (${response.status})`)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        if (download) {
          const a = document.createElement("a"); a.href = url; a.download = submission.file_url?.split("/").pop() || "submission"; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        } else {
          window.open(url, "_blank", "noopener,noreferrer")
          setTimeout(() => URL.revokeObjectURL(url), 60000)
        }
      }).catch((e) => setMessage(e instanceof Error ? e.message : "Unable to open submission."))
  }

  if (loading) {
    return (
      <AppShell allowedRoles={["STUDENT"]}>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </AppShell>
    )
  }

  if (error || !assignment) {
    return (
      <AppShell allowedRoles={["STUDENT"]}>
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
              <FileText size={24} className="text-slate-500" />
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              Assignment unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error || "This assignment could not be found."}
            </p>

            <Link
              href="/courses"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"
            >
              <ArrowLeft size={16} />
              Back to courses
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const submitted = Boolean(submission)
  const graded = submission?.marks !== null &&
    submission?.marks !== undefined

  return (
    <AppShell allowedRoles={["STUDENT"]}>
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        {/* Back */}
        <Link
          href={`/courses/${assignment.course_id}`}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          {course?.title || "Back to course"}
        </Link>

        {/* Header */}
        <motion.section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-200">
                Assignment
              </span>

              {submitted && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">
                  <CheckCircle2 size={12} />
                  Submitted
                </span>
              )}

              {graded && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white">
                  {submission?.marks}/{assignment.max_marks}
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              {assignment.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileText size={14} />
                {assignment.max_marks} marks
              </span>

              {assignment.due_date && (
                <span className="flex items-center gap-1.5">
                  <Clock3 size={14} />
                  Due {formatDateTime(assignment.due_date)}
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* Instructions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100">
              <Sparkles size={18} className="text-slate-600" />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                Instructions
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {assignment.instructions ||
                  "Complete the assignment and submit your work below."}
              </p>
            </div>
          </div>

          {(assignment.file_url || assignment.external_url) && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Resources
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                {assignment.file_url && (
                  <button type="button" onClick={() => {
                    const token = localStorage.getItem("nexa_token")
                    if (!token) { setMessage("You are not authenticated."); return }
                    void fetch(assignmentFileUrl(assignment.id), { headers: { Authorization: `Bearer ${token}` } })
                      .then(async (r) => { if (!r.ok) throw new Error(`Unable to open assignment file (${r.status})`); const u = URL.createObjectURL(await r.blob()); window.open(u, "_blank", "noopener,noreferrer"); setTimeout(() => URL.revokeObjectURL(u), 60000) })
                      .catch((e) => setMessage(e instanceof Error ? e.message : "Unable to open assignment file."))
                  }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white">
                    <FileText size={14} /> Open assignment file <ExternalLink size={13} />
                  </button>
                )}

                {assignment.external_url && (
                  <a
                    href={assignment.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"
                  >
                    <Link2 size={14} />
                    Open resource
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Submission */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Your work
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              {submitted ? "Submission" : "Submit assignment"}
            </h2>
          </div>

          {message && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
            >
              {message}
            </div>
          )}

          {submitted ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Submitted
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {submission?.submitted_at
                        ? formatDateTime(submission.submitted_at)
                        : "Submission recorded"}
                    </p>
                  </div>

                  {graded && (
                    <div className="rounded-xl bg-white px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Grade
                      </p>

                      <p className="mt-1 text-xl font-black text-slate-950">
                        {submission?.marks}/{assignment.max_marks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {submission?.file_url && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openSubmissionFile(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white"><FileText size={15}/> View submitted file <ExternalLink size={13}/></button>
                  <button type="button" onClick={() => openSubmissionFile(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"><FileText size={15}/> Download submitted file</button>
                </div>
              )}
              {submission?.external_url && (
                <a
                  href={submission.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Link2 size={17} className="shrink-0" />
                    <span className="truncate">
                      {submission.external_url}
                    </span>
                  </span>

                  <ArrowUpRight size={16} className="shrink-0" />
                </a>
              )}

              {submission?.feedback && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Teacher feedback
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="submission-file"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Upload your file
                </label>

                <label
                  htmlFor="submission-file"
                  className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-slate-500 hover:bg-white"
                >
                  <Upload size={20} className="text-slate-500" />
                  <span className="mt-2 text-sm font-bold text-slate-700">
                    {selectedFile ? selectedFile.name : "Choose a file"}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-400">Maximum 10 MB</span>
                  <input
                    id="submission-file"
                    type="file"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      if (file && file.size > 10 * 1024 * 1024) {
                        setSelectedFile(null)
                        setMessage("File must be 10 MB or smaller.")
                        event.currentTarget.value = ""
                        return
                      }
                      setMessage("")
                      setSelectedFile(file)
                    }}
                  />
                </label>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-950"
                  >
                    <X size={13} /> Remove file
                  </button>
                )}

                <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <span className="h-px flex-1 bg-slate-100" />
                  or submit a link
                  <span className="h-px flex-1 bg-slate-100" />
                </div>

                <label
                  htmlFor="submission-url"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Submission link
                </label>

                <div className="relative">
                  <Link2
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="submission-url"
                    type="url"
                    value={externalUrl}
                    onChange={(event) =>
                      setExternalUrl(event.target.value)
                    }
                    placeholder="https://github.com/your-project"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Upload your assignment directly, or submit a GitHub repository, hosted project, Google Drive file, or another accessible URL.
                </p>
              </div>

              <motion.button whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit assignment"}
              </motion.button>
            </form>
          )}
        </section>
      </div>
    </AppShell>
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
