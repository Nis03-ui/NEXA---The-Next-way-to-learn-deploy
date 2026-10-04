"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import gsap from "gsap"
import {
  ArrowRight,
  BrainCircuit,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  X,
} from "lucide-react"

import { useAuth } from "@/providers/AuthProvider"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const visualRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visualRef.current) return
    const ctx = gsap.context(() => {
      gsap.to(".auth-orb", {
        y: -18,
        x: 10,
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.7,
      })
    }, visualRef)
    return () => ctx.revert()
  }, [])

  function validate() {
    let valid = true
    const nextEmail = email.trim().toLowerCase()

    setEmailError("")
    setPasswordError("")
    setServerError("")

    if (!nextEmail) {
      setEmailError("Email address is required.")
      valid = false
    } else if (!emailPattern.test(nextEmail)) {
      setEmailError("Enter a valid email address.")
      valid = false
    }

    if (!password) {
      setPasswordError("Password is required.")
      valid = false
    }

    return valid
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)
      const user = await login(email.trim().toLowerCase(), password)

      if (user.role === "ADMIN") router.push("/admin")
      else if (user.role === "TEACHER") router.push("/teacher")
      else router.push("/dashboard")
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Check your email and password.",
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
          <div className="auth-orb absolute left-[12%] top-[22%] h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="auth-orb absolute right-[16%] top-[18%] h-20 w-20 rounded-full bg-violet-400/20 blur-xl" />
          <div className="auth-orb absolute bottom-[18%] left-[35%] h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />

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
              <Sparkles size={13} className="text-blue-300" />
              Your intelligent learning companion
            </motion.div>
            <h1 className="max-w-2xl text-5xl font-black leading-[.98] tracking-[-.055em] text-white xl:text-7xl">
              Learn with
              <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                more clarity.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400">
              Ask questions, understand your course material, practice with quizzes,
              and keep your learning moving forward.
            </p>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["AI Tutor", "Context-aware help"],
                ["Smart Study", "Practice & review"],
                ["Your Progress", "Learn with insight"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.05] p-4 backdrop-blur">
                  <BrainCircuit size={17} className="mb-5 text-blue-300" />
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

        <section className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .5 }}
            className="w-full max-w-md"
          >
            <div className="mb-7 flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                <span aria-hidden>←</span> NEXA
              </Link>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400 shadow-sm ring-1 ring-slate-200">
                Sign in
              </span>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,.35)] sm:p-8">
              <div className="mb-7">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg">
                  <LockKeyhole size={20} />
                </div>
                <h2 className="text-3xl font-black tracking-[-.035em]">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in and continue where you left off.
                </p>
              </div>

              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    role="alert"
                    className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                  >
                    <X size={17} className="mt-0.5 shrink-0" />
                    <span>{serverError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-800">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="text"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); setServerError("") }}
                      disabled={loading}
                      aria-invalid={Boolean(emailError)}
                      placeholder="you@example.com"
                      className={`h-12 w-full rounded-2xl border bg-slate-50 pl-10 pr-4 text-base text-slate-950 outline-none transition focus:bg-white focus:ring-4 ${emailError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"}`}
                    />
                  </div>
                  {emailError && <p className="mt-1.5 text-xs font-medium text-red-600">{emailError}</p>}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="text-sm font-bold text-slate-800">Password</label>
                    <Link href="/forgot-password" className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordError(""); setServerError("") }}
                      disabled={loading}
                      aria-invalid={Boolean(passwordError)}
                      placeholder="Enter your password"
                      className={`h-12 w-full rounded-2xl border bg-slate-50 pl-10 pr-12 text-base text-slate-950 outline-none transition focus:bg-white focus:ring-4 ${passwordError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      disabled={loading}
                      className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1.5 text-xs font-medium text-red-600">{passwordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in…" : <>Sign in <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>

              <div className="my-7 h-px bg-slate-100" />

              <p className="text-center text-sm text-slate-500">
                New to NEXA?{" "}
                <Link href="/register" className="font-bold text-slate-950 hover:text-blue-600">
                  Create your account
                </Link>
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}