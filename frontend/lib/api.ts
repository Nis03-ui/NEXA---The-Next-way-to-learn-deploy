const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

type ApiError = {
  detail?: string
  message?: string
}

/* =========================================================
   AUTH TYPES
========================================================= */

export type Role = "STUDENT" | "TEACHER" | "ADMIN"

export type AuthUser = {
  id: number
  name: string
  email: string
  role: Role
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  user: AuthUser
}

export type MessageResponse = {
  message: string
}

export type VerificationResponse = {
  message: string
  verification_token?: string | null
}

export type ForgotPasswordResponse = {
  message: string
  reset_token?: string | null
}

/* =========================================================
   AI / CHAT TYPES
========================================================= */

export type TutorMode =
  | "normal"
  | "explain"
  | "study"
  | "code"
  | "quiz"

export type ChatSession = {
  id: number
  title: string
  created_at: string
}

export type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
  created_at: string
}

export type ChatSessionDetail = {
  id: number
  title: string
  created_at: string
  messages: ChatMessage[]
}

export type AISource = {
  content_id: number
  title: string
  subject: string
  chunk_index: number
  distance: number
}

export type ChatResponse = {
  answer: string
  session_id: number
  agent: string
  sources: AISource[]
}

/* =========================================================
   TEACHER / CMS TYPES
========================================================= */

export type Content = {
  id: number
  title: string
  description: string | null
  body: string
  subject: string
  author_id: number
  published: boolean
  created_at: string
  updated_at: string | null
}

export type ContentCreate = {
  title: string
  description?: string | null
  body: string
  subject: string
  published?: boolean
}

export type ContentUpdate = {
  title?: string | null
  description?: string | null
  body?: string | null
  subject?: string | null
  published?: boolean | null
}

/* =========================================================
   BASE API CLIENT
========================================================= */

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("nexa_token")
      : null

  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = data as ApiError | null

    throw new Error(
      error?.detail ||
        error?.message ||
        `Request failed with status ${response.status}`,
    )
  }

  return data as T
}

/* =========================================================
   AUTH API
========================================================= */

export const auth = {
  register: (
    name: string,
    email: string,
    password: string,
  ) =>
    api<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }),

  login: (
    email: string,
    password: string,
  ) =>
    api<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  refresh: (refreshToken: string) =>
    api<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }),

  logout: (refreshToken: string) =>
    api<MessageResponse>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }),

  me: () =>
    api<AuthUser>("/users/me"),

  forgotPassword: (email: string) =>
    api<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }),

  resetPassword: (
    token: string,
    newPassword: string,
  ) =>
    api<MessageResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    }),

  verifyEmail: (token: string) =>
    api<VerificationResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({
        token,
      }),
    }),

  resendVerification: (email: string) =>
    api<VerificationResponse>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }),
}

/* =========================================================
   AI / TUTOR API
========================================================= */

export const ai = {
  chat: (
    message: string,
    session_id?: number,
    mode: TutorMode = "normal",
  ) =>
    api<ChatResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        session_id,
        mode,
      }),
    }),

  sessions: () =>
    api<ChatSession[]>("/ai/sessions"),

  session: (id: number) =>
    api<ChatSessionDetail>(`/ai/sessions/${id}`),

  deleteSession: (id: number) =>
    api<{ message: string }>(
      `/ai/sessions/${id}`,
      {
        method: "DELETE",
      },
    ),
}

/* =========================================================
   TEACHER / CMS API
========================================================= */

export const teacher = {
  getContent: () =>
    api<Content[]>("/teacher/content"),

  getContentById: (id: number) =>
    api<Content>(`/teacher/content/${id}`),

  createContent: (data: ContentCreate) =>
    api<Content>("/teacher/content", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateContent: (
    id: number,
    data: ContentUpdate,
  ) =>
    api<Content>(`/teacher/content/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteContent: (id: number) =>
    api<{ message: string }>(`/teacher/content/${id}`, {
      method: "DELETE",
    }),

  uploadPDF: (
    file: File,
    title: string,
    subject: string,
    description?: string,
    published = false,
  ) => {
    const formData = new FormData()

    formData.append("file", file)
    formData.append("title", title)
    formData.append("subject", subject)
    formData.append("published", String(published))

    if (description) {
      formData.append("description", description)
    }

    return api<Content>("/teacher/content/upload", {
      method: "POST",
      body: formData,
    })
  },

  getQuizzes: () =>
    api<QuizListItem[]>("/quizzes"),

  getQuiz: (id: number) =>
    api<Quiz>(`/quizzes/${id}`),

  createQuiz: (data: QuizCreate) =>
    api<Quiz>("/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateQuiz: (
    id: number,
    data: QuizUpdate,
  ) =>
    api<Quiz>(`/quizzes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteQuiz: (id: number) =>
    api<{ message: string }>(`/quizzes/${id}`, {
      method: "DELETE",
    }),
}
/* =========================================================
   QUIZ TYPES
========================================================= */

export type QuizQuestion = {
  id: number
  question: string
  question_type: string
  options: string[]
  marks: number
  order_index: number
}

export type Quiz = {
  id: number
  title: string
  description: string | null
  subject: string
  author_id: number
  published: boolean
  time_limit_minutes: number | null
  created_at: string
  updated_at: string | null
  questions: QuizQuestion[]
}

export type QuizListItem = {
  id: number
  title: string
  description: string | null
  subject: string
  author_id: number
  published: boolean
  time_limit_minutes: number | null
  question_count: number
}

export type QuizQuestionCreate = {
  question: string
  question_type?: string
  options?: string[]
  correct_answer: string
  marks?: number
}

export type QuizCreate = {
  title: string
  description?: string | null
  subject: string
  time_limit_minutes?: number | null
  published?: boolean
  questions: QuizQuestionCreate[]
}

export type QuizUpdate = Partial<QuizCreate>

export type QuizAnswerCreate = {
  question_id: number
  answer: string
}

export type QuizAttempt = {
  id: number
  quiz_id: number
  student_id: number
  score: number
  total_marks: number
  submitted_at: string
  answers: {
    id: number
    question_id: number
    answer: string
    is_correct: boolean
    marks_awarded: number
  }[]
}

/* =========================================================
   STUDENT QUIZ API
========================================================= */

export const quizzes = {
  getAll: () =>
    api<QuizListItem[]>("/quizzes"),

  getById: (id: number) =>
    api<Quiz>(`/quizzes/${id}`),

  submitAttempt: (
    id: number,
    answers: QuizAnswerCreate[],
  ) =>
    api<QuizAttempt>(`/quizzes/${id}/attempt`, {
      method: "POST",
      body: JSON.stringify({
        answers,
      }),
    }),

  getAttempts: (id: number) =>
    api<QuizAttempt[]>(`/quizzes/${id}/attempts`),
}

/* =========================================================
   ADMIN API
========================================================= */

export type AdminUser = {
  id: number
  name: string
  email: string
  role: Role
}

export type RoleUpdate = {
  role: Role
}

export const admin = {
  getUsers: () =>
    api<AdminUser[]>("/admin/users"),

  updateRole: (
    userId: number,
    role: Role,
  ) =>
    api<AdminUser>(
      `/admin/users/${userId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    ),

  deleteUser: (userId: number) =>
    api<{ message: string }>(
      `/admin/users/${userId}`,
      {
        method: "DELETE",
      },
    ),
}
