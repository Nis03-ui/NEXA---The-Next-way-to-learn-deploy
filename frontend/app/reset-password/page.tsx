
import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-sm text-slate-400">
        Loading password reset...
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}