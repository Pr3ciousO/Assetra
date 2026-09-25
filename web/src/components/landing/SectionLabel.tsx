export function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="text-[11px] tracking-[0.2em] text-frontier">{n}</span>
      <span className="h-px w-10 bg-white/10" />
      <span className="label">{children}</span>
    </div>
  );
}
