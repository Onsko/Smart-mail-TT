import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "info";
}

export function AIPanel({ title = "Analyse IA", children, className, tone = "default" }: Props) {
  return (
    <div className={cn(
      "rounded-xl border p-4",
      tone === "info"
        ? "bg-[color-mix(in_oklab,var(--color-info)_10%,white)] border-[color-mix(in_oklab,var(--color-info)_30%,white)]"
        : "bg-ai-tint border-[color-mix(in_oklab,var(--color-ai)_40%,white)]",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          tone === "info" ? "bg-info/15 text-info" : "bg-ai/30 text-amber-700"
        )}>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold">{title}</div>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">IA</span>
      </div>
      <div className="text-sm text-foreground/90 space-y-2">{children}</div>
    </div>
  );
}
