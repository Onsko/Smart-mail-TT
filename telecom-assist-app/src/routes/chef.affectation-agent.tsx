import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { courriersApi, type AgentCharge, type Courrier } from "@/lib/api";
import { Sparkles, Wand2, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/chef/affectation-agent")({
  component: AffectationAgentPage,
});

function AffectationAgentPage() {
  const navigate = useNavigate();
  const { courrierId } = useSearch({ strict: false }) as { courrierId?: string };
  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [agents, setAgents] = useState<AgentCharge[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!courrierId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      courriersApi.getById(courrierId),
      courriersApi.getAgentsCharge(),
    ])
      .then(([c, chargeData]) => {
        setCourrier(c);
        setAgents(chargeData.agents);
        setServiceName(chargeData.serviceName);
      })
      .catch(() => setMessage({ type: "error", text: "Impossible de charger les données." }))
      .finally(() => setLoading(false));
  }, [courrierId]);

  async function handleAssign(agentId: string) {
    if (!courrierId) return;
    setAssigning(true);
    setMessage(null);
    try {
      await courriersApi.assignAgent(courrierId, agentId);
      setMessage({ type: "success", text: "Courrier assigné à l'agent avec succès." });
      setTimeout(() => navigate({ to: "/chef" }), 1500);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Échec de l'assignation" });
    } finally {
      setAssigning(false);
    }
  }

  async function handleAutoAssign() {
    const recommended = agents.find(a => a.recommended);
    if (!recommended) return;
    await handleAssign(recommended._id);
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (!courrierId) return <div className="p-6 text-sm text-muted-foreground">Sélectionnez un courrier depuis le Kanban.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Affectation à un agent</h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un agent du service {serviceName} pour ce courrier.
          </p>
        </div>
        <button
          onClick={handleAutoAssign}
          disabled={assigning || agents.length === 0}
          className="inline-flex items-center gap-2 rounded-md border-2 border-ai bg-ai/15 text-amber-800 px-4 py-2 text-sm font-semibold hover:bg-ai/25 disabled:opacity-60"
        >
          {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Auto-assign (agent le moins chargé)
        </button>
      </div>

      {courrier && (
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="text-xs font-mono text-muted-foreground">{courrier.reference}</div>
          <div className="font-semibold">{courrier.objet}</div>
          <div className="text-sm text-muted-foreground">Expéditeur : {courrier.correspondant}</div>
        </div>
      )}

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
          {message.text}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(a => {
          const pct = Math.min(100, (a.charge / 10) * 100);
          const heavy = a.charge >= 7;
          return (
            <div
              key={a._id}
              className={`rounded-xl bg-card border shadow-sm p-5 relative ${a.recommended ? "ring-2 ring-ai border-ai/60" : ""}`}
            >
              {a.recommended && (
                <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-ai text-amber-900 text-[10px] font-semibold px-2 py-0.5">
                  <Sparkles className="h-3 w-3" /> Recommandé
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {a.prenom[0]}{a.nom[0]}
                </div>
                <div>
                  <div className="font-semibold">{a.prenom} {a.nom}</div>
                  <div className="text-xs text-muted-foreground">{serviceName}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Charge actuelle</span>
                  <span className={`font-medium ${heavy ? "text-orange-600" : "text-teal-600"}`}>{a.charge} courriers</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${heavy ? "bg-prio-high" : "bg-success"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <button
                onClick={() => handleAssign(a._id)}
                disabled={assigning}
                className="mt-4 w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Assigner
              </button>
            </div>
          );
        })}
        {agents.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8">
            Aucun agent dans ce service. Ajoutez des agents via la gestion des utilisateurs.
          </div>
        )}
      </div>
    </div>
  );
}
