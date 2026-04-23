import { useId } from "react";

export function MainSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  const titleId = useId();
  return (
    <section className="space-y-3" aria-labelledby={titleId}>
      <h2
        id={titleId}
        className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
