import { api } from "@/lib/api"

export type Course = {
  id: number
  title: string
  description?: string | null
  subject: string
  teacher_id: number
  published: boolean
  created_at?: string
  updated_at?: string
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

  my: () =>
    api<Course[]>("/courses/my"),

  get: (id: number) =>
    api<Course>(`/courses/${id}`),

  create: (data: {
    title: string
    description?: string
    subject: string
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

  delete: (courseId: number, eventId: number) =>
    api<{ message: string }>(
      `/courses/${courseId}/schedule/${eventId}`,
      {
        method: "DELETE",
      },
    ),
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
