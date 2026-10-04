"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
  Upload,
  MessageCircle,
} from "lucide-react"

import AppShell from "@/components/layout/AppShell"
import { assignments, courses, materials, schedule } from "@/lib/lms"
import { quizzes } from "@/lib/api"
import type {
  Assignment,
  AssignmentSubmission,
  Course,
  CourseMaterial,
  ScheduleEvent,
  CourseStudent,
} from "@/lib/lms"
import type { Quiz, QuizListItem, QuizAttemptResponse, QuizCreateQuestion } from "@/lib/api"

type Tab =
  | "overview"
  | "materials"
  | "assignments"
  | "quizzes"
  | "schedule"
  | "students"

const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "materials", label: "Materials", icon: FileText },
  { id: "assignments", label: "Assignments", icon: GraduationCap },
  { id: "quizzes", label: "Quizzes", icon: Check },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "students", label: "Students", icon: Users },
]

export default function TeacherCoursePage() {
  const params = useParams()
  const courseId = Number(params.id)

  const [course, setCourse] = useState<Course | null>(null)
  const [materialsList, setMaterialsList] = useState<CourseMaterial[]>([])
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null)
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [materialTitle, setMaterialTitle] = useState("")
  const [materialDescription, setMaterialDescription] = useState("")
  const [materialFileUrl, setMaterialFileUrl] = useState("")
  const [materialExternalUrl, setMaterialExternalUrl] = useState("")
  const [materialPublished, setMaterialPublished] = useState(true)
  const [materialFile, setMaterialFile] = useState<File | null>(null)

  const [assignmentList, setAssignmentList] = useState<Assignment[]>([])
  const [quizList, setQuizList] = useState<QuizListItem[]>([])

  const [scheduleList, setScheduleList] = useState<ScheduleEvent[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEvent | null>(null)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const [scheduleTitle, setScheduleTitle] = useState("")
  const [scheduleDescription, setScheduleDescription] = useState("")
  const [scheduleStart, setScheduleStart] = useState("")
  const [scheduleEnd, setScheduleEnd] = useState("")
  const [scheduleLocation, setScheduleLocation] = useState("")
  const [scheduleMeetingUrl, setScheduleMeetingUrl] = useState("")

  const [studentList, setStudentList] = useState<CourseStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [removingStudent, setRemovingStudent] = useState<number | null>(null)

  const searchParams = useSearchParams()

  const initialTab = searchParams.get("tab")
  const validInitialTab: Tab =
    initialTab === "overview" ||
    initialTab === "materials" ||
    initialTab === "assignments" ||
    initialTab === "quizzes" ||
    initialTab === "schedule" ||
    initialTab === "students"
      ? initialTab
      : "overview"

  const [activeTab, setActiveTab] = useState<Tab>(validInitialTab)

  useEffect(() => {
    const requestedTab = searchParams.get("tab")

    if (
      requestedTab === "overview" ||
      requestedTab === "materials" ||
      requestedTab === "assignments" ||
      requestedTab === "quizzes" ||
      requestedTab === "schedule" ||
      requestedTab === "students"
    ) {
      setActiveTab(requestedTab)
    }
  }, [searchParams])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [savingAssignment, setSavingAssignment] = useState(false)

  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [maxMarks, setMaxMarks] = useState("100")
  const [externalUrl, setExternalUrl] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [published, setPublished] = useState(true)

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const [gradingId, setGradingId] = useState<number | null>(null)
  const [gradeMarks, setGradeMarks] = useState<Record<number, string>>({})
  const [gradeFeedback, setGradeFeedback] = useState<Record<number, string>>({})

  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [savingQuiz, setSavingQuiz] = useState(false)

  const [quizTitle, setQuizTitle] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [quizSubject, setQuizSubject] = useState("")
  const [quizTimeLimit, setQuizTimeLimit] = useState("")
  const [quizPublished, setQuizPublished] = useState(true)

  const [quizQuestions, setQuizQuestions] = useState<QuizCreateQuestion[]>([
    {
      question: "",
      question_type: "MCQ",
      options: ["", "", "", ""],
      correct_answer: "",
      marks: 1,
      order_index: 0,
    },
  ])

  const [selectedQuiz, setSelectedQuiz] = useState<QuizListItem | null>(null)
  const [attempts, setAttempts] = useState<QuizAttemptResponse[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)

  const loadCourse = async () => {
    if (!courseId || Number.isNaN(courseId)) return

    try {
      setLoading(true)
      setError("")
      const data = await courses.get(courseId)
      setCourse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course.")
    } finally {
      setLoading(false)
    }
  }

  const loadMaterials = async () => {
    try {
      setError("")
      const data = await materials.list(courseId)
      setMaterialsList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials.")
    }
  }

  const loadAssignments = async () => {
    try {
      setError("")
      const data = await assignments.list(courseId)
      setAssignmentList(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load assignments.",
      )
    }
  }

  const loadQuizzes = async () => {
    try {
      setError("")
      const allQuizzes = await quizzes.getAll()
      setQuizList(
        allQuizzes.filter((quiz) => quiz.course_id === courseId),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes.")
    }
  }

  const loadSchedule = async () => {
    try {
      setError("")
      const data = await schedule.list(courseId)
      setScheduleList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule.")
    }
  }

  const loadStudents = async () => {
    try {
      setLoadingStudents(true)
      setError("")
      const data = await courses.students(courseId)
      setStudentList(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load enrolled students.",
      )
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadCourse()
  }, [courseId])

  useEffect(() => {
    if (!courseId || Number.isNaN(courseId)) return

    if (activeTab === "materials") {
      loadMaterials()
    } else if (activeTab === "assignments") {
      loadAssignments()
    } else if (activeTab === "quizzes") {
      loadQuizzes()
    } else if (activeTab === "schedule") {
      loadSchedule()
    } else if (activeTab === "students") {
      loadStudents()
    }
  }, [activeTab, courseId])

  const removeStudent = async (student: CourseStudent) => {
    if (!window.confirm(`Remove ${student.name} from this course?`)) {
      return
    }

    try {
      setRemovingStudent(student.student_id)
      setError("")

      await courses.removeStudent(courseId, student.student_id)

      setStudentList((current) =>
        current.filter(
          (item) => item.student_id !== student.student_id,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove student.",
      )
    } finally {
      setRemovingStudent(null)
    }
  }

  const resetQuizForm = () => {
    setQuizTitle("")
    setQuizDescription("")
    setQuizSubject(course?.subject || "")
    setQuizTimeLimit("")
    setQuizPublished(true)
    setQuizQuestions([
      {
        question: "",
        question_type: "MCQ",
        options: ["", "", "", ""],
        correct_answer: "",
        marks: 1,
        order_index: 0,
      },
    ])
    setEditingQuiz(null)
    setShowQuizForm(false)
  }

  const resetMaterialForm = () => {
    setMaterialTitle("")
    setMaterialDescription("")
    setMaterialFileUrl("")
    setMaterialExternalUrl("")
    setMaterialPublished(true)
    setMaterialFile(null)
    setEditingMaterial(null)
  }

  const openCreateMaterial = () => {
    resetMaterialForm()
    setShowMaterialForm(true)
  }

  const openEditMaterial = (material: CourseMaterial) => {
    setEditingMaterial(material)
    setMaterialTitle(material.title)
    setMaterialDescription(material.description || "")
    setMaterialFileUrl(material.file_url || "")
    setMaterialExternalUrl(material.external_url || "")
    setMaterialPublished(material.published)
    setMaterialFile(null)
    setShowMaterialForm(true)
  }

  const saveMaterial = async (event: FormEvent) => {
    event.preventDefault()

    if (!materialTitle.trim()) {
      setError("Material title is required.")
      return
    }

    if (!materialFileUrl.trim() && !materialExternalUrl.trim() && !materialFile) {
      setError("Choose a local file or add a file/external URL.")
      return
    }

    try {
      setSavingMaterial(true)
      setError("")

      if (materialFile && !editingMaterial) {
        const created = await materials.upload(
          courseId,
          materialFile,
          materialTitle.trim() || undefined,
          materialDescription.trim() || undefined,
          materialPublished,
        )
        setMaterialsList((current) => [created, ...current])
      } else {
        const payload = {
          title: materialTitle.trim(),
          description: materialDescription.trim() || undefined,
          file_url: materialFileUrl.trim() || undefined,
          external_url: materialExternalUrl.trim() || undefined,
          published: materialPublished,
        }

        if (editingMaterial) {
          const updated = await materials.update(courseId, editingMaterial.id, payload)
          setMaterialsList((current) =>
            current.map((item) => item.id === updated.id ? updated : item),
          )
        } else {
          const created = await materials.create(courseId, payload)
          setMaterialsList((current) => [created, ...current])
        }
      }

      setShowMaterialForm(false)
      resetMaterialForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save material.",
      )
    } finally {
      setSavingMaterial(false)
    }
  }

  const deleteMaterial = async (material: CourseMaterial) => {
    if (
      !window.confirm(
        `Delete "${material.title}" from this course?`,
      )
    ) {
      return
    }

    try {
      setError("")

      await materials.delete(courseId, material.id)

      setMaterialsList((current) =>
        current.filter((item) => item.id !== material.id),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete material.",
      )
    }
  }

  const toggleMaterialPublish = async (material: CourseMaterial) => {
    try {
      setError("")

      const updated = await materials.update(
        courseId,
        material.id,
        {
          published: !material.published,
        },
      )

      setMaterialsList((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update material.",
      )
    }
  }

  const openCreateQuiz = () => {
    resetQuizForm()
    setQuizSubject(course?.subject || "")
    setShowQuizForm(true)
  }

  const openEditQuiz = async (quiz: QuizListItem) => {
    try {
      setError("")
      const fullQuiz = await quizzes.get(quiz.id)

      setEditingQuiz(fullQuiz)
      setQuizTitle(fullQuiz.title)
      setQuizDescription(fullQuiz.description || "")
      setQuizSubject(fullQuiz.subject)
      setQuizTimeLimit(
        fullQuiz.time_limit_minutes !== null &&
        fullQuiz.time_limit_minutes !== undefined
          ? String(fullQuiz.time_limit_minutes)
          : "",
      )
      setQuizPublished(fullQuiz.published)

      setQuizQuestions(
        fullQuiz.questions.map((question, index) => ({
          question: question.question,
          question_type: question.question_type,
          options: question.options || ["", "", "", ""],
          correct_answer: question.options?.[0] || "",
          marks: question.marks,
          order_index: index,
        })),
      )

      setShowQuizForm(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load quiz.",
      )
    }
  }

  const updateQuestion = (
    index: number,
    patch: Partial<QuizCreateQuestion>,
  ) => {
    setQuizQuestions((current) =>
      current.map((question, i) =>
        i === index ? { ...question, ...patch } : question,
      ),
    )
  }

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    setQuizQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question

        const options = [...question.options]
        options[optionIndex] = value

        return {
          ...question,
          options,
        }
      }),
    )
  }

  const addQuestion = () => {
    setQuizQuestions((current) => [
      ...current,
      {
        question: "",
        question_type: "MCQ",
        options: ["", "", "", ""],
        correct_answer: "",
        marks: 1,
        order_index: current.length,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    if (quizQuestions.length === 1) return

    setQuizQuestions((current) =>
      current
        .filter((_, i) => i !== index)
        .map((question, i) => ({
          ...question,
          order_index: i,
        })),
    )
  }

  const saveQuiz = async (event: FormEvent) => {
    event.preventDefault()

    if (!quizTitle.trim()) {
      setError("Quiz title is required.")
      return
    }

    if (!quizSubject.trim()) {
      setError("Quiz subject is required.")
      return
    }

    const cleanedQuestions = quizQuestions.map((question, index) => ({
      ...question,
      question: question.question.trim(),
      options: question.options
        .map((option) => option.trim())
        .filter(Boolean),
      correct_answer: question.correct_answer.trim(),
      marks: Number(question.marks) || 1,
      order_index: index,
    }))

    if (cleanedQuestions.some((question) => !question.question)) {
      setError("Every question needs question text.")
      return
    }

    if (
      cleanedQuestions.some(
        (question) =>
          question.options.length < 2 ||
          !question.correct_answer ||
          !question.options.includes(question.correct_answer),
      )
    ) {
      setError(
        "Every question needs at least two options and a correct answer matching one option.",
      )
      return
    }

    try {
      setSavingQuiz(true)
      setError("")

      const timeLimit = quizTimeLimit
        ? Number(quizTimeLimit)
        : null

      if (
        timeLimit !== null &&
        (!Number.isFinite(timeLimit) || timeLimit <= 0)
      ) {
        setError("Time limit must be greater than zero.")
        return
      }

      const payload = {
        title: quizTitle.trim(),
        description: quizDescription.trim() || undefined,
        subject: quizSubject.trim(),
        course_id: editingQuiz?.course_id ?? courseId,
        published: quizPublished,
        time_limit_minutes: timeLimit,
        questions: cleanedQuestions,
      }

      if (editingQuiz) {
        const updated = await quizzes.update(
          editingQuiz.id,
          payload,
        )

        setQuizList((current) =>
          current.map((quiz) =>
            quiz.id === updated.id ? updated : quiz,
          ),
        )
      } else {
        const created = await quizzes.create(payload)
        setQuizList((current) => [created, ...current])
      }

      resetQuizForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz.")
    } finally {
      setSavingQuiz(false)
    }
  }

  const deleteQuiz = async (quiz: QuizListItem) => {
    if (!window.confirm(`Delete "${quiz.title}"?`)) return

    try {
      setError("")
      await quizzes.delete(quiz.id)

      setQuizList((current) =>
        current.filter((item) => item.id !== quiz.id),
      )

      if (selectedQuiz?.id === quiz.id) {
        setSelectedQuiz(null)
        setAttempts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz.")
    }
  }

  const toggleQuizPublish = async (quiz: QuizListItem) => {
    try {
      const updated = await quizzes.update(
        quiz.id,
        { published: !quiz.published },
      )

      setQuizList((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quiz.")
    }
  }

  const viewAttempts = async (quiz: QuizListItem) => {
    try {
      setSelectedQuiz(quiz)
      setLoadingAttempts(true)
      setError("")

      const data = await quizzes.getAttempts(quiz.id)
      setAttempts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attempts.")
    } finally {
      setLoadingAttempts(false)
    }
  }

  const resetScheduleForm = () => {
    setScheduleTitle("")
    setScheduleDescription("")
    setScheduleStart("")
    setScheduleEnd("")
    setScheduleLocation("")
    setScheduleMeetingUrl("")
    setEditingSchedule(null)
    setShowScheduleForm(false)
  }

  const openCreateSchedule = () => {
    resetScheduleForm()
    setShowScheduleForm(true)
  }

  const openEditSchedule = (event: ScheduleEvent) => {
    setEditingSchedule(event)
    setScheduleTitle(event.title)
    setScheduleDescription(event.description || "")
    setScheduleStart(
      event.start_time
        ? new Date(event.start_time).toISOString().slice(0, 16)
        : "",
    )
    setScheduleEnd(
      event.end_time
        ? new Date(event.end_time).toISOString().slice(0, 16)
        : "",
    )
    setScheduleLocation(event.location || "")
    setScheduleMeetingUrl(event.meeting_url || "")
    setShowScheduleForm(true)
  }

  const saveSchedule = async (event: FormEvent) => {
    event.preventDefault()

    if (!scheduleTitle.trim()) {
      setError("Event title is required.")
      return
    }

    if (!scheduleStart || !scheduleEnd) {
      setError("Start and end time are required.")
      return
    }

    const start = new Date(scheduleStart)
    const end = new Date(scheduleEnd)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Enter valid start and end times.")
      return
    }

    if (end <= start) {
      setError("End time must be after start time.")
      return
    }

    try {
      setSavingSchedule(true)
      setError("")

      const payload = {
        title: scheduleTitle.trim(),
        description: scheduleDescription.trim() || undefined,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: scheduleLocation.trim() || undefined,
        meeting_url: scheduleMeetingUrl.trim() || undefined,
      }

      if (editingSchedule) {
        const updated = await schedule.update(
          courseId,
          editingSchedule.id,
          payload,
        )

        setScheduleList((current) =>
          current.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        )
      } else {
        const created = await schedule.create(courseId, payload)
        setScheduleList((current) => [...current, created])
      }

      resetScheduleForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save schedule event.",
      )
    } finally {
      setSavingSchedule(false)
    }
  }

  const deleteSchedule = async (event: ScheduleEvent) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return

    try {
      setError("")
      await schedule.delete(courseId, event.id)

      setScheduleList((current) =>
        current.filter((item) => item.id !== event.id),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete schedule event.",
      )
    }
  }

  const resetAssignmentForm = () => {
    setTitle("")
    setInstructions("")
    setDueDate("")
    setMaxMarks("100")
    setExternalUrl("")
    setFileUrl("")
    setPublished(true)
    setEditingAssignment(null)
    setShowAssignmentForm(false)
  }

  const openCreate = () => {
    resetAssignmentForm()
    setShowAssignmentForm(true)
  }

  const openEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setTitle(assignment.title)
    setInstructions(assignment.instructions || "")
    setDueDate(
      assignment.due_date
        ? new Date(assignment.due_date).toISOString().slice(0, 16)
        : "",
    )
    setMaxMarks(String(assignment.max_marks ?? 100))
    setExternalUrl(assignment.external_url || "")
    setFileUrl(assignment.file_url || "")
    setPublished(assignment.published)
    setShowAssignmentForm(true)
  }

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      setError("Assignment title is required.")
      return
    }

    const marks = Number(maxMarks)

    if (!Number.isFinite(marks) || marks <= 0) {
      setError("Maximum marks must be greater than zero.")
      return
    }

    try {
      setSavingAssignment(true)
      setError("")

      const payload = {
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        due_date: dueDate
          ? new Date(dueDate).toISOString()
          : undefined,
        max_marks: marks,
        external_url: externalUrl.trim() || undefined,
        file_url: fileUrl.trim() || undefined,
        published,
      }

      if (editingAssignment) {
        const updated = await assignments.update(
          courseId,
          editingAssignment.id,
          payload,
        )

        setAssignmentList((current) =>
          current.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        )
      } else {
        const created = await assignments.create(courseId, payload)
        setAssignmentList((current) => [created, ...current])
      }

      resetAssignmentForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment.")
    } finally {
      setSavingAssignment(false)
    }
  }

  const deleteAssignment = async (assignment: Assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return

    try {
      setError("")
      await assignments.delete(courseId, assignment.id)

      setAssignmentList((current) =>
        current.filter((item) => item.id !== assignment.id),
      )

      if (selectedAssignment?.id === assignment.id) {
        setSelectedAssignment(null)
        setSubmissions([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment.")
    }
  }

  const togglePublish = async (assignment: Assignment) => {
    try {
      const updated = await assignments.update(
        courseId,
        assignment.id,
        { published: !assignment.published },
      )

      setAssignmentList((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment.")
    }
  }

  const viewSubmissions = async (assignment: Assignment) => {
    try {
      setSelectedAssignment(assignment)
      setLoadingSubmissions(true)
      setError("")

      const data = await assignments.getSubmissions(assignment.id)
      setSubmissions(data)

      const marks: Record<number, string> = {}
      const feedback: Record<number, string> = {}

      data.forEach((submission) => {
        marks[submission.id] =
          submission.marks !== null && submission.marks !== undefined
            ? String(submission.marks)
            : ""
        feedback[submission.id] = submission.feedback || ""
      })

      setGradeMarks(marks)
      setGradeFeedback(feedback)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions.")
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const gradeSubmission = async (submission: AssignmentSubmission) => {
    if (!selectedAssignment) return

    const marks = Number(gradeMarks[submission.id])

    if (!Number.isFinite(marks) || marks < 0) {
      setError("Enter a valid grade.")
      return
    }

    if (marks > selectedAssignment.max_marks) {
      setError(`Grade cannot exceed ${selectedAssignment.max_marks}.`)
      return
    }

    try {
      setGradingId(submission.id)
      setError("")

      const updated = await assignments.grade(
        selectedAssignment.id,
        submission.id,
        marks,
        gradeFeedback[submission.id]?.trim() || undefined,
      )

      setSubmissions((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grade submission.")
    } finally {
      setGradingId(null)
    }
  }

  const publishedCount = useMemo(
    () => assignmentList.filter((item) => item.published).length,
    [assignmentList],
  )

  if (loading) {
    return (
      <AppShell allowedRoles={["TEACHER", "ADMIN"]}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    )
  }

  if (!course) {
    return (
      <AppShell allowedRoles={["TEACHER", "ADMIN"]}>
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Course not found."}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell allowedRoles={["TEACHER", "ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/teacher"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {course.subject}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    course.published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {course.published ? "Published" : "Draft"}
                </span>
              </div>

              <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {course.title}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {course.description || "Manage your course content and students."}
              </p>
            </div>

            <Link
              href={`/courses/${course.id}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <BookOpen className="h-4 w-4" />
              Student View
            </Link>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
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

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div className="flex w-max min-w-full gap-1 p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === "overview" && (
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Materials"
              value={materialsList.length}
            />
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              label="Assignments"
              value={assignmentList.length}
            />
            <StatCard
              icon={<Check className="h-5 w-5" />}
              label="Published assignments"
              value={publishedCount}
            />
          </section>
        )}

        {activeTab === "materials" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Materials
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add PDFs, documents, videos, websites, and other learning resources.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateMaterial}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add material
              </button>
            </div>

            {materialsList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No materials yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first learning resource to this course.
                </p>

                <button
                  type="button"
                  onClick={openCreateMaterial}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add material
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {materialsList.map((material) => (
                  <article
                    key={material.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-bold text-slate-950">
                            {material.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              material.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {material.published ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {material.description || "No description provided."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {material.external_url && (
                            <a
                              href={material.external_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Open external resource
                            </a>
                          )}

                          {material.file_url && (
                            <a
                              href={material.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-10 items-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Open file
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => openEditMaterial(material)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleMaterialPublish(material)}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {material.published ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMaterial(material)}
                          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 sm:col-span-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "assignments" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Assignments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create coursework and review student submissions.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New assignment
              </button>
            </div>

            {assignmentList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No assignments yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first assignment for this course.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {assignmentList.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-bold text-slate-950">
                            {assignment.title}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              assignment.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {assignment.published ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {assignment.instructions || "No instructions provided."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                          <span>
                            Max marks: {assignment.max_marks}
                          </span>
                          {assignment.due_date && (
                            <span>
                              Due:{" "}
                              {new Date(
                                assignment.due_date,
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => viewSubmissions(assignment)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Users className="h-4 w-4" />
                          Submissions
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(assignment)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => togglePublish(assignment)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {assignment.published ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteAssignment(assignment)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "quizzes" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Quizzes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Build assessments, manage questions, and review attempts.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateQuiz}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                New quiz
              </button>
            </div>

            {quizList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Check className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No quizzes yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create an assessment for your students.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quizList.map((quiz) => (
                  <article
                    key={quiz.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-bold text-slate-950">
                            {quiz.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              quiz.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {quiz.published ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {quiz.description || "No description provided."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                          <span>
                            Questions: {quiz.question_count ?? 0}
                          </span>
                          <span>Subject: {quiz.subject}</span>
                          {quiz.time_limit_minutes && (
                            <span>
                              Time: {quiz.time_limit_minutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => viewAttempts(quiz)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Users className="h-4 w-4" />
                          Attempts
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditQuiz(quiz)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleQuizPublish(quiz)}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {quiz.published ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteQuiz(quiz)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "students" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Enrolled Students
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage students enrolled in this course.
                </p>
              </div>

              <div className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                <Users className="mr-2 h-4 w-4" />
                {studentList.length}{" "}
                {studentList.length === 1 ? "student" : "students"}
              </div>
            </div>

            {loadingStudents ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading students...
                </p>
              </div>
            ) : studentList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No students enrolled
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Students who enroll in this course will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {studentList.map((student) => (
                  <article
                    key={student.enrollment_id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                        {student.name.trim().charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-semibold text-slate-900">
                          {student.name}
                        </h3>

                        <p className="mt-0.5 break-all text-sm text-slate-500">
                          {student.email}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.status}
                          </span>

                          <span className="text-xs text-slate-500">
                            Joined{" "}
                            {new Date(
                              student.enrolled_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/messages?userId=${student.student_id}&courseId=${courseId}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message student
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeStudent(student)}
                        disabled={
                          removingStudent === student.student_id
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                      {removingStudent === student.student_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove student
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "schedule" && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Course Schedule
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create lectures, classes, meetings, and other course events.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateSchedule}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add event
              </button>
            </div>

            {scheduleList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No scheduled events
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first lecture, class, or meeting.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {[...scheduleList]
                  .sort(
                    (a, b) =>
                      new Date(a.start_time).getTime() -
                      new Date(b.start_time).getTime(),
                  )
                  .map((event) => (
                    <article
                      key={event.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-lg font-bold text-slate-950">
                              {event.title}
                            </h3>

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              Scheduled
                            </span>
                          </div>

                          {event.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {event.description}
                            </p>
                          )}

                          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <div className="flex items-start gap-2">
                              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span>
                                {new Date(event.start_time).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span>
                                Until {new Date(event.end_time).toLocaleString()}
                              </span>
                            </div>

                            {event.location && (
                              <div className="flex items-start gap-2">
                                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>

                          {event.meeting_url && (
                            <a
                              href={event.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Join meeting
                            </a>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => openEditSchedule(event)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSchedule(event)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>
        )}

        {showScheduleForm && (
          <Modal
            title={
              editingSchedule
                ? "Edit schedule event"
                : "Create schedule event"
            }
            onClose={resetScheduleForm}
          >
            <form onSubmit={saveSchedule} className="space-y-4">
              <Field label="Event title" required>
                <input
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="e.g. HTML & CSS Fundamentals Lecture"
                  className="input"
                  required
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the class or event..."
                  className="input resize-y"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start time" required>
                  <input
                    type="datetime-local"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="input"
                    required
                  />
                </Field>

                <Field label="End time" required>
                  <input
                    type="datetime-local"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="input"
                    required
                  />
                </Field>
              </div>

              <Field label="Location">
                <input
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="input"
                />
              </Field>

              <Field label="Meeting URL">
                <input
                  type="url"
                  value={scheduleMeetingUrl}
                  onChange={(e) => setScheduleMeetingUrl(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
              </Field>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetScheduleForm}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingSchedule ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingSchedule ? "Save changes" : "Create event"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showQuizForm && (
          <Modal
            title={editingQuiz ? "Edit quiz" : "Create quiz"}
            onClose={resetQuizForm}
          >
            <form onSubmit={saveQuiz} className="space-y-5">
              <Field label="Quiz title" required>
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. HTML & CSS Fundamentals Quiz"
                  className="input"
                  required
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what this quiz assesses..."
                  className="input resize-y"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Subject" required>
                  <input
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value)}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Time limit (minutes)">
                  <input
                    type="number"
                    min="1"
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(e.target.value)}
                    placeholder="15"
                    className="input"
                  />
                </Field>
              </div>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3">
                <input
                  type="checkbox"
                  checked={quizPublished}
                  onChange={(e) => setQuizPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Publish quiz immediately
                </span>
              </label>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Questions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add MCQ questions and select the correct answer.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add question
                  </button>
                </div>

                {quizQuestions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-800">
                        Question {questionIndex + 1}
                      </span>

                      {quizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(questionIndex, {
                            question: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="Write the question..."
                        className="input resize-y"
                        required
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <input
                            key={optionIndex}
                            value={option}
                            onChange={(e) =>
                              updateQuestionOption(
                                questionIndex,
                                optionIndex,
                                e.target.value,
                              )
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                            className="input"
                            required
                          />
                        ))}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Correct answer">
                          <select
                            value={question.correct_answer}
                            onChange={(e) =>
                              updateQuestion(questionIndex, {
                                correct_answer: e.target.value,
                              })
                            }
                            className="input"
                            required
                          >
                            <option value="">Select correct answer</option>
                            {question.options
                              .filter(Boolean)
                              .map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                          </select>
                        </Field>

                        <Field label="Marks">
                          <input
                            type="number"
                            min="1"
                            value={question.marks ?? 1}
                            onChange={(e) =>
                              updateQuestion(questionIndex, {
                                marks: Number(e.target.value),
                              })
                            }
                            className="input"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetQuizForm}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingQuiz ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingQuiz ? "Save changes" : "Create quiz"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {selectedQuiz && (
          <Modal
            title={`Attempts · ${selectedQuiz.title}`}
            onClose={() => {
              setSelectedQuiz(null)
              setAttempts([])
            }}
          >
            {loadingAttempts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">
                  No attempts yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Student quiz attempts will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Student #{attempt.student_id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted{" "}
                        {new Date(
                          attempt.submitted_at,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
                      <p className="text-xs font-medium text-slate-500">
                        Score
                      </p>
                      <p className="text-lg font-bold text-slate-950">
                        {attempt.score} / {attempt.total_marks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        )}

        {showMaterialForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    {editingMaterial ? "Edit material" : "Add material"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a learning resource to this course.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMaterialForm(false)
                    resetMaterialForm()
                  }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Close material form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={saveMaterial} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Title
                  </label>
                  <input
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="e.g. HTML & CSS Fundamentals"
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    Description
                  </label>
                  <textarea
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    placeholder="Briefly describe this resource..."
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {!editingMaterial && (
                  <div>
                    <label className="text-sm font-semibold text-slate-800">
                      Upload from device
                    </label>
                    <label className="mt-1.5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center hover:border-slate-300 hover:bg-white">
                      <Upload className="h-5 w-5 text-slate-500" />
                      <span className="mt-2 text-sm font-semibold text-slate-700">
                        {materialFile ? materialFile.name : "Choose any file from your device"}
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        PDF, DOCX, PPTX, XLSX, images, ZIP, TXT and other file types · max 10 MB
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="mt-1 text-xs text-slate-400">
                      Uploaded files are attached directly to this course material.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    File URL
                  </label>
                  <input
                    type="url"
                    value={materialFileUrl}
                    onChange={(e) => setMaterialFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Use this for a hosted PDF, document, image, or other file.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={materialExternalUrl}
                    onChange={(e) => setMaterialExternalUrl(e.target.value)}
                    placeholder="https://developer.mozilla.org/..."
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Use this for websites, videos, documentation, or external resources.
                  </p>
                </div>

                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3">
                  <input
                    type="checkbox"
                    checked={materialPublished}
                    onChange={(e) => setMaterialPublished(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Publish immediately
                  </span>
                </label>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaterialForm(false)
                      resetMaterialForm()
                    }}
                    className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingMaterial}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {savingMaterial ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {editingMaterial ? "Save changes" : "Add material"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAssignmentForm && (
          <Modal
            title={editingAssignment ? "Edit assignment" : "Create assignment"}
            onClose={resetAssignmentForm}
          >
            <form onSubmit={submitAssignment} className="space-y-4">
              <Field label="Title" required>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build a responsive portfolio"
                  className="input"
                  required
                />
              </Field>

              <Field label="Instructions">
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  placeholder="Explain what students need to complete..."
                  className="input resize-y"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Due date">
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Maximum marks">
                  <input
                    type="number"
                    min="1"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="External URL">
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
              </Field>

              <Field label="File URL">
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
              </Field>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Publish assignment immediately
                </span>
              </label>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetAssignmentForm}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingAssignment}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingAssignment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingAssignment ? "Save changes" : "Create assignment"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {selectedAssignment && (
          <Modal
            title={`Submissions · ${selectedAssignment.title}`}
            onClose={() => {
              setSelectedAssignment(null)
              setSubmissions([])
            }}
          >
            {loadingSubmissions ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">
                  No submissions yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Student submissions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Student #{submission.student_id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Submitted{" "}
                          {new Date(
                            submission.submitted_at,
                          ).toLocaleString()}
                        </p>
                      </div>

                      {submission.external_url && (
                        <a
                          href={submission.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700"
                        >
                          Open submission
                        </a>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                      <input
                        type="number"
                        min="0"
                        max={selectedAssignment.max_marks}
                        value={gradeMarks[submission.id] || ""}
                        onChange={(e) =>
                          setGradeMarks((current) => ({
                            ...current,
                            [submission.id]: e.target.value,
                          }))
                        }
                        placeholder="Marks"
                        className="input"
                      />

                      <input
                        value={gradeFeedback[submission.id] || ""}
                        onChange={(e) =>
                          setGradeFeedback((current) => ({
                            ...current,
                            [submission.id]: e.target.value,
                          }))
                        }
                        placeholder="Feedback for student"
                        className="input"
                      />

                      <button
                        type="button"
                        disabled={gradingId === submission.id}
                        onClick={() => gradeSubmission(submission)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {gradingId === submission.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Grade
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        )}
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}

function Placeholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <ChevronDown className="mx-auto h-8 w-8 text-slate-300" />
      <h2 className="mt-3 text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </section>
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
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-3 sm:p-6">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
        <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
