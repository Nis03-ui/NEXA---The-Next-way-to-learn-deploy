import { clearAuth, getRefreshToken, getToken, setAuth } from "@/lib/auth/storage"

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nexa-the-next-way-to-learn-deploy-2.onrender.com/api/v1"

/* =========================================================
   TYPES
========================================================= */

export type ApiErrorDetail =
  | string
  | Array<{
      type?: string
      loc?: unknown[]
      msg?: string
      input?: unknown
    }>

export type ApiError = {
  detail?: ApiErrorDetail
  message?: string
}

export type Role = "ADMIN" | "TEACHER" | "STUDENT"

export type User = {
  id: number
  name: string
  email: string
  role: Role
  avatar_url?: string | null
  bio?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  twitter_url?: string | null
}

export type AuthUser = User

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type: "bearer"
  user: AuthUser
}

export type RegisterData = {
  name: string
  email: string
  password: string
  role: "STUDENT" | "TEACHER"
}

export type Content = {
  id: number
  title: string
  description: string | null
  body: string
  subject: string
  author_id: number
  published: boolean
  created_at: string
  updated_at: string
}

export type ContentCreate = {
  title: string
  description?: string
  body: string
  subject: string
  published?: boolean
}

export type ContentUpdate = {
  title?: string
  description?: string
  body?: string
  subject?: string
  published?: boolean
}

export type ChatSession = AISession
export type ChatMessage = AIMessage
export type TutorMode = "normal" | "explain" | "study" | "code" | "quiz"

export type QuizAttempt = QuizAttemptResponse

export type QuizQuestionCreate = QuizCreateQuestion
export type AISource = {
  source_type:
    | "course_content"
    | "student_document"

  content_id?: number | null
  document_id?: number | null

  title: string
  subject?: string | null
  filename?: string | null

  chunk_index: number
  distance: number
}
export type AIMessage = {
  role: "user" | "assistant"
  content: string
}

export type AISession = {
  id: number
  title?: string | null
  created_at: string
  updated_at: string
}

export type AIChatResponse = {
  answer: string
  session_id?: number
  sources?: AISource[]
}

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
  course_id: number | null
  author_id: number
  published: boolean
  time_limit_minutes: number | null
  question_count?: number
  created_at: string
  updated_at: string
  questions: QuizQuestion[]
}

export type QuizListItem = {
  id: number
  title: string
  description: string | null
  subject: string
  course_id: number | null
  author_id: number
  published: boolean
  time_limit_minutes: number | null
  question_count?: number
  created_at: string
  updated_at: string
}

export type QuizCreateQuestion = {
  question: string
  question_type?: string
  options: string[]
  correct_answer: string
  marks?: number
  order_index?: number
}

export type QuizCreate = {
  title: string
  description?: string
  subject: string
  course_id?: number | null
  published?: boolean
  time_limit_minutes?: number | null
  questions: QuizCreateQuestion[]
}

export type QuizUpdate = {
  title?: string
  description?: string
  subject?: string
  published?: boolean
  time_limit_minutes?: number | null
  questions?: QuizCreateQuestion[]
}

export type QuizAnswer = {
  question_id: number
  answer: string
}

export type QuizAttemptResponse = {
  id: number
  quiz_id: number
  student_id: number
  score: number
  total_marks: number
  submitted_at: string
  answers: Array<{
    question_id: number
    answer: string
    is_correct: boolean
    marks_awarded: number
  }>
}

export type AdminAnnouncement = {
  id: number
  title: string
  message: string
  created_at: string
  recipients: number
}

export type AdminStats = {
  total_users: number
  total_students: number
  total_teachers: number
  total_admins: number
  total_content: number
  published_content: number
  total_courses: number
  total_quizzes: number
  chat_sessions?: number
  api_health?: string
}

/* =========================================================
   API ERROR PARSER
========================================================= */

function getErrorMessage(
  data: ApiError | null,
  fallback: string,
): string {
  if (!data) {
    return fallback
  }

  if (typeof data.detail === "string") {
    return data.detail
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          typeof item.msg === "string"
        ) {
          return item.msg
        }

        return String(item)
      })
      .join(", ")
  }

  if (typeof data.message === "string") {
    return data.message
  }

  return fallback
}

