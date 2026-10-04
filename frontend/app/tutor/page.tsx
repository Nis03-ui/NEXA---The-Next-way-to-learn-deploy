"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUp,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Code2,
  FileText,
  Lightbulb,
  Loader2,
  Menu,
  Plus,
  Sparkles,
  Upload,
  Target,
  X,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import ChatMessage from "@/components/tutor/ChatMessage"
import ChatSidebar from "@/components/tutor/ChatSidebar"
import NEXAAvatar from "@/components/tutor/NEXAAvatar"
import SourceCard from "@/components/tutor/SourceCard"
import TutorMode, {
  type TutorMode as TutorModeType,
} from "@/components/tutor/TutorMode"

import {
  ai,
  type AISource,
  type ChatMessage as ApiChatMessage,
} from "@/lib/api"

import { useAuth } from "@/providers/AuthProvider"

type UIMessage = {
  id: number
  role: "user" | "assistant"
  content: string
}

type QuickAction = {
  title: string
  description: string
  prompt: string
  mode: TutorModeType
  icon: typeof Sparkles
}

const STUDENT_ACTIONS: QuickAction[] = [
  {
    title: "Explain a concept",
    description: "Break down a difficult topic simply.",
    prompt:
      "Explain polymorphism with a simple example and then test my understanding.",
    mode: "explain",
    icon: Lightbulb,
  },
  {
    title: "Study step-by-step",
    description: "Learn a topic through a structured lesson.",
    prompt:
      "Teach me computer networks step by step, starting from the fundamentals.",
    mode: "study",
    icon: BookOpen,
  },
  {
    title: "Practice coding",
    description: "Learn programming by solving problems.",
    prompt:
      "Teach me TypeScript generics with practical examples and then give me a coding exercise.",
    mode: "code",
    icon: Code2,
  },
  {
    title: "Quiz me",
    description: "Test your knowledge and identify gaps.",
    prompt:
      "Give me a short quiz on computer networks. Ask one question at a time and wait for my answer.",
    mode: "quiz",
    icon: ClipboardList,
  },
]

const ADMIN_ACTIONS: QuickAction[] = [
  {
    title: "Review a concept",
    description: "Explore a topic before making decisions.",
    prompt: "Give me a concise but rigorous overview of a university topic, including key concepts and practical implications.",
    mode: "explain",
    icon: Lightbulb,
  },
  {
    title: "Analyze learning activity",
    description: "Understand common student learning patterns.",
    prompt: "Help me reason about how to improve student learning outcomes in an LMS, including useful metrics and interventions.",
    mode: "study",
    icon: Target,
  },
  {
    title: "Draft an announcement",
    description: "Write a clear academic announcement.",
    prompt: "Draft a professional college-wide academic announcement about an upcoming examination or important learning activity.",
    mode: "normal",
    icon: FileText,
  },
  {
    title: "Ask NEXA",
    description: "Use NEXA for general academic help.",
    prompt: "Help me understand an academic or technology topic clearly and concisely.",
    mode: "normal",
    icon: Sparkles,
  },
]

const TEACHER_ACTIONS: QuickAction[] = [
  {
    title: "Create a lesson plan",
    description: "Build a structured teaching session.",
    prompt:
      "Create a professional lesson plan for teaching Computer Networks, including objectives, topics, activities, and assessment.",
    mode: "study",
    icon: BookOpen,
  },
  {
    title: "Plan an exam",
    description: "Design a balanced examination.",
    prompt:
      "Help me create a balanced examination plan for Computer Networks with marks distribution, question types, and difficulty levels.",
    mode: "quiz",
    icon: CalendarDays,
  },
  {
    title: "Generate questions",
    description: "Create questions by topic and difficulty.",
    prompt:
      "Generate a set of Computer Networks questions across easy, medium, and difficult levels suitable for a university examination.",
    mode: "quiz",
    icon: ClipboardList,
  },
  {
    title: "Explain a topic",
    description: "Prepare a clear explanation for students.",
    prompt:
      "Prepare a clear university-level explanation of TCP and UDP that I can use while teaching students.",
    mode: "explain",
    icon: Lightbulb,
  },
]

