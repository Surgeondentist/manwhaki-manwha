export default function AuthGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/3 translate-y-1/4 rounded-full bg-petal/5 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
