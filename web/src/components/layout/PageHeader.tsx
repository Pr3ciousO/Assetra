import { InfoTip } from "@/components/ui/InfoTip";
import { Reveal } from "@/components/ui/Reveal";

export function PageHeader({ kicker, title, hint, children }: { kicker: string; title: React.ReactNode; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="mb-10 space-y-4">
      <p className="flex items-center gap-2">
        <span className="label">{kicker}</span>
        {hint && <InfoTip>{hint}</InfoTip>}
      </p>
      <h1 className="text-3xl font-light tracking-tight md:text-5xl">{title}</h1>
      {children && <div className="max-w-2xl text-sm leading-relaxed text-steel">{children}</div>}
    </Reveal>
  );
}