export default function TutorPage() {
  const { user } = useAuth()

  const isTeacher = user?.role === "TEACHER"
  const isAdmin = user?.role === "ADMIN"

  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [tutorMode, setTutorMode] =
    useState<TutorModeType>("normal")

  const [loading, setLoading] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false)

  const [sources, setSources] = useState<AISource[]>([])

  const [uploadedNote, setUploadedNote] = useState<{
    id: number
    filename: string
    title?: string
    pages?: number
  } | null>(null)

  const [uploadingNote, setUploadingNote] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const textareaRef =
    useRef<HTMLTextAreaElement>(null)

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  const avatarState =
    loading
      ? "thinking"
      : messages.length > 0 &&
          messages[messages.length - 1]?.role === "assistant"
        ? "responding"
        : "idle"

  const quickActions = isAdmin
    ? ADMIN_ACTIONS
    : isTeacher
      ? TEACHER_ACTIONS
      : STUDENT_ACTIONS

  const handleNoteUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.type !== "application/pdf") {
      window.alert("Please upload a PDF file.")
      event.target.value = ""
      return
    }

    setUploadingNote(true)

    try {
      const result = await ai.uploadDocument(file)

      setUploadedNote({
        id: result.id,
        filename: result.filename ?? file.name,
        title: result.title,
        pages: result.pages,
      })
    } catch (error) {
      console.error("NOTE UPLOAD ERROR:", error)
      window.alert("Unable to upload this note. Please try again.")
    } finally {
      setUploadingNote(false)
      event.target.value = ""
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [messages, loading])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    )

    const requestedSession =
      params.get("session")

    if (!requestedSession) return

    const id = Number(requestedSession)

    if (!Number.isInteger(id) || id <= 0) {
      return
    }

    async function loadSession() {
      setLoadingSession(true)

      try {
        const session = await ai.session(id)

        setSessionId(session.id)

        setMessages(
          session.messages.map(
            (
              message: ApiChatMessage,
              index,
            ) => ({
              id: index,
              role:
                message.role === "user"
                  ? "user"
                  : "assistant",
              content: message.content,
            }),
          ),
        )

        setSources([])
      } catch {
        setSessionId(null)
        setMessages([])
        setSources([])
      } finally {
        setLoadingSession(false)
      }
    }

    loadSession()
  }, [])

  useEffect(() => {
    const url = new URL(
      window.location.href,
    )

    if (sessionId) {
      url.searchParams.set(
        "session",
        String(sessionId),
      )
    } else {
      url.searchParams.delete("session")
    }

    window.history.replaceState(
      {},
      "",
      url.toString(),
    )
  }, [sessionId])

  function resizeTextarea() {
    const textarea = textareaRef.current

    if (!textarea) return

    textarea.style.height = "auto"

    textarea.style.height =
      `${Math.min(
        textarea.scrollHeight,
        180,
      )}px`
  }

  function selectQuickAction(
    action: QuickAction,
  ) {
    setTutorMode(action.mode)
    setInput(action.prompt)

    setTimeout(() => {
      textareaRef.current?.focus()
      resizeTextarea()
    }, 0)
  }

  async function handleSend() {
    const message = input.trim()

    if (!message || loading) return

    const temporaryId = Date.now()

    const userMessage: UIMessage = {
      id: temporaryId,
      role: "user",
      content: message,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setInput("")
    setLoading(true)
    setSources([])

    if (textareaRef.current) {
      textareaRef.current.style.height =
        "auto"
    }

    try {
      const response = await ai.chat(
        message,
        sessionId ?? undefined,
        tutorMode,
      )

      if (
        response.session_id !== undefined
      ) {
        setSessionId(
          response.session_id,
        )
      }

      const assistantMessage: UIMessage = {
        id: temporaryId + 1,
        role: "assistant",
        content: response.answer,
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])

      setSources(
        response.sources ?? [],
      )

      setRefreshKey(
        (value) => value + 1,
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong."

      const assistantMessage: UIMessage = {
        id: temporaryId + 1,
        role: "assistant",
        content:
          `I couldn't process that request.\n\n${errorMessage}`,
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])
    } finally {
      setLoading(false)

      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      handleSend()
    }
  }

  function handleNewChat() {
    setSessionId(null)
    setMessages([])
    setInput("")
    setSources([])
    setTutorMode("normal")
    setMobileSidebarOpen(false)

    const url = new URL(
      window.location.href,
    )

    url.searchParams.delete("session")

    window.history.replaceState(
      {},
      "",
      url.toString(),
    )

    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  async function handleSelectSession(
    id: number,
  ) {
    setLoadingSession(true)
    setMobileSidebarOpen(false)

    try {
      const session = await ai.session(id)

      setSessionId(session.id)

      setMessages(
        session.messages.map(
          (
            message: ApiChatMessage,
            index,
          ) => ({
            id: index,
            role:
              message.role === "user"
                ? "user"
                : "assistant",
            content: message.content,
          }),
        ),
      )

      setSources([])
    } catch {
      setMessages([])
      setSessionId(null)
    } finally {
      setLoadingSession(false)

      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  const uniqueSources =
    useMemo(() => {
      const map =
        new Map<string, AISource>()

      for (const source of sources) {
        const key = [
          source.source_type,
          source.content_id ?? "content",
          source.document_id ?? "document",
          source.title ?? "source",
          source.chunk_index ??
            source.chunk_index ?? "chunk"
            
        ].join("-")

        if (!map.has(key)) {
          map.set(key, source)
        }
      }

      return Array.from(
        map.values(),
      )
    }, [sources])

  const isEmpty =
    messages.length === 0

  const greeting = isAdmin
    ? "What do you want to explore?"
    : isTeacher
      ? "What are you teaching today?"
      : "What do you want to learn?"

  const description = isAdmin
    ? "Use NEXA for academic insight, planning, communication, and general platform support."
    : isTeacher
      ? "Plan lessons, create assessments, explain topics, or work with your teaching material."
      : "Ask questions, understand difficult concepts, solve problems, or study directly from your course material."

  return (
    <AppShell
      allowedRoles={[
        "STUDENT",
        "TEACHER",
        "ADMIN",
      ]}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto h-full w-full max-w-[1600px]">
        <div className="relative flex h-[calc(100dvh-8rem)] min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">

          <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50/60 lg:flex xl:w-72">
            <div className="min-h-0 flex-1">
              <ChatSidebar
                currentSessionId={
                  sessionId
                }
                refreshKey={
                  refreshKey
                }
                onSelect={
                  handleSelectSession
                }
                onNew={
                  handleNewChat
                }
              />
            </div>
          </aside>

          {mobileSidebarOpen && (
            <div
              className="absolute inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] lg:hidden"
              onClick={() =>
                setMobileSidebarOpen(
                  false,
                )
              }
              aria-hidden="true"
            />
          )}

          <aside
            className={[
              "absolute inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden",
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full",
            ].join(" ")}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  Conversations
                </p>
                <p className="text-xs text-slate-500">
                  Your learning history
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(
                    false,
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close conversations"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <ChatSidebar
                currentSessionId={
                  sessionId
                }
                refreshKey={
                  refreshKey
                }
                onSelect={
                  handleSelectSession
                }
                onNew={
                  handleNewChat
                }
              />
            </div>
          </aside>

          <main className="relative flex min-w-0 flex-1 flex-col bg-white">

            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setMobileSidebarOpen(
                      true,
                    )
                  }
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
                  aria-label="Open conversations"
                >
                  <Menu size={19} />
                </button>

                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
                  <Sparkles size={16} />
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-slate-950 sm:text-base">
                    NEXA Tutor
                  </h1>

                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    <span className="text-[11px] text-slate-500">
                      {isTeacher
                        ? "Teaching assistant"
                        : "AI learning assistant"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleNewChat
                }
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Plus size={14} />

                <span className="hidden sm:inline">
                  New chat
                </span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">

                {isEmpty &&
                  !loadingSession && (
                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">

                      <div className="mb-6">
                        <NEXAAvatar
                          state={
                            avatarState
                          }
                        />
                      </div>

                      <div className="max-w-xl">
                        <div className="mb-2 flex items-center justify-center gap-2">
                          {isTeacher ? (
                            <Target
                              size={14}
                              className="text-blue-600"
                            />
                          ) : (
                            <Sparkles
                              size={14}
                              className="text-blue-600"
                            />
                          )}

                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            {isTeacher
                              ? "NEXA Teaching Assistant"
                              : "Meet NEXA"}
                          </p>
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                          {greeting}
                        </h2>

                        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
                          {description}
                        </p>
                      </div>

                      <div className="mt-7 w-full max-w-2xl">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleNoteUpload}
                        />

                        {!uploadedNote ? (
                          <button
                            type="button"
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                            disabled={uploadingNote}
                            className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                                {uploadingNote ? (
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Upload size={18} />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {uploadingNote
                                    ? "Indexing your note..."
                                    : "Study from your notes"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  Upload a PDF and let NEXA learn from it.
                                </p>
                              </div>
                            </div>

                            <FileText
                              size={18}
                              className="text-slate-400 transition group-hover:text-blue-500"
                            />
                          </button>
                        ) : (
                          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                            <div className="flex items-start gap-3">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                                <FileText size={18} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900">
                                  {uploadedNote.title ||
                                    uploadedNote.filename}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {uploadedNote.filename}
                                  {uploadedNote.pages
                                    ? ` · ${uploadedNote.pages} pages`
                                    : ""}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setTutorMode("study")

                                    const prompt =
                                      `Study this note with me: ${
                                        uploadedNote.title ||
                                        uploadedNote.filename
                                      }. Explain the key concepts step by step, use the uploaded material as the primary source, and quiz me at the end.`

                                    setInput(prompt)

                                    requestAnimationFrame(() => {
                                      textareaRef.current?.focus()
                                      resizeTextarea()
                                    })
                                  }}
                                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                  <BookOpen size={14} />
                                  Study this note
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                        {quickActions.map(
                          (action) => {
                            const Icon =
                              action.icon

                            return (
                              <button
                                key={
                                  action.title
                                }
                                type="button"
                                onClick={() =>
                                  selectQuickAction(
                                    action,
                                  )
                                }
                                className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                                    <Icon
                                      size={
                                        16
                                      }
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {
                                        action.title
                                      }
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {
                                        action.description
                                      }
                                    </p>
                                  </div>
                                </div>
                              </button>
                            )
                          },
                        )}
                      </div>

                      {!isTeacher && (
                        <div className="mt-6 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
                          <FileText
                            size={12}
                          />
                          <span>
                            You can upload your
                            study PDF and ask
                            NEXA questions about
                            it.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {loadingSession && (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <NEXAAvatar
                        state="thinking"
                        compact
                      />

                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800">
                          Loading conversation
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          NEXA is getting things
                          ready...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!loadingSession &&
                  !isEmpty && (
                    <div className="space-y-6">
                      {messages.map(
                        (message) => (
                          <ChatMessage
                            key={
                              message.id
                            }
                            role={
                              message.role
                            }
                            content={
                              message.content
                            }
                          />
                        ),
                      )}

                      {loading && (
                        <div className="flex w-full justify-start">
                          <div className="flex max-w-[92%] items-start gap-3 sm:max-w-[82%]">
                            <div className="shrink-0">
                              <NEXAAvatar
                                state="thinking"
                                compact
                              />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />

                                <span className="ml-2 text-xs text-slate-400">
                                  NEXA is thinking...
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!loading &&
                        uniqueSources.length >
                          0 && (
                          <section className="pt-2">
                            <div className="mb-3 flex items-center gap-2">
                              <div className="h-px flex-1 bg-slate-200" />

                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Sources
                              </span>

                              <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              {uniqueSources.map(
                                (
                                  source,
                                  index,
                                ) => (
                                  <SourceCard
                                    key={`${source.source_type}-${source.content_id ?? source.document_id ?? index}-${source.chunk_index}`}
                                    title={
                                      source.title ??
                                      source.filename ??
                                      "Study source"
                                    }
                                    subject={
                                      source.subject ??
                                      (source.source_type ===
                                      "student_document"
                                        ? "My study material"
                                        : "Course material")
                                    }
                                    chunkIndex={
                                      source.chunk_index
                                    }
                                  />
                                ),
                              )}
                            </div>
                          </section>
                        )}

                      <div
                        ref={
                          messagesEndRef
                        }
                      />
                    </div>
                  )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
              <div className="mx-auto w-full max-w-4xl">

                <div className="mb-3">
                  <TutorMode
                    mode={tutorMode}
                    onChange={
                      setTutorMode
                    }
                  />
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleSend()
                  }}
                  className="relative rounded-2xl border border-slate-300 bg-white shadow-sm transition focus-within:border-slate-400 focus-within:shadow-md"
                >
                  <textarea
                    ref={
                      textareaRef
                    }
                    value={input}
                    onChange={(event) => {
                      setInput(
                        event.target
                          .value,
                      )
                      resizeTextarea()
                    }}
                    onKeyDown={
                      handleKeyDown
                    }
                    placeholder={
                      isTeacher
                        ? "Ask NEXA to plan, create, explain, or prepare..."
                        : "Ask NEXA anything..."
                    }
                    rows={1}
                    disabled={loading}
                    className="block max-h-[180px] min-h-[56px] w-full resize-none bg-transparent px-4 pb-14 pt-4 pr-14 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Message NEXA"
                  />

                  <div className="absolute bottom-2.5 left-3 text-[10px] text-slate-400">
                    <span className="hidden sm:inline">
                      Enter to send · Shift +
                      Enter for new line
                    </span>

                    <span className="sm:hidden">
                      Enter to send
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      loading
                    }
                    className="absolute bottom-2.5 right-2.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    aria-label="Send message"
                  >
                    <ArrowUp size={17} />
                  </button>
                </form>

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  NEXA can make mistakes.
                  Verify important information.
                </p>
              </div>
            </div>
          </main>
        </div>
      </motion.div>
    </AppShell>
  )
}