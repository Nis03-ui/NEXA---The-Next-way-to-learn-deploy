"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react"
import { auth } from "@/lib/api"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    const normalized = email.trim().toLowerCase()

    if (!normalized) {
      setError("Email address is required.")
      return
    }

    if (!emailPattern.test(normalized)) {
      setError("Enter a valid email address, such as you@example.com.")
      return
    }

    try {
      setLoading(true)
      const response = await auth.forgotPassword(normalized)
      setMessage(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a reset link.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,.4)] lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div className="absolute -right-20 top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white font-black text-slate-950">N</div>
              <div><p className="font-black">NEXA</p><p className="text-[10px] uppercase tracking-[.18em] text-slate-500">The Next Way to Learn</p></div>
            </div>
            <div className="relative z-10">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10"><ShieldCheck size={22} /></div>
              <h1 className="text-5xl font-black leading-[1] tracking-[-.05em]">Back to learning,<span className="block text-blue-300">without the stress.</span></h1>
              <p className="mt-6 max-w-md text-sm leading-6 text-slate-400">We’ll send a secure reset link to the email connected to your NEXA account.</p>
            </div>
            <p className="relative z-10 text-xs text-slate-600">NEXA · Secure account recovery</p>
          </div>

          <section className="flex items-center px-5 py-8 sm:px-10 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
              <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
                <ArrowLeft size={16} /> Back to sign in
              </Link>

              <div className="mb-7">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><Mail size={20} /></div>
                <h2 className="text-3xl font-black tracking-[-.035em]">Forgot your password?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Enter your account email and we’ll send a reset link if the account exists.</p>
              </div>

              {message ? (
                <motion.div initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
                    <div>
                      <p className="font-bold text-emerald-900">Check your inbox</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">{message}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-emerald-700">If you don’t see it, check spam or confirm that the address belongs to your NEXA account.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700">{error}</div>}
                  <div>
                    <label htmlFor="reset-email" className="mb-2 block text-sm font-bold text-slate-800">Account email</label>
                    <div className="relative">
                      <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="reset-email"
                        type="email"
                        inputMode="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError("") }}
                        disabled={loading}
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
                    {loading ? <><Loader2 size={17} className="animate-spin" /> Sending link…</> : "Send reset link"}
                  </button>
                </form>
              )}

              <p className="mt-7 text-center text-sm text-slate-500">
                Remembered it? <Link href="/login" className="font-bold text-slate-950 hover:text-blue-600">Sign in</Link>
              </p>
            </motion.div>
          </section>
        </div>
      </div>
    </main>
  )
}