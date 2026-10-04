import { api } from "@/lib/api"

export type Course = {
  id: number
  title: string
  description?: string | null
  subject: string
  thumbnail_url?: string | null
  teacher_id: number
  published: boolean
  created_at?: string
  updated_at?: string
}

export type AdminCourse = Course & {
  teacher_name: string
  teacher_email: string
  enrolled_students: number
}

export type MessageContact = {
  id: number
  name: string
  email: string
  role: "STUDENT" | "TEACHER"
  course_id: number
  course_title: string
  avatar_url?: string | null
}

export type DirectMessage = {
  id: number
  sender_id: number
  recipient_id: number
  course_id: number | null
  body?: string | null
  link_url?: string | null
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  is_read: boolean
  created_at: string
}

export type Enrollment = {
  id: number
  course_id: number
  student_id: number
  enrolled_at?: string
  status: string
}

export type CourseMaterial = {
  id: number
  course_id: number
  title: string
  description?: string | null
  file_url?: string | null
  external_url?: string | null
  published: boolean
  uploaded_by: number
  created_at?: string
}

export type Assignment = {
  id: number
  course_id: number
  title: string
  instructions?: string | null
  due_date?: string | null
  max_marks: number
  file_url?: string | null
  external_url?: string | null
  published: boolean
  created_by: number
  created_at?: string
}

export type AssignmentSubmission = {
  id: number
  assignment_id: number
  student_id: number
  file_url?: string | null
  external_url?: string | null
  submitted_at: string
  marks?: number | null
  feedback?: string | null
  status: string
}

export type CourseStudent = {
  enrollment_id: number
  student_id: number
  name: string
  email: string
  status: string
  enrolled_at: string
}

export type ScheduleEvent = {
  id: number
  course_id: number
  title: string
  description?: string | null
  start_time: string
  end_time: string
  location?: string | null
  meeting_url?: string | null
  created_by: number
  created_at?: string
}

export type AdminScheduleEvent = {
  id: number
  title: string
  description?: string | null
  start_time: string
  end_time: string
  location?: string | null
  meeting_url?: string | null
  created_by: number
  created_at?: string
}

export type Notification = {
  id: number
  recipient_id: number
  type: string
  title: string
  message: string
  course_id?: number | null
  assignment_id?: number | null
  quiz_id?: number | null
  schedule_event_id?: number | null
  is_read: boolean
  created_at: string
}

