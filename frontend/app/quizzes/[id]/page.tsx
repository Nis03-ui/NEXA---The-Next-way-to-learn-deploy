"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Loader2,
  Send,
  Trophy,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { courses } from "@/lib/lms"
import { quizzes, type Quiz, type QuizAnswer } from "@/lib/api"

function formatDate(value?: string | null) {
  if (!value) return "—"

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = Number(params.id)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [courseTitle, setCourseTitle] = useState("")
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<{
    score: number
    total_marks: number
    submitted_at: string
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true)
        setError("")

        const found = await quizzes.get(quizId)

        setQuiz(found)

        /*
         * Quiz currently does not expose course_id.
         * We therefore identify the course by checking the
         * student's enrolled courses and their quiz lists
         * only if needed.
         *
         * For now the quiz itself remains fully usable without
         * a course title.
         */
        try {
          const myCourses = await courses.my()

          for (const course of myCourses) {
            try {
              const courseQuizzes = await quizzes.getAll()

              const belongsToCourse = courseQuizzes.some(
                (item) => item.id === found.id,
              )

              if (belongsToCourse) {
                setCourseTitle(course.title)
                break
              }
            } catch {
              break
            }
          }
        } catch {
          // Course title is optional.
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load quiz.",
        )
      } finally {
        setLoading(false)
      }
    }

    if (Number.isFinite(quizId)) {
      loadQuiz()
    } else {
      setError("Invalid quiz.")
      setLoading(false)
    }
  }, [quizId])

  function selectAnswer(questionId: number, answer: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }))

    setError("")
  }

  async function handleSubmit() {
    if (!quiz) return

    const unanswered = quiz.questions.filter(
      (question) => !answers[question.id],
    )

    if (unanswered.length > 0) {
      setError(
        `Please answer all questions. ${unanswered.length} question${
          unanswered.length === 1 ? "" : "s"
        } remaining.`,
      )
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const payload: QuizAnswer[] = quiz.questions.map(
        (question) => ({
          question_id: question.id,
          answer: answers[question.id],
        }),
      )

      const response = await quizzes.submit(
        quiz.id,
        payload,
      )

      setResult({
        score: response.score,
        total_marks: response.total_marks,
        submitted_at: response.submitted_at,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit quiz.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell allowedRoles={["STUDENT"]}>
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <Link
          href="/quizzes"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quizzes
        </Link>

        {loading && (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
          </div>
        )}

        {!loading && error && !quiz && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && quiz && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Quiz
                  </span>

                  {courseTitle && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      {courseTitle}
                    </span>
                  )}

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    {quiz.subject}
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    {quiz.title}
                  </h1>

                  {quiz.description && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                      {quiz.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Clock3 className="mb-2 h-5 w-5 text-slate-500" />

                    <p className="text-xs text-slate-500">
                      Time limit
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {quiz.time_limit_minutes ?? "No limit"}
                      {quiz.time_limit_minutes ? " min" : ""}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <FileQuestion className="mb-2 h-5 w-5 text-slate-500" />

                    <p className="text-xs text-slate-500">
                      Questions
                    </p>

                    <p className="mt-1 font-semibold text-slate-950">
                      {quiz.questions.length}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl bg-slate-50 p-4 sm:col-span-1">
                    <Trophy className="mb-2 h-5 w-5 text-slate-500" />

                    <p className="text-xs text-slate-500">
                      Subject
                    </p>

                    <p className="mt-1 truncate font-semibold text-slate-950">
                      {quiz.subject}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {result ? (
              <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-10">
                <div className="mx-auto max-w-xl text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />

                  <h2 className="mt-4 text-2xl font-bold text-slate-950">
                    Quiz submitted
                  </h2>

                  <p className="mt-5 text-5xl font-bold text-emerald-700">
                    {result.score}
                    <span className="text-2xl text-emerald-600">
                      {" "}
                      / {result.total_marks}
                    </span>
                  </p>

                  <p className="mt-3 text-sm text-slate-600">
                    Submitted {formatDate(result.submitted_at)}
                  </p>

                  <Link
                    href="/quizzes"
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Back to quizzes
                  </Link>
                </div>
              </section>
            ) : (
              <section className="space-y-5">
                {quiz.questions.map((question, index) => (
                  <article
                    key={question.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold leading-6 text-slate-950 sm:text-lg">
                          {question.question}
                        </h2>

                        <div className="mt-5 space-y-3">
                          {question.options.map(
                            (option) => (
                              <label
                                key={option}
                                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                                  answers[question.id] ===
                                  option
                                    ? "border-slate-950 bg-slate-50"
                                    : "border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option}
                                  checked={
                                    answers[question.id] ===
                                    option
                                  }
                                  onChange={() =>
                                    selectAnswer(
                                      question.id,
                                      option,
                                    )
                                  }
                                  className="h-4 w-4"
                                />

                                <span className="break-words">
                                  {option}
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Quiz
                    </>
                  )}
                </button>
              </section>
            )}

            <p className="text-center text-xs text-slate-400">
              Created {formatDate(quiz.created_at)}
            </p>
          </>
        )}
      </div>
    </AppShell>
  )
}
