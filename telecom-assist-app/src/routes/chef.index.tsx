import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { courriersApi, type Courrier } from "@/lib/api";
import { PriorityBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/chef/")({
  component: KanbanPage,
});

function KanbanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const COLUMNS = [
    { key: "A_TRAITER", title: t("chef.aTraiter"), color: "bg-primary-bright" },
    { key: "EN_COURS",  title: t("chef.enCours"),  color: "bg-ai" },
    { key: "TRAITE",    title: t("chef.traites"),   color: "bg-success" },
  ] as const;
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courriersApi.getChefCourriers()
      .then(setCourriers)
      .catch(() => setCourriers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("chef.loading")}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">{t("chef.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("chef.desc")}</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = courriers.filter(c => c.statut === col.key);
          return (
            <div key={col.key} className="rounded-xl bg-card border shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                </div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {items.map(c => (
                  <button
                    key={c._id}
                    onClick={() => navigate({ to: "/chef/affectation-agent", search: { courrierId: c._id } })}
                    className="w-full text-left rounded-lg border bg-card p-3 hover:shadow-md hover:border-primary-bright/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">{c.reference}</span>
                      <PriorityBadge priority={c.priorite?.toLowerCase() as any} />
                    </div>
                    <div className="mt-1.5 text-sm font-medium line-clamp-2">{c.objet}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.correspondant}</div>
                  </button>
                ))}
                {items.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">{t("chef.empty")}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
