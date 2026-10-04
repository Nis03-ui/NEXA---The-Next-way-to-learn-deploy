"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Brain,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import gsap from "gsap"
import { useRouter } from "next/navigation"

import { auth } from "@/lib/api"
import { useAuth } from "@/providers/AuthProvider"

type Role = "STUDENT" | "TEACHER"

type FormErrors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visualRef.current) return
    const ctx = gsap.context(() => {
      gsap.to(".register-orb", {
        y: -16,
        x: 8,
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.6,
      })
    }, visualRef)
    return () => ctx.revert()
  }, [])
  const { login } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("STUDENT")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  const passwordChecks = getPasswordChecks(password)
  const passwordStrong =
    passwordChecks.length &&
    passwordChecks.letter &&
    passwordChecks.number

  function validate() {
    const nextErrors: FormErrors = {}

    if (name.trim().length < 2) {
      nextErrors.name = "Enter your full name."
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!password) {
      nextErrors.password = "Password is required."
    } else if (!passwordStrong) {
      nextErrors.password =
        "Use at least 8 characters with a letter and a number."
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password."
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }

    if (!role) {
      nextErrors.role = "Choose your role."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setServerError("")

    if (!validate()) {
      return
    }

    try {
      setLoading(true)

      await auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      })

      const user = await login(
        email.trim().toLowerCase(),
        password,
      )

      if (user.role === "TEACHER") {
        router.push("/teacher")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        {/* Brand panel */}
        <section ref={visualRef} className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="register-orb absolute -left-20 top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="register-orb absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
            <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="nexa-dot-grid absolute inset-0 opacity-10" />
          </div>

          <Link
            href="/"
            className="relative z-10 flex items-center gap-3"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-bold text-slate-950">
              N
            </div>

            <div>
              <p className="text-sm font-bold">NEXA</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                The Next Way to Learn
              </p>
            </div>
          </Link>

          <div className="relative z-10 max-w-xl">
            <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10">
              <Brain size={22} />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Your learning companion
            </p>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em]">
              Start learning
              <span className="block text-slate-500">
                differently.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Turn your course material into an interactive
              learning experience with NEXA.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "AI tutoring",
                "Smart quizzes",
                "Course context",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-600">
            © {new Date().getFullYear()} NEXA
          </p>
        </section>

        {/* Form */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Back to NEXA
            </Link>

            <div className="nexa-card overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                  <UserRound size={14} />
                  New account
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose how you want to use NEXA and start learning.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5 px-6 py-6 sm:px-8 sm:py-8"
              >
                {serverError && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                  >
                    <X className="mt-0.5 shrink-0" size={17} />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (errors.name) {
                        setErrors((current) => ({
                          ...current,
                          name: undefined,
                        }))
                      }
                    }}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={loading}
                    aria-invalid={!!errors.name}
                    className={`nexa-focus h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
                      errors.name
                        ? "border-red-300"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />

                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) {
                        setErrors((current) => ({
                          ...current,
                          email: undefined,
                        }))
                      }
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    aria-invalid={!!errors.email}
                    className={`nexa-focus h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
                      errors.email
                        ? "border-red-300"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />

                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      I am joining NEXA as
                    </label>

                    <span className="text-xs text-slate-400">
                      Choose one
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setRole("STUDENT")}
                      className={`rounded-xl border p-4 text-left transition ${
                        role === "STUDENT"
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-600">
                          <GraduationCap size={19} />
                        </div>

                        {role === "STUDENT" && (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white">
                            <Check size={13} />
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        Student
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Learn, practice and track your progress.
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setRole("TEACHER")}
                      className={`rounded-xl border p-4 text-left transition ${
                        role === "TEACHER"
                          ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-600">
                          <UsersRound size={19} />
                        </div>

                        {role === "TEACHER" && (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white">
                            <Check size={13} />
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        Teacher
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Create content and manage quizzes.
                      </p>
                    </button>
                  </div>

                  {errors.role && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        if (errors.password) {
                          setErrors((current) => ({
                            ...current,
                            password: undefined,
                          }))
                        }
                      }}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      disabled={loading}
                      aria-invalid={!!errors.password}
                      className={`nexa-focus h-11 w-full rounded-xl border bg-white px-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
                        errors.password
                          ? "border-red-300"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-3 space-y-1.5">
                      {[
                        [passwordChecks.length, "At least 8 characters"],
                        [passwordChecks.letter, "Contains a letter"],
                        [passwordChecks.number, "Contains a number"],
                      ].map(([valid, label]) => (
                        <div
                          key={label as string}
                          className={`flex items-center gap-2 text-xs ${
                            valid
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          <span className="grid h-4 w-4 place-items-center">
                            {valid ? (
                              <Check size={13} />
                            ) : (
                              <span className="h-1 w-1 rounded-full bg-current" />
                            )}
                          </span>
                          {label as string}
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        if (errors.confirmPassword) {
                          setErrors((current) => ({
                            ...current,
                            confirmPassword: undefined,
                          }))
                        }
                      }}
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      disabled={loading}
                      aria-invalid={!!errors.confirmPassword}
                      className={`nexa-focus h-11 w-full rounded-xl border bg-white px-3.5 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
                        errors.confirmPassword
                          ? "border-red-300"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current,
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Creating your account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <div className="border-t border-slate-100 px-6 py-5 text-center sm:px-8">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