/* =========================================================
   GENERIC API CLIENT
========================================================= */

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (accessToken: string | null) => {
    const headers = new Headers(options.headers)

    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json")
    }

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`)
    }

    return fetch(`${API}${path}`, {
      ...options,
      headers,
    })
  }

  const parseResponse = async (response: Response): Promise<T> => {
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const error = data as ApiError | null
      throw new Error(
        getErrorMessage(error, `Request failed with status ${response.status}`),
      )
    }

    return data as T
  }

  let response = await makeRequest(getToken())

  // Recover automatically from an expired access token using the stored refresh token.
  // Never refresh the refresh endpoint itself.
  if (response.status === 401 && path !== "/auth/refresh" && typeof window !== "undefined") {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      try {
        const refreshHeaders = new Headers({ "Content-Type": "application/json" })
        const refreshed = await fetch(`${API}/auth/refresh`, {
          method: "POST",
          headers: refreshHeaders,
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (refreshed.ok) {
          const tokens = (await refreshed.json()) as LoginResponse
          setAuth(tokens.access_token, tokens.refresh_token, tokens.user)
          response = await makeRequest(tokens.access_token)
        } else {
          clearAuth()
        }
      } catch {
        clearAuth()
      }
    }
  }

  return parseResponse(response)
}

/* =========================================================
   AUTH
========================================================= */

export const auth = {
  register: (data: RegisterData) =>
    api<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    api<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  me: () =>
    api<User>("/auth/me"),

  refresh: (refreshToken: string) =>
    api<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }),

  logout: (refreshToken: string) =>
    api<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }),

  forgotPassword: (email: string) =>
    api<{ message: string; reset_token?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    }),

  resetPassword: (
    token: string,
    newPassword: string,
  ) =>
    api<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    }),

  verifyEmail: (token: string) =>
    api<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({
        token,
      }),
    }),

  resendVerification: (email: string) =>
    api<{ message: string }>(
      "/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    ),
}

/* =========================================================
   USERS
========================================================= */

export type ProfileUpdateRequest = {
  name?: string
  email?: string
  avatar_url?: string
  bio?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  twitter_url?: string
}

export const users = {
  me: () =>
    api<User>("/users/me"),

  updateMe: (data: ProfileUpdateRequest) =>
    api<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/* =========================================================
   AI
========================================================= */

export const ai = {
  chat: (
    message: string,
    sessionId?: number,
    mode: TutorMode = "normal",
  ) =>
    api<AIChatResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        session_id: sessionId,
        mode,
      }),
    }),

  getSessions: () =>
    api<AISession[]>("/ai/sessions"),

  sessions: () =>
    api<AISession[]>("/ai/sessions"),

  session: (id: number) =>
    api<{
      id: number
      title?: string | null
      messages: AIMessage[]
      created_at: string
      updated_at: string
    }>(`/ai/sessions/${id}`),

  getSession: (id: number) =>
    api<{
      id: number
      title?: string | null
      messages: AIMessage[]
      created_at: string
      updated_at: string
    }>(`/ai/sessions/${id}`),

  deleteSession: (id: number) =>
    api<{ message: string }>(
      `/ai/sessions/${id}`,
      {
        method: "DELETE",
      },
    ),

  uploadDocument: (file: File) => {
    const formData = new FormData()

    formData.append("file", file)

    return api<{
      id: number
      filename?: string
      title?: string
      pages?: number
      message?: string
    }>("/ai/documents/upload", {
      method: "POST",
      body: formData,
    })
  },
}

/* =========================================================
   TEACHER
========================================================= */

export const teacher = {
  getContent: () =>
    api<Content[]>("/teacher/content"),

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
    api<{ message: string }>(
      `/teacher/content/${id}`,
      {
        method: "DELETE",
      },
    ),

  getQuizzes: () =>
    api<QuizListItem[]>("/quizzes"),

  getQuiz: (id: number) =>
    api<Quiz>(`/quizzes/${id}`),

  createQuiz: (data: QuizCreate) =>
    api<Quiz>("/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateQuiz: (id: number, data: QuizUpdate) =>
    api<Quiz>(`/quizzes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteQuiz: (id: number) =>
    api<{ message: string }>(`/quizzes/${id}`, {
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
    formData.append(
      "published",
      String(published),
    )

    if (description) {
      formData.append(
        "description",
        description,
      )
    }

    return api<Content>(
      "/teacher/content/upload",
      {
        method: "POST",
        body: formData,
      },
    )
  },
}

/* =========================================================
   QUIZZES
========================================================= */

export const quizzes = {
  getAll: () =>
    api<QuizListItem[]>("/quizzes"),

  get: (id: number) =>
    api<Quiz>(`/quizzes/${id}`),

  getById: (id: number) =>
    api<Quiz>(`/quizzes/${id}`),

  getQuiz: (id: number) =>
    api<Quiz>(`/quizzes/${id}`),

  create: (data: QuizCreate) =>
    api<Quiz>("/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createQuiz: (data: QuizCreate) =>
    api<Quiz>("/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: QuizUpdate,
  ) =>
    api<Quiz>(`/quizzes/${id}`, {
      method: "PATCH",
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

  delete: (id: number) =>
    api<{ message: string }>(
      `/quizzes/${id}`,
      {
        method: "DELETE",
      },
    ),

  deleteQuiz: (id: number) =>
    api<{ message: string }>(
      `/quizzes/${id}`,
      {
        method: "DELETE",
      },
    ),

  submitAttempt: (
    id: number,
    answers: QuizAnswer[],
  ) =>
    api<QuizAttemptResponse>(
      `/quizzes/${id}/attempt`,
      {
        method: "POST",
        body: JSON.stringify({
          answers,
        }),
      },
    ),

  submit: (
    id: number,
    answers: QuizAnswer[],
  ) =>
    api<QuizAttemptResponse>(
      `/quizzes/${id}/attempt`,
      {
        method: "POST",
        body: JSON.stringify({
          answers,
        }),
      },
    ),

  getAttempts: (id: number) =>
    api<QuizAttemptResponse[]>(
      `/quizzes/${id}/attempts`,
    ),

  getQuizAttempts: (id: number) =>
    api<QuizAttemptResponse[]>(
      `/quizzes/${id}/attempts`,
    ),
}

/* =========================================================
   ADMIN
========================================================= */

export const admin = {
  getStats: () =>
    api<AdminStats>("/admin/stats"),

  getUsers: () =>
    api<User[]>("/admin/users"),

  getAnnouncements: () =>
    api<AdminAnnouncement[]>("/admin/announcements"),

  updateUserRole: (
    userId: number,
    role: "ADMIN" | "TEACHER" | "STUDENT",
  ) =>
    api<User>(
      `/admin/users/${userId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({
          role,
        }),
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