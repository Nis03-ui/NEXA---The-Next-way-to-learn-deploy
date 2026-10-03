"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Brain,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/providers/AuthProvider"

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setEmailError("")
    setPasswordError("")

    let valid = true

    if (!email.trim()) {
      setEmailError("Email is required.")
      valid = false
    } else if (!validateEmail(email.trim())) {
      setEmailError("Enter a valid email address.")
      valid = false
    }

    if (!password) {
      setPasswordError("Password is required.")
      valid = false
    }

    if (!valid) {
      return
    }

    void submitLogin()
  }

  async function submitLogin() {
    try {
      setLoading(true)

      const user = await login(
        email.trim().toLowerCase(),
        password,
      )

      if (user.role === "ADMIN") {
        router.push("/admin")
      } else if (user.role === "TEACHER") {
        router.push("/teacher")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        {/* Brand */}
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
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
              Welcome back
            </p>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em]">
              Continue your
              <span className="block text-slate-500">
                learning journey.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Ask better questions, understand difficult
              concepts, and learn with context from your
              course material.
            </p>
          </div>

          <p className="relative z-10 text-xs text-slate-600">
            © {new Date().getFullYear()} NEXA
          </p>
        </section>

        {/* Login */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Back to NEXA
            </Link>

            <div className="nexa-card overflow-hidden">
              <div className="px-6 pb-2 pt-7 sm:px-8">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                  <LockKeyhole size={14} />
                  Secure sign in
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to continue learning with NEXA.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5 px-6 py-6 sm:px-8 sm:py-8"
              >
                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                  >
                    <X className="mt-0.5 shrink-0" size={17} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setEmailError("")
                        setError("")
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      aria-invalid={!!emailError}
                      className={`nexa-focus h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
                        emailError
                          ? "border-red-300"
                          : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword ? "text" : "password"
                      }
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setPasswordError("")
                        setError("")
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      aria-invalid={!!passwordError}
                      className={`nexa-focus h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
                        passwordError
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

                  {passwordError && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !email.trim() ||
                    !password
                  }
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <div className="border-t border-slate-100 px-6 py-5 text-center sm:px-8">
                <p className="text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