export const courses = {
  browse: () =>
    api<Course[]>("/courses"),

  mine: () =>
    api<Course[]>("/courses/mine"),

  adminOverview: () =>
    api<AdminCourse[]>("/courses/admin/overview"),

  my: () =>
    api<Course[]>("/courses/my"),

  get: (id: number) =>
    api<Course>(`/courses/${id}`),

  teacher: (id: number) =>
    api<{ id: number; name: string; email: string; avatar_url?: string | null; bio?: string | null }>(`/courses/${id}/teacher`),

  create: (data: {
    title: string
    description?: string
    subject: string
    thumbnail_url?: string
    published?: boolean
  }) =>
    api<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: {
      title?: string
      description?: string
      subject?: string
      thumbnail_url?: string
      published?: boolean
    },
  ) =>
    api<Course>(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api<{ message: string }>(`/courses/${id}`, {
      method: "DELETE",
    }),

  publish: (id: number) =>
    api<Course>(`/courses/${id}/publish`, {
      method: "POST",
    }),

  enroll: (id: number) =>
    api<Enrollment>(`/courses/${id}/enroll`, {
      method: "POST",
    }),


  students: (courseId: number) =>
    api<CourseStudent[]>(`/courses/${courseId}/students`),

  removeStudent: (courseId: number, studentId: number) =>
    api<{ message: string }>(
      `/courses/${courseId}/students/${studentId}`,
      {
        method: "DELETE",
      },
    ),
}
export const materials = {
  list: (courseId: number) =>
    api<CourseMaterial[]>(`/courses/${courseId}/materials`),

  upload: (
    courseId: number,
    file: File,
    title?: string,
    description?: string,
    published = true,
  ) => {
    const form = new FormData()
    form.append("file", file)
    if (title) form.append("title", title)
    if (description) form.append("description", description)
    form.append("published", String(published))
    return api<CourseMaterial>(`/courses/${courseId}/materials/upload`, {
      method: "POST",
      body: form,
    })
  },

  create: (
    courseId: number,
    data: {
      title: string
      description?: string
      file_url?: string
      external_url?: string
      published?: boolean
    },
  ) =>
    api<CourseMaterial>(`/courses/${courseId}/materials`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    courseId: number,
    materialId: number,
    data: {
      title?: string
      description?: string
      file_url?: string
      external_url?: string
      published?: boolean
    },
  ) =>
    api<CourseMaterial>(
      `/courses/${courseId}/materials/${materialId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  delete: (courseId: number, materialId: number) =>
    api<{ message: string }>(
      `/courses/${courseId}/materials/${materialId}`,
      { method: "DELETE" },
    ),
}

export function courseMaterialFileUrl(courseId: number, materialId: number, download = false) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  return base + "/courses/" + courseId + "/materials/" + materialId + "/file" + (download ? "?download=true" : "")
}

export function assignmentFileUrl(assignmentId: number, download = false) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  return base + "/assignments/" + assignmentId + "/file" + (download ? "?download=true" : "")
}

export const assignments = {
  list: (courseId: number) =>
    api<Assignment[]>(`/courses/${courseId}/assignments`),

  create: (
    courseId: number,
    data: {
      title: string
      instructions?: string
      due_date?: string
      max_marks?: number
      file_url?: string
      external_url?: string
      published?: boolean
    },
  ) =>
    api<Assignment>(`/courses/${courseId}/assignments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  upload: (courseId: number, file: File, data: { title: string; instructions?: string; due_date?: string; max_marks?: number; published?: boolean }) => {
    const form = new FormData()
    form.append("file", file)
    form.append("title", data.title)
    if (data.instructions) form.append("instructions", data.instructions)
    if (data.due_date) form.append("due_date", data.due_date)
    form.append("max_marks", String(data.max_marks ?? 100))
    form.append("published", String(data.published ?? true))
    return api<Assignment>(`/courses/${courseId}/assignments/upload`, { method: "POST", body: form })
  },

  submit: (
    assignmentId: number,
    data: {
      file_url?: string
      external_url?: string
    },
  ) =>
    api<AssignmentSubmission>(
      `/assignments/${assignmentId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  submitFile: (assignmentId: number, file: File, externalUrl?: string) => {
    const formData = new FormData()
    formData.append("file", file)
    if (externalUrl?.trim()) formData.append("external_url", externalUrl.trim())
    return api<AssignmentSubmission>(
      `/assignments/${assignmentId}/submit-file`,
      { method: "POST", body: formData },
    )
  },

  getSubmission: (assignmentId: number) =>
    api<AssignmentSubmission | null>(
      `/assignments/${assignmentId}/submission`,
    ),

  getSubmissions: (assignmentId: number) =>
    api<AssignmentSubmission[]>(
      `/assignments/${assignmentId}/submissions`,
    ),

  update: (
    courseId: number,
    assignmentId: number,
    data: {
      title?: string
      instructions?: string
      due_date?: string
      max_marks?: number
      file_url?: string
      external_url?: string
      published?: boolean
    },
  ) =>
    api<Assignment>(
      `/courses/${courseId}/assignments/${assignmentId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  delete: (courseId: number, assignmentId: number) =>
    api<{ message: string }>(
      `/courses/${courseId}/assignments/${assignmentId}`,
      {
        method: "DELETE",
      },
    ),

  grade: (
    assignmentId: number,
    submissionId: number,
    marks: number,
    feedback?: string,
  ) =>
    api<AssignmentSubmission>(
      `/assignments/${assignmentId}/submissions/${submissionId}/grade?marks=${marks}${
        feedback ? `&feedback=${encodeURIComponent(feedback)}` : ""
      }`,
      {
        method: "PUT",
      },
    ),
}

export const schedule = {
  list: (courseId: number) =>
    api<ScheduleEvent[]>(`/courses/${courseId}/schedule`),

  create: (
    courseId: number,
    data: {
      title: string
      description?: string
      start_time: string
      end_time: string
      location?: string
      meeting_url?: string
    },
  ) =>
    api<ScheduleEvent>(`/courses/${courseId}/schedule`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    courseId: number,
    eventId: number,
    data: {
      title: string
      description?: string
      start_time: string
      end_time: string
      location?: string
      meeting_url?: string
    },
  ) =>
    api<ScheduleEvent>(
      `/courses/${courseId}/schedule/${eventId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  completions: (courseId: number) =>
    api<{ event_id: number; completed_at: string }[]>(`/courses/${courseId}/schedule/completions`),

  done: (courseId: number, eventId: number) =>
    api<{ event_id: number; completed_at: string }>(`/courses/${courseId}/schedule/${eventId}/done`, { method: "POST" }),

  delete: (courseId: number, eventId: number) =>
    api<{ message: string }>(
      `/courses/${courseId}/schedule/${eventId}`,
      {
        method: "DELETE",
      },
    ),
}

export const adminSchedule = {
  list: () => api<AdminScheduleEvent[]>("/admin/schedule"),
  create: (data: { title: string; description?: string; start_time: string; end_time: string; location?: string; meeting_url?: string }) => api<AdminScheduleEvent>("/admin/schedule", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { title?: string; description?: string; start_time?: string; end_time?: string; location?: string; meeting_url?: string }) => api<AdminScheduleEvent>("/admin/schedule/" + id, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => api<{ message: string }>("/admin/schedule/" + id, { method: "DELETE" }),
}

export const notifications = {
  list: () =>
    api<Notification[]>("/notifications"),

  unreadCount: () =>
    api<{ unread_count: number }>("/notifications/unread-count"),

  markRead: (id: number) =>
    api<{ id: number; is_read: boolean }>(
      `/notifications/${id}/read`,
      { method: "PATCH" },
    ),

  markAllRead: () =>
    api<{ message: string }>("/notifications/read-all", {
      method: "PATCH",
    }),

  announcement: (data: {
    title: string
    message: string
  }) =>
    api<{
      message: string
      recipients: number
    }>("/notifications/announcement", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}


export const messages = {
  contacts: () => api<MessageContact[]>("/messages/contacts"),
  list: (userId: number) => api<DirectMessage[]>(`/messages/${userId}`),
  send: (userId: number, data: { body?: string; link_url?: string; course_id?: number; file?: File }) => {
    const form = new FormData()
    if (data.body?.trim()) form.append("body", data.body.trim())
    if (data.link_url?.trim()) form.append("link_url", data.link_url.trim())
    if (data.course_id) form.append("course_id", String(data.course_id))
    if (data.file) form.append("file", data.file)
    return api<DirectMessage>(`/messages/${userId}`, { method: "POST", body: form })
  },
}

export function messageFileUrl(fileUrl: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
  return fileUrl.startsWith("http") ? fileUrl : base.replace("/api/v1", "") + fileUrl
}
