import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

function LoginFormFallback() {
  return (
    <div className="glass-card animate-pulse rounded-3xl p-6">
      <div className="h-40 rounded-xl bg-white/5" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
