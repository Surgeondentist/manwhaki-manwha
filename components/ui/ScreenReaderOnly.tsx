export function ScreenReaderOnly({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <span className="sr-only">{children}</span>;
}
