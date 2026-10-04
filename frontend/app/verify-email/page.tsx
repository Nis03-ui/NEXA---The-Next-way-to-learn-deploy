"use client"

import Link from "next/link"
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Suspense } from "react"

import { auth } from "@/lib/api"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email") || ""

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  )
  const [message, setMessage] = useState(
    token
      ? "Verifying your email address…"
      : "This verification link is missing its token.",
  )

  useEffect(() => {
    const verificationToken = token
    if (!verificationToken) return

    let cancelled = false

    async function verify() {
      try {
        const result = await auth.verifyEmail(verificationToken)
        if (cancelled) return
        setStatus("success")
        setMessage(result.message || "Your email has been verified.")
      } catch (error) {
        if (cancelled) return
        setStatus("error")
        setMessage(
          error instanceof Error
            ? error.message
            : "This verification link is invalid or expired.",
        )
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-10"
        >
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-950">
            {status === "loading" && <Loader2 className="animate-spin" size={28} />}
            {status === "success" && <CheckCircle2 size={30} />}
            {status === "error" && <XCircle size={30} />}
          </div>

          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-300">
            <MailCheck size={16} />
            NEXA email verification
          </div>

          <h1 className="text-2xl font-black sm:text-3xl">
            {status === "loading"
              ? "Verifying your email"
              : status === "success"
                ? "Email verified"
                : "Verification failed"}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300">
            {message}
          </p>

          {status === "success" && (
            <Link
              href="/login"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
            >
              Continue to sign in
            </Link>
          )}

          {status === "error" && (
            <div className="mt-7 flex flex-col items-center gap-3">
              {email && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setMessage("Sending a new verification email…")
                      await auth.resendVerification(email)
                      setMessage("If the account exists and is not verified, a new verification email has been sent.")
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to resend the verification email.",
                      )
                    }
                  }}
                  className="h-12 rounded-2xl bg-white px-6 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
                >
                  Resend verification email
                </button>
              )}
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl">
            <Loader2 className="mx-auto animate-spin" size={28} />
            <p className="mt-4 text-sm text-slate-300">Loading verification…</p>
          </div>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
