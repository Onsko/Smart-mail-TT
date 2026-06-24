import { cn } from "@/lib/utils";

type Status = "nouveau" | "en_cours" | "en_attente" | "traite" | "urgent";

const map: Record<Status, { label: string; cls: string }> = {
  nouveau:    { label: "Nouveau",    cls: "bg-primary-bright/12 text-primary-bright ring-primary-bright/30" },
  en_cours:   { label: "En cours",   cls: "bg-ai/20 text-amber-700 ring-ai/40" },
  en_attente: { label: "En attente", cls: "bg-muted text-muted-foreground ring-border" },
  traite:     { label: "Traité",     cls: "bg-success/15 text-teal-700 ring-success/40" },
  urgent:     { label: "Urgent",     cls: "bg-prio-high/15 text-orange-700 ring-prio-high/40" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = map[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      s.cls, className
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  );
}

const prioMap = {
  haute:   "bg-prio-high/15 text-orange-700 ring-prio-high/40",
  moyenne: "bg-prio-mid/15 text-pink-700 ring-prio-mid/40",
  basse:   "bg-muted text-muted-foreground ring-border",
} as const;

export function PriorityBadge({ priority }: { priority: keyof typeof prioMap }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
      prioMap[priority]
    )}>
      {priority}
    </span>
  );
}
