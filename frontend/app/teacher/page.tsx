"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronDown,
  Edit3,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import AppShell from "@/components/layout/AppShell"
import {
  teacher,
  type Content,
  type ContentCreate,
  type Quiz,
  type QuizCreate,
  type QuizListItem,
  type QuizQuestionCreate,
} from "@/lib/api"

type Tab = "overview" | "resources" | "quizzes"

type ContentForm = {
  title: string
  description: string
  subject: string
  body: string
  published: boolean
}

type QuizForm = {
  title: string
  description: string
  subject: string
  time_limit_minutes: string
  published: boolean
  questions: QuizQuestionCreate[]
}

const emptyContentForm: ContentForm = {
  title: "",
  description: "",
  subject: "",
  body: "",
  published: false,
}

function createEmptyQuestion(): QuizQuestionCreate {
  return {
    question: "",
    question_type: "MCQ",
    options: ["", "", "", ""],
    correct_answer: "",
    marks: 1,
  }
}

const emptyQuizForm: QuizForm = {
  title: "",
  description: "",
  subject: "",
  time_limit_minutes: "",
  published: false,
  questions: [createEmptyQuestion()],
}

export default function TeacherPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const [content, setContent] = useState<Content[]>([])
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])

  const [loadingContent, setLoadingContent] = useState(true)
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)

  const [contentFormOpen, setContentFormOpen] = useState(false)
  const [quizFormOpen, setQuizFormOpen] = useState(false)

  const [editingContentId, setEditingContentId] = useState<number | null>(
    null,
  )
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null)

  const [contentForm, setContentForm] =
    useState<ContentForm>(emptyContentForm)

  const [quizForm, setQuizForm] =
    useState<QuizForm>(emptyQuizForm)

  const [savingContent, setSavingContent] = useState(false)
  const [savingQuiz, setSavingQuiz] = useState(false)

  const [deletingContentId, setDeletingContentId] =
    useState<number | null>(null)

  const [deletingQuizId, setDeletingQuizId] =
    useState<number | null>(null)

  const [uploading, setUploading] = useState(false)

  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")

  const [quizSearch, setQuizSearch] = useState("")
  const [quizSubjectFilter, setQuizSubjectFilter] = useState("all")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    loadContent()
    loadQuizzes()
  }, [])

  async function loadContent() {
    try {
      setLoadingContent(true)
      setError("")

      const data = await teacher.getContent()
      setContent(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load teaching resources.",
      )
    } finally {
      setLoadingContent(false)
    }
  }

  async function loadQuizzes() {
    try {
      setLoadingQuizzes(true)

      const data = await teacher.getQuizzes()
      setQuizzes(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load quizzes.",
      )
    } finally {
      setLoadingQuizzes(false)
    }
  }

  function clearMessages() {
    setError("")
    setSuccess("")
  }

  /* =========================================================
     RESOURCE HELPERS
  ========================================================= */

  const subjects = useMemo(() => {
    return Array.from(
      new Set(
        content
          .map((item) => item.subject)
          .filter(Boolean),
      ),
    ).sort()
  }, [content])

  const filteredContent = useMemo(() => {
    const query = search.trim().toLowerCase()

    return content.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query)

      const matchesSubject =
        subjectFilter === "all" ||
        item.subject === subjectFilter

      return matchesSearch && matchesSubject
    })
  }, [content, search, subjectFilter])

  const publishedCount = content.filter(
    (item) => item.published,
  ).length

  const draftCount = content.length - publishedCount

  const quizSubjects = useMemo(() => {
    return Array.from(
      new Set(
        quizzes
          .map((quiz) => quiz.subject)
          .filter(Boolean),
      ),
    ).sort()
  }, [quizzes])

  const filteredQuizzes = useMemo(() => {
    const query = quizSearch.trim().toLowerCase()

    return quizzes.filter((quiz) => {
      const matchesSearch =
        !query ||
        quiz.title.toLowerCase().includes(query) ||
        quiz.subject.toLowerCase().includes(query)

      const matchesSubject =
        quizSubjectFilter === "all" ||
        quiz.subject === quizSubjectFilter

      return matchesSearch && matchesSubject
    })
  }, [quizzes, quizSearch, quizSubjectFilter])

  const publishedQuizCount = quizzes.filter(
    (quiz) => quiz.published,
  ).length

  /* =========================================================
     CONTENT FORM
  ========================================================= */

  function openCreateContent() {
    clearMessages()
    setEditingContentId(null)
    setContentForm(emptyContentForm)
    setContentFormOpen(true)
  }

  function openEditContent(item: Content) {
    clearMessages()

    setEditingContentId(item.id)

    setContentForm({
      title: item.title,
      description: item.description ?? "",
      subject: item.subject,
      body: item.body,
      published: item.published,
    })

    setContentFormOpen(true)
  }

  function closeContentForm() {
    if (savingContent) return

    setContentFormOpen(false)
    setEditingContentId(null)
    setContentForm(emptyContentForm)
  }

  async function handleContentSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !contentForm.title.trim() ||
      !contentForm.subject.trim() ||
      !contentForm.body.trim()
    ) {
      setError("Title, subject, and content are required.")
      return
    }

    try {
      setSavingContent(true)
      clearMessages()

      const payload: ContentCreate = {
        title: contentForm.title.trim(),
        description:
          contentForm.description.trim() || null,
        subject: contentForm.subject.trim(),
        body: contentForm.body.trim(),
        published: contentForm.published,
      }

      if (editingContentId !== null) {
        const updated = await teacher.updateContent(
          editingContentId,
          payload,
        )

        setContent((current) =>
          current.map((item) =>
            item.id === editingContentId
              ? updated
              : item,
          ),
        )

        setSuccess("Resource updated successfully.")
      } else {
        const created = await teacher.createContent(payload)

        setContent((current) => [
          created,
          ...current,
        ])

        setSuccess("Resource created successfully.")
      }

      closeContentForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save this resource.",
      )
    } finally {
      setSavingContent(false)
    }
  }

  async function handleDeleteContent(id: number) {
    const item = content.find(
      (contentItem) => contentItem.id === id,
    )

    if (!item) return

    const confirmed = window.confirm(
      `Delete "${item.title}"?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) return

    try {
      setDeletingContentId(id)
      clearMessages()

      await teacher.deleteContent(id)

      setContent((current) =>
        current.filter((item) => item.id !== id),
      )

      setSuccess("Resource deleted successfully.")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this resource.",
      )
    } finally {
      setDeletingContentId(null)
    }
  }

  async function toggleContentPublished(item: Content) {
    try {
      clearMessages()

      const updated = await teacher.updateContent(
        item.id,
        {
          published: !item.published,
        },
      )

      setContent((current) =>
        current.map((contentItem) =>
          contentItem.id === item.id
            ? updated
            : contentItem,
        ),
      )

      setSuccess(
        updated.published
          ? "Resource published successfully."
          : "Resource moved to drafts.",
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update publishing status.",
      )
    }
  }

  /* =========================================================
     PDF UPLOAD
  ========================================================= */

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function handlePDFUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.")
      event.target.value = ""
      return
    }

    const titleFromFile = file.name
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .trim()

    const title = window.prompt(
      "Resource title",
      titleFromFile,
    )

    if (!title?.trim()) {
      event.target.value = ""
      return
    }

    const subject = window.prompt(
      "Subject",
      "General",
    )

    if (!subject?.trim()) {
      event.target.value = ""
      return
    }

    try {
      setUploading(true)
      clearMessages()

      const uploaded = await teacher.uploadPDF(
        file,
        title.trim(),
        subject.trim(),
        undefined,
        false,
      )

      setContent((current) => [
        uploaded,
        ...current,
      ])

      setSuccess(
        "PDF uploaded, extracted, and indexed successfully.",
      )

      setActiveTab("resources")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the PDF.",
      )
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  /* =========================================================
     QUIZ HELPERS
  ========================================================= */

  function openCreateQuiz() {
    clearMessages()

    setEditingQuizId(null)
    setQuizForm({
      ...emptyQuizForm,
      questions: [createEmptyQuestion()],
    })

    setQuizFormOpen(true)
  }

  async function openEditQuiz(item: QuizListItem) {
    try {
      clearMessages()

      const quiz = await teacher.getQuiz(item.id)

      setEditingQuizId(quiz.id)

      setQuizForm({
        title: quiz.title,
        description: quiz.description ?? "",
        subject: quiz.subject,
        time_limit_minutes:
          quiz.time_limit_minutes?.toString() ?? "",
        published: quiz.published,
        questions: quiz.questions.map((question) => ({
          question: question.question,
          question_type: question.question_type,
          options: question.options,
          correct_answer: "",
          marks: question.marks,
        })),
      })

      setQuizFormOpen(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this quiz.",
      )
    }
  }

  function closeQuizForm() {
    if (savingQuiz) return

    setQuizFormOpen(false)
    setEditingQuizId(null)
    setQuizForm(emptyQuizForm)
  }

  function updateQuizField(
    field: keyof QuizForm,
    value: string | boolean,
  ) {
    setQuizForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateQuestion(
    index: number,
    field: keyof QuizQuestionCreate,
    value: string | number | string[],
  ) {
    setQuizForm((current) => {
      const questions = [...current.questions]

      questions[index] = {
        ...questions[index],
        [field]: value,
      }

      return {
        ...current,
        questions,
      }
    })
  }

  function updateQuestionOption(
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setQuizForm((current) => {
      const questions = [...current.questions]
      const question = questions[questionIndex]

      const options = [...(question.options ?? [])]
      options[optionIndex] = value

      questions[questionIndex] = {
        ...question,
        options,
      }

      return {
        ...current,
        questions,
      }
    })
  }

  function addQuestion() {
    setQuizForm((current) => ({
      ...current,
      questions: [
        ...current.questions,
        createEmptyQuestion(),
      ],
    }))
  }

  function removeQuestion(index: number) {
    if (quizForm.questions.length === 1) {
      setError("A quiz must contain at least one question.")
      return
    }

    setQuizForm((current) => ({
      ...current,
      questions: current.questions.filter(
        (_, questionIndex) =>
          questionIndex !== index,
      ),
    }))
  }

  function validateQuiz() {
    if (!quizForm.title.trim()) {
      return "Quiz title is required."
    }

    if (!quizForm.subject.trim()) {
      return "Quiz subject is required."
    }

    if (quizForm.questions.length === 0) {
      return "Add at least one question."
    }

    for (
      let index = 0;
      index < quizForm.questions.length;
      index++
    ) {
      const question = quizForm.questions[index]

      if (!question.question.trim()) {
        return `Question ${index + 1} is empty.`
      }

      const options = question.options ?? []

      if (
        options.length !== 4 ||
        options.some((option) => !option.trim())
      ) {
        return `Question ${index + 1} needs four options.`
      }

      if (!question.correct_answer.trim()) {
        return `Select the correct answer for question ${
          index + 1
        }.`
      }

      if (
        !options.some(
          (option) =>
            option === question.correct_answer,
        )
      ) {
        return `Correct answer for question ${
          index + 1
        } must match one of its options.`
      }

      if (
        !Number.isFinite(question.marks) ||
        Number(question.marks) < 1
      ) {
        return `Question ${index + 1} must have at least 1 mark.`
      }
    }

    return null
  }

  async function handleQuizSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const validationError = validateQuiz()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSavingQuiz(true)
      clearMessages()

      const timeLimit =
        quizForm.time_limit_minutes.trim() === ""
          ? null
          : Number(quizForm.time_limit_minutes)

      if (
        timeLimit !== null &&
        (!Number.isFinite(timeLimit) ||
          timeLimit <= 0)
      ) {
        setError("Time limit must be a positive number.")
        return
      }

      const payload: QuizCreate = {
        title: quizForm.title.trim(),
        description:
          quizForm.description.trim() || null,
        subject: quizForm.subject.trim(),
        time_limit_minutes: timeLimit,
        published: quizForm.published,
        questions: quizForm.questions.map(
          (question) => ({
            question: question.question.trim(),
            question_type:
              question.question_type ?? "MCQ",
            options: (question.options ?? []).map(
              (option) => option.trim(),
            ),
            correct_answer:
              question.correct_answer.trim(),
            marks: Number(question.marks) || 1,
          }),
        ),
      }

      if (editingQuizId !== null) {
        const updated = await teacher.updateQuiz(
          editingQuizId,
          payload,
        )

        setQuizzes((current) =>
          current.map((quiz) =>
            quiz.id === editingQuizId
              ? {
                  ...quiz,
                  title: updated.title,
                  description: updated.description,
                  subject: updated.subject,
                  published: updated.published,
                  time_limit_minutes:
                    updated.time_limit_minutes,
                  question_count:
                    updated.questions.length,
                }
              : quiz,
          ),
        )

        setSuccess("Quiz updated successfully.")
      } else {
        const created = await teacher.createQuiz(
          payload,
        )

        setQuizzes((current) => [
          {
            id: created.id,
            title: created.title,
            description: created.description,
            subject: created.subject,
            author_id: created.author_id,
            published: created.published,
            time_limit_minutes:
              created.time_limit_minutes,
            question_count:
              created.questions.length,
          },
          ...current,
        ])

        setSuccess("Quiz created successfully.")
      }

      closeQuizForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save this quiz.",
      )
    } finally {
      setSavingQuiz(false)
    }
  }

  async function handleDeleteQuiz(id: number) {
    const quiz = quizzes.find(
      (item) => item.id === id,
    )

    if (!quiz) return

    const confirmed = window.confirm(
      `Delete "${quiz.title}"?\n\nAll quiz attempts associated with this quiz will also be removed.`,
    )

    if (!confirmed) return

    try {
      setDeletingQuizId(id)
      clearMessages()

      await teacher.deleteQuiz(id)

      setQuizzes((current) =>
        current.filter((quiz) => quiz.id !== id),
      )

      setSuccess("Quiz deleted successfully.")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this quiz.",
      )
    } finally {
      setDeletingQuizId(null)
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <BookOpen className="h-3.5 w-3.5" />
                Teacher workspace
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Course management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create learning resources, publish course
                material, and build assessments for your
                students.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload PDF
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePDFUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={openCreateContent}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New resource
              </button>

              <button
                type="button"
                onClick={openCreateQuiz}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <HelpCircle className="h-4 w-4" />
                Create quiz
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span>{success}</span>

              <button
                type="button"
                onClick={() => setSuccess("")}
                className="shrink-0"
                aria-label="Dismiss success message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
            {(
              [
                ["overview", "Overview"],
                ["resources", "Resources"],
                ["quizzes", "Quizzes"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === value
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* =====================================================
              OVERVIEW
          ===================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={<FileText className="h-5 w-5" />}
                  label="Resources"
                  value={content.length}
                  detail={`${publishedCount} published`}
                />

                <StatCard
                  icon={<Check className="h-5 w-5" />}
                  label="Published"
                  value={publishedCount}
                  detail={`${draftCount} drafts`}
                />

                <StatCard
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Quizzes"
                  value={quizzes.length}
                  detail={`${publishedQuizCount} published`}
                />

                <StatCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Subjects"
                  value={subjects.length}
                  detail="Active course subjects"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-950">
                        Recent resources
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Your latest course material.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab("resources")
                      }
                      className="text-sm font-medium text-slate-700 hover:text-slate-950"
                    >
                      View all
                    </button>
                  </div>

                  {loadingContent ? (
                    <LoadingState />
                  ) : content.length === 0 ? (
                    <EmptyState
                      icon={
                        <FileText className="h-6 w-6" />
                      }
                      title="No resources yet"
                      description="Upload a PDF or create your first learning resource."
                      action={
                        <button
                          type="button"
                          onClick={openCreateContent}
                          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                        >
                          Create resource
                        </button>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {content
                        .slice(0, 5)
                        .map((item) => (
                          <ResourceRow
                            key={item.id}
                            item={item}
                            onEdit={() =>
                              openEditContent(item)
                            }
                            onDelete={() =>
                              handleDeleteContent(
                                item.id,
                              )
                            }
                          />
                        ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-5">
                    <h2 className="font-semibold text-slate-950">
                      Assessment overview
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Your latest quizzes.
                    </p>
                  </div>

                  {loadingQuizzes ? (
                    <LoadingState />
                  ) : quizzes.length === 0 ? (
                    <EmptyState
                      icon={
                        <HelpCircle className="h-6 w-6" />
                      }
                      title="No quizzes yet"
                      description="Create an assessment for your students."
                      action={
                        <button
                          type="button"
                          onClick={openCreateQuiz}
                          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                        >
                          Create quiz
                        </button>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {quizzes
                        .slice(0, 5)
                        .map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {quiz.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {quiz.subject} ·{" "}
                                {quiz.question_count}{" "}
                                questions
                              </p>
                            </div>

                            <StatusBadge
                              published={
                                quiz.published
                              }
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* =====================================================
              RESOURCES
          ===================================================== */}
          {activeTab === "resources" && (
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Learning resources
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage notes, PDFs, and course material.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search resources..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 sm:w-64"
                      />
                    </div>

                    <select
                      value={subjectFilter}
                      onChange={(event) =>
                        setSubjectFilter(
                          event.target.value,
                        )
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                    >
                      <option value="all">
                        All subjects
                      </option>

                      {subjects.map((subject) => (
                        <option
                          key={subject}
                          value={subject}
                        >
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loadingContent ? (
                <LoadingState />
              ) : filteredContent.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title={
                    content.length === 0
                      ? "No resources yet"
                      : "No matching resources"
                  }
                  description={
                    content.length === 0
                      ? "Create notes or upload a PDF to start building your course library."
                      : "Try changing your search or subject filter."
                  }
                  action={
                    content.length === 0 ? (
                      <button
                        type="button"
                        onClick={openCreateContent}
                        className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                      >
                        Create resource
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-slate-950">
                              {item.title}
                            </h3>

                            <StatusBadge
                              published={
                                item.published
                              }
                            />
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.subject}
                            {item.description
                              ? ` · ${item.description}`
                              : ""}
                          </p>

                          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-5 text-slate-400">
                            {item.body}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleContentPublished(
                              item,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white"
                        >
                          {item.published
                            ? "Unpublish"
                            : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditContent(item)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteContent(
                              item.id,
                            )
                          }
                          disabled={
                            deletingContentId ===
                            item.id
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingContentId ===
                          item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* =====================================================
              QUIZZES
          ===================================================== */}
          {activeTab === "quizzes" && (
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Quiz management
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Create and publish assessments for your
                      students.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        value={quizSearch}
                        onChange={(event) =>
                          setQuizSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search quizzes..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 sm:w-56"
                      />
                    </div>

                    <select
                      value={quizSubjectFilter}
                      onChange={(event) =>
                        setQuizSubjectFilter(
                          event.target.value,
                        )
                      }
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                    >
                      <option value="all">
                        All subjects
                      </option>

                      {quizSubjects.map((subject) => (
                        <option
                          key={subject}
                          value={subject}
                        >
                          {subject}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={openCreateQuiz}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Create quiz
                    </button>
                  </div>
                </div>
              </div>

              {loadingQuizzes ? (
                <LoadingState />
              ) : filteredQuizzes.length === 0 ? (
                <EmptyState
                  icon={
                    <HelpCircle className="h-6 w-6" />
                  }
                  title={
                    quizzes.length === 0
                      ? "No quizzes yet"
                      : "No matching quizzes"
                  }
                  description={
                    quizzes.length === 0
                      ? "Build your first assessment with multiple-choice questions."
                      : "Try another search or subject filter."
                  }
                  action={
                    quizzes.length === 0 ? (
                      <button
                        type="button"
                        onClick={openCreateQuiz}
                        className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                      >
                        Create quiz
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <HelpCircle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-slate-950">
                              {quiz.title}
                            </h3>

                            <StatusBadge
                              published={
                                quiz.published
                              }
                            />
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {quiz.subject} ·{" "}
                            {quiz.question_count}{" "}
                            questions
                            {quiz.time_limit_minutes
                              ? ` · ${quiz.time_limit_minutes} min`
                              : ""}
                          </p>

                          {quiz.description && (
                            <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditQuiz(quiz)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteQuiz(
                              quiz.id,
                            )
                          }
                          disabled={
                            deletingQuizId ===
                            quiz.id
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingQuizId ===
                          quiz.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* =========================================================
          RESOURCE MODAL
      ========================================================= */}
      {contentFormOpen && (
        <Modal
          title={
            editingContentId !== null
              ? "Edit resource"
              : "Create resource"
          }
          onClose={closeContentForm}
        >
          <form
            onSubmit={handleContentSubmit}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                required
              >
                <input
                  value={contentForm.title}
                  onChange={(event) =>
                    setContentForm(
                      (current) => ({
                        ...current,
                        title: event.target.value,
                      }),
                    )
                  }
                  placeholder="e.g. Introduction to Machine Learning"
                  className="form-input"
                />
              </Field>

              <Field
                label="Subject"
                required
              >
                <input
                  value={contentForm.subject}
                  onChange={(event) =>
                    setContentForm(
                      (current) => ({
                        ...current,
                        subject:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="e.g. Machine Learning"
                  className="form-input"
                />
              </Field>
            </div>

            <Field label="Description">
              <input
                value={contentForm.description}
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                placeholder="Short description of this resource"
                className="form-input"
              />
            </Field>

            <Field
              label="Content"
              required
            >
              <textarea
                value={contentForm.body}
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
                rows={12}
                placeholder="Write your notes or learning material here..."
                className="form-input resize-y"
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={contentForm.published}
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    published:
                      event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              <div>
                <p className="text-sm font-medium text-slate-800">
                  Publish resource
                </p>
                <p className="text-xs text-slate-500">
                  Published resources can be used by
                  students and NEXA's knowledge system.
                </p>
              </div>
            </label>

            <ModalActions
              saving={savingContent}
              onCancel={closeContentForm}
              submitLabel={
                editingContentId !== null
                  ? "Save changes"
                  : "Create resource"
              }
            />
          </form>
        </Modal>
      )}

      {/* =========================================================
          QUIZ MODAL
      ========================================================= */}
      {quizFormOpen && (
        <Modal
          title={
            editingQuizId !== null
              ? "Edit quiz"
              : "Create quiz"
          }
          onClose={closeQuizForm}
          wide
        >
          <form
            onSubmit={handleQuizSubmit}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Quiz title"
                required
              >
                <input
                  value={quizForm.title}
                  onChange={(event) =>
                    updateQuizField(
                      "title",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Python Fundamentals"
                  className="form-input"
                />
              </Field>

              <Field
                label="Subject"
                required
              >
                <input
                  value={quizForm.subject}
                  onChange={(event) =>
                    updateQuizField(
                      "subject",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Programming"
                  className="form-input"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Description">
                <input
                  value={quizForm.description}
                  onChange={(event) =>
                    updateQuizField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Describe what students will be assessed on"
                  className="form-input"
                />
              </Field>

              <Field label="Time limit (minutes)">
                <input
                  type="number"
                  min="1"
                  value={quizForm.time_limit_minutes}
                  onChange={(event) =>
                    updateQuizField(
                      "time_limit_minutes",
                      event.target.value,
                    )
                  }
                  placeholder="Optional"
                  className="form-input"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Questions
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Build multiple-choice questions with
                    four answer options.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  {quizForm.questions.length}{" "}
                  question
                  {quizForm.questions.length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

              <div className="space-y-4">
                {quizForm.questions.map(
                  (question, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">
                            {index + 1}
                          </span>

                          <span className="text-sm font-medium text-slate-800">
                            Question
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeQuestion(index)
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>

                      <div className="space-y-4">
                        <Field
                          label="Question text"
                          required
                        >
                          <textarea
                            value={
                              question.question
                            }
                            onChange={(event) =>
                              updateQuestion(
                                index,
                                "question",
                                event.target.value,
                              )
                            }
                            rows={3}
                            placeholder="Enter the question..."
                            className="form-input resize-y"
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {(question.options ?? []).map(
                            (
                              option,
                              optionIndex,
                            ) => (
                              <div
                                key={optionIndex}
                                className="relative"
                              >
                                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                  Option{" "}
                                  {String.fromCharCode(
                                    65 +
                                      optionIndex,
                                  )}
                                </label>

                                <input
                                  value={option}
                                  onChange={(
                                    event,
                                  ) =>
                                    updateQuestionOption(
                                      index,
                                      optionIndex,
                                      event
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder={`Option ${String.fromCharCode(
                                    65 +
                                      optionIndex,
                                  )}`}
                                  className="form-input pr-10"
                                />

                                {question.correct_answer ===
                                  option &&
                                  option.trim() !==
                                    "" && (
                                    <Check className="absolute right-3 top-9 h-4 w-4 text-emerald-600" />
                                  )}
                              </div>
                            ),
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Correct answer"
                            required
                          >
                            <select
                              value={
                                question.correct_answer
                              }
                              onChange={(event) =>
                                updateQuestion(
                                  index,
                                  "correct_answer",
                                  event.target.value,
                                )
                              }
                              className="form-input"
                            >
                              <option value="">
                                Select correct answer
                              </option>

                              {(question.options ??
                                []).map(
                                (
                                  option,
                                  optionIndex,
                                ) => (
                                  <option
                                    key={
                                      optionIndex
                                    }
                                    value={option}
                                    disabled={
                                      !option.trim()
                                    }
                                  >
                                    Option{" "}
                                    {String.fromCharCode(
                                      65 +
                                        optionIndex,
                                    )}
                                    {option
                                      ? ` — ${option}`
                                      : ""}
                                  </option>
                                ),
                              )}
                            </select>
                          </Field>

                          <Field label="Marks">
                            <input
                              type="number"
                              min="1"
                              value={
                                question.marks
                              }
                              onChange={(event) =>
                                updateQuestion(
                                  index,
                                  "marks",
                                  Number(
                                    event.target
                                      .value,
                                  ),
                                )
                              }
                              className="form-input"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                <Plus className="h-4 w-4" />
                Add question
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input
                type="checkbox"
                checked={quizForm.published}
                onChange={(event) =>
                  updateQuizField(
                    "published",
                    event.target.checked,
                  )
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              <div>
                <p className="text-sm font-medium text-slate-800">
                  Publish quiz
                </p>
                <p className="text-xs text-slate-500">
                  Students will be able to see and attempt
                  the quiz.
                </p>
              </div>
            </label>

            <ModalActions
              saving={savingQuiz}
              onCancel={closeQuizForm}
              submitLabel={
                editingQuizId !== null
                  ? "Save quiz"
                  : "Create quiz"
              }
            />
          </form>
        </Modal>
      )}
    </AppShell>
  )
}

/* =============================================================
   SMALL COMPONENTS
============================================================= */

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detail}
      </p>
    </div>
  )
}

function ResourceRow({
  item,
  onEdit,
  onDelete,
}: {
  item: Content
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
        <FileText className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-900">
            {item.title}
          </p>

          <StatusBadge
            published={item.published}
          />
        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {item.subject}
        </p>
      </div>

      <div className="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"
          aria-label={`Edit ${item.title}`}
        >
          <Edit3 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function StatusBadge({
  published,
}: {
  published: boolean
}) {
  return published ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      Published
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
      Draft
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <h3 className="font-medium text-slate-900">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">
        {description}
      </p>

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ${
          wide ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="font-semibold text-slate-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean
  onCancel: () => void
  submitLabel: string
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {submitLabel}
      </button>
    </div>
  )
}