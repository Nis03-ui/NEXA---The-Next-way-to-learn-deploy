"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Loader2,
  RotateCcw,
  Trophy,
} from "lucide-react"
import AppShell from "@/components/layout/AppShell"
import {
  quizzes,
  type Quiz,
  type QuizAttempt,
  type QuizListItem,
} from "@/lib/api"

type View = "library" | "attempt" | "result"

export default function QuizzesPage() {
  const [view, setView] = useState<View>("library")

  const [quizList, setQuizList] = useState<QuizListItem[]>([])
  const [selectedQuiz, setSelectedQuiz] =
    useState<Quiz | null>(null)

  const [attempt, setAttempt] =
    useState<QuizAttempt | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [selectedQuestion, setSelectedQuestion] =
    useState(0)

  const [answers, setAnswers] = useState<
    Record<number, string>
  >({})

  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("all")

  const [error, setError] = useState("")

  useEffect(() => {
    loadQuizzes()
  }, [])

  async function loadQuizzes() {
    try {
      setLoading(true)
      setError("")

      const data = await quizzes.getAll()
      setQuizList(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load quizzes.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function startQuiz(id: number) {
    try {
      setLoadingQuiz(true)
      setError("")

      const quiz = await quizzes.getById(id)

      if (quiz.questions.length === 0) {
        setError("This quiz does not contain any questions.")
        return
      }

      setSelectedQuiz(quiz)
      setAnswers({})
      setSelectedQuestion(0)
      setAttempt(null)
      setView("attempt")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open this quiz.",
      )
    } finally {
      setLoadingQuiz(false)
    }
  }

  function selectAnswer(
    questionId: number,
    answer: string,
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }))
  }

  async function submitQuiz() {
    if (!selectedQuiz) return

    const unanswered = selectedQuiz.questions.filter(
      (question) => !answers[question.id],
    )

    if (unanswered.length > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered.length} unanswered question${
          unanswered.length === 1 ? "" : "s"
        }.\n\nSubmit anyway?`,
      )

      if (!confirmed) return
    }

    try {
      setSubmitting(true)
      setError("")

      const result = await quizzes.submitAttempt(
        selectedQuiz.id,
        selectedQuiz.questions.map((question) => ({
          question_id: question.id,
          answer: answers[question.id] ?? "",
        })),
      )

      setAttempt(result)
      setView("result")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your quiz.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function backToLibrary() {
    setSelectedQuiz(null)
    setAttempt(null)
    setAnswers({})
    setSelectedQuestion(0)
    setView("library")
  }

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          quizList
            .map((quiz) => quiz.subject)
            .filter(Boolean),
        ),
      ).sort(),
    [quizList],
  )

  const filteredQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase()

    return quizList.filter((quiz) => {
      const matchesSearch =
        !query ||
        quiz.title.toLowerCase().includes(query) ||
        quiz.subject.toLowerCase().includes(query) ||
        (quiz.description ?? "")
          .toLowerCase()
          .includes(query)

      const matchesSubject =
        subject === "all" ||
        quiz.subject === subject

      return matchesSearch && matchesSubject
    })
  }, [quizList, search, subject])

  if (view === "attempt" && selectedQuiz) {
    return (
      <QuizAttemptView
        quiz={selectedQuiz}
        answers={answers}
        currentQuestion={selectedQuestion}
        submitting={submitting}
        error={error}
        onAnswer={selectAnswer}
        onQuestionChange={setSelectedQuestion}
        onSubmit={submitQuiz}
        onBack={backToLibrary}
      />
    )
  }

  if (view === "result" && selectedQuiz && attempt) {
    return (
      <QuizResultView
        quiz={selectedQuiz}
        attempt={attempt}
        onBack={backToLibrary}
        onRetry={() => startQuiz(selectedQuiz.id)}
      />
    )
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <HelpCircle className="h-3.5 w-3.5" />
              NEXA Assessments
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Test your understanding
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Take quizzes created by your teachers and
              measure your understanding of each subject.
            </p>
          </header>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <MiniStat
              icon={<HelpCircle className="h-4 w-4" />}
              label="Available quizzes"
              value={quizList.length}
            />

            <MiniStat
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="Subjects"
              value={subjects.length}
            />

            <MiniStat
              icon={<Trophy className="h-4 w-4" />}
              label="Ready to learn"
              value="Start"
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Quiz library
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose an assessment to begin.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search quizzes..."
                    className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-400 sm:w-60"
                  />

                  <select
                    value={subject}
                    onChange={(event) =>
                      setSubject(event.target.value)
                    }
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                  >
                    <option value="all">
                      All subjects
                    </option>

                    {subjects.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : filteredQuizzes.length === 0 ? (
              <EmptyQuizState />
            ) : (
              <motion.div layout className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
                <AnimatePresence mode="popLayout">{filteredQuizzes.map((quiz) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                  >
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    loading={
                      loadingQuiz
                    }
                    onStart={() =>
                      startQuiz(quiz.id)
                    }
                  />
                  </motion.div>
                ))}</AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  )
}

/* =========================================================
   QUIZ CARD
========================================================= */

function QuizCard({
  quiz,
  loading,
  onStart,
}: {
  quiz: QuizListItem
  loading: boolean
  onStart: () => void
}) {
  return (
    <motion.article whileHover={{ y: -4 }} whileTap={{ scale: 0.995 }} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <HelpCircle className="h-5 w-5" />
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          Available
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-950">
        {quiz.title}
      </h3>

      <p className="mt-1 text-sm font-medium text-slate-500">
        {quiz.subject}
      </p>

      {quiz.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">
          {quiz.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
          {quiz.question_count} questions
        </span>

        {quiz.time_limit_minutes && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {quiz.time_limit_minutes} min
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        Start quiz

        {!loading && (
          <ArrowRight className="h-4 w-4" />
        )}
      </button>
    </motion.article>
  )
}

/* =========================================================
   ATTEMPT VIEW
========================================================= */

function QuizAttemptView({
  quiz,
  answers,
  currentQuestion,
  submitting,
  error,
  onAnswer,
  onQuestionChange,
  onSubmit,
  onBack,
}: {
  quiz: Quiz
  answers: Record<number, string>
  currentQuestion: number
  submitting: boolean
  error: string
  onAnswer: (
    questionId: number,
    answer: string,
  ) => void
  onQuestionChange: (index: number) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const question = quiz.questions[currentQuestion]

  const answeredCount = quiz.questions.filter(
    (item) => answers[item.id],
  ).length

  const progress =
    quiz.questions.length > 0
      ? ((currentQuestion + 1) /
          quiz.questions.length) *
        100
      : 0

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to quizzes
          </button>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {quiz.subject}
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {quiz.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock3 className="h-4 w-4" />

                {quiz.time_limit_minutes
                  ? `${quiz.time_limit_minutes} min`
                  : "No time limit"}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>
                  Question {currentQuestion + 1} of{" "}
                  {quiz.questions.length}
                </span>

                <span>
                  {answeredCount}/
                  {quiz.questions.length} answered
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-7">
                <p className="text-sm font-medium text-slate-400">
                  Question {currentQuestion + 1}
                </p>

                <h2 className="mt-2 text-xl font-semibold leading-8 text-slate-950">
                  {question.question}
                </h2>
              </div>

              <div className="space-y-3">
                {question.options.map(
                  (option, index) => {
                    const selected =
                      answers[question.id] ===
                      option

                    return (
                      <motion.button
                        whileTap={{ scale: 0.985 }}
                        key={option}
                        type="button"
                        onClick={() =>
                          onAnswer(
                            question.id,
                            option,
                          )
                        }
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                            selected
                              ? "bg-white/15 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(
                            65 + index,
                          )}
                        </span>

                        <span className="text-sm font-medium">
                          {option}
                        </span>
                      </motion.button>
                    )
                  },
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={
                    currentQuestion === 0
                  }
                  onClick={() =>
                    onQuestionChange(
                      currentQuestion - 1,
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentQuestion ===
                quiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    Submit quiz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onQuestionChange(
                        currentQuestion + 1,
                      )
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Questions
              </p>

              <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
                {quiz.questions.map(
                  (item, index) => {
                    const answered =
                      Boolean(answers[item.id])

                    const active =
                      index === currentQuestion

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          onQuestionChange(
                            index,
                          )
                        }
                        className={`h-9 rounded-lg text-xs font-semibold transition ${
                          active
                            ? "bg-slate-950 text-white"
                            : answered
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {index + 1}
                      </button>
                    )
                  },
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  )
}

