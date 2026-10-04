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

      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`)
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
    <main className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
        <section
          ref={visualRef}
          className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:min-h-screen lg:flex-col lg:justify-between"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.24),transparent_34%),radial-gradient(circle_at_80%_75%,rgba(139,92,246,.20),transparent_35%)]" />
          <div className="register-orb absolute left-[12%] top-[22%] h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="register-orb absolute right-[16%] top-[18%] h-20 w-20 rounded-full bg-violet-400/20 blur-xl" />
          <div className="register-orb absolute bottom-[18%] left-[35%] h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative z-10 flex items-center gap-3 p-10">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-black text-slate-950 shadow-xl">
              N
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">NEXA</p>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500">
                The Next Way to Learn
              </p>
            </div>
          </div>

          <div className="relative z-10 px-10 pb-16 xl:px-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur"
            >
              <Brain size={13} className="text-blue-300" />
              Your intelligent learning companion
            </motion.div>
            <h1 className="max-w-2xl text-5xl font-black leading-[.98] tracking-[-.055em] text-white xl:text-7xl">
              Start learning
              <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                differently.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400">
              Turn your course material into an interactive learning experience with NEXA.
            </p>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["AI Tutor", "Context-aware help"],
                ["Smart Study", "Practice & review"],
                ["Your Progress", "Learn with insight"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.05] p-4 backdrop-blur">
                  <Brain size={17} className="mb-5 text-blue-300" />
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 px-10 pb-7 text-[11px] text-slate-600">
            Secure access · NEXA
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-5 sm:px-6 sm:py-7">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .5 }}
            className="w-full max-w-md"
          >
            <div className="mb-5 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                <ArrowLeft size={15} /> NEXA
              </Link>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400 shadow-sm ring-1 ring-slate-200">
                Sign up
              </span>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,.35)] sm:p-7">
              <div className="mb-5">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg">
                  <UserRound size={19} />
                </div>
                <h2 className="text-3xl font-black tracking-[-.035em]">Create your account</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Join NEXA and make your learning more intelligent.
                </p>
              </div>

              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  role="alert"
                  className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  <X size={17} className="mt-0.5 shrink-0" />
                  <span>{serverError}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (errors.name) setErrors((current) => ({ ...current, name: undefined }))
                    }}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={loading}
                    aria-invalid={!!errors.name}
                    className={`h-11 w-full rounded-2xl border bg-slate-50 px-4 text-base text-slate-950 outline-none transition focus:bg-white focus:ring-4 ${errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"}`}
                  />
                  {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    aria-invalid={!!errors.email}
                    className={`h-11 w-full rounded-2xl border bg-slate-50 px-4 text-base text-slate-950 outline-none transition focus:bg-white focus:ring-4 ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"}`}
                  />
                  {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        if (errors.password) setErrors((current) => ({ ...current, password: undefined }))
                      }}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      disabled={loading}
                      aria-invalid={!!errors.password}
                      className={`h-11 w-full rounded-2xl border bg-slate-50 px-4 pr-12 text-base text-slate-950 outline-none transition focus:bg-white focus:ring-4 ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">8+ characters · at least one letter and one number</p>
                  {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: undefined }))
                      }}
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      disabled={loading}
                      aria-invalid={!!errors.confirmPassword}
                      className={`h-11 w-full rounded-2xl border bg-slate-50 px-4 pr-12 text-base text-slate-950 outline-none transition focus:bg-white focus:ring-4 ${errors.confirmPassword ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-800">
                    I am joining NEXA as
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setRole("STUDENT")}
                      className={`min-h-16 rounded-2xl border px-3 py-2.5 text-left transition ${role === "STUDENT" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-900"><GraduationCap size={17} className="text-blue-600" />Student</span>
                        {role === "STUDENT" && <Check size={15} className="text-blue-600" />}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">Learn and track progress</p>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setRole("TEACHER")}
                      className={`min-h-16 rounded-2xl border px-3 py-2.5 text-left transition ${role === "TEACHER" ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/10" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-900"><UsersRound size={17} className="text-violet-600" />Teacher</span>
                        {role === "TEACHER" && <Check size={15} className="text-violet-600" />}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">Create and manage content</p>
                    </button>
                  </div>
                  {errors.role && <p className="mt-1 text-xs font-medium text-red-600">{errors.role}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>Create account <ArrowLeft size={16} className="rotate-180 transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              </form>

              <div className="my-5 h-px bg-slate-100" />

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-slate-950 hover:text-blue-600">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )

}
