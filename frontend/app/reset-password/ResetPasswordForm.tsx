
"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { auth } from "@/lib/api";

function Requirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
          valid
            ? "border-emerald-400 bg-emerald-400/10"
            : "border-slate-700"
        }`}
      >
        {valid && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
      </span>

      <span className={valid ? "text-emerald-300" : "text-slate-500"}>
        {text}
      </span>
    </div>
  );
}

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("This password reset link is invalid or incomplete.");
      return;
    }

    if (!hasMinLength) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (!hasLetter) {
      setError("Password must contain at least one letter.");
      return;
    }

    if (!hasNumber) {
      setError("Password must contain at least one number.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await auth.resetPassword(token, password);

      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to reset your password. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <h1 className="text-2xl font-semibold text-white">
              Password reset successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your password has been updated successfully. Redirecting you to
              the login page...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-semibold text-white">
              Invalid reset link
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              This password reset link is missing its token or is no longer
              valid.
            </p>

            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Request a new link
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-950" />

          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-bold text-slate-950 shadow-lg">
                  N
                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight">NEXA</p>

                  <p className="text-xs text-slate-400">
                    The Next Way to Learn
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
                <LockKeyhole className="h-3.5 w-3.5" />
                Secure account recovery
              </div>

              <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Create a new password
                <span className="block text-indigo-300">
                  and get back to learning.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                Your account security matters. Choose a strong password and
                continue your learning journey with NEXA.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              NEXA · AI-powered learning assistant
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
                N
              </div>

              <div>
                <p className="font-bold">NEXA</p>

                <p className="text-xs text-slate-500">
                  The Next Way to Learn
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
                <LockKeyhole className="h-6 w-6 text-indigo-400" />
              </div>

              <h1 className="text-3xl font-semibold tracking-tight">
                Reset your password
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Create a new password for your NEXA account.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  New password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm new password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-3 text-xs font-medium text-slate-300">
                  Password requirements
                </p>

                <div className="space-y-2 text-xs">
                  <Requirement
                    valid={hasMinLength}
                    text="At least 8 characters"
                  />

                  <Requirement
                    valid={hasLetter}
                    text="At least one letter"
                  />

                  <Requirement
                    valid={hasNumber}
                    text="At least one number"
                  />

                  <Requirement
                    valid={passwordsMatch}
                    text="Passwords match"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Resetting password..." : "Reset password"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
              >
                Back to login
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