/* =========================================================
   RESULT VIEW
========================================================= */

function QuizResultView({
  quiz,
  attempt,
  onBack,
  onRetry,
}: {
  quiz: Quiz
  attempt: QuizAttempt
  onBack: () => void
  onRetry: () => void
}) {
  const percentage =
    attempt.total_marks > 0
      ? Math.round(
          (attempt.score /
            attempt.total_marks) *
            100,
        )
      : 0

  return (
    <AppShell>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Trophy className="h-8 w-8" />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Quiz completed
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {quiz.title}
            </h1>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <ResultStat
                label="Score"
                value={`${attempt.score}/${attempt.total_marks}`}
              />

              <ResultStat
                label="Percentage"
                value={`${percentage}%`}
              />

              <ResultStat
                label="Questions"
                value={quiz.questions.length}
              />
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-500">
                Your result has been recorded.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Review your answers below to understand
                where you can improve.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {quiz.questions.map(
                (question, index) => {
                  const result =
                    attempt.answers.find(
                      (answer) =>
                        answer.question_id ===
                        question.id,
                    )

                  if (!result) return null

                  return (
                    <div
                      key={question.id}
                      className={`rounded-xl border p-4 ${
                        result.is_correct
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-red-100 bg-red-50/60"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                            result.is_correct
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {question.question}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            Your answer:{" "}
                            <span className="font-medium text-slate-700">
                              {result.answer ||
                                "Not answered"}
                            </span>
                          </p>

                          <p className="mt-1 text-xs font-medium">
                            {result.is_correct
                              ? "Correct"
                              : "Incorrect"}{" "}
                            · {result.marks_awarded}{" "}
                            mark
                            {result.marks_awarded !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                },
              )}
            </div>

            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to quizzes
              </button>

              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-medium text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  )
}

/* =========================================================
   SUPPORTING COMPONENTS
========================================================= */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 text-lg font-semibold text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function ResultStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
    </div>
  )
}

function EmptyQuizState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <HelpCircle className="h-6 w-6" />
      </div>

      <h3 className="mt-4 font-medium text-slate-900">
        No quizzes found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Published teacher assessments will appear here
        when they are available.
      </p>
    </div>
  )
}