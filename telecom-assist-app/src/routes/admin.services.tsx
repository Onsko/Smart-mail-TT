import { createFileRoute } from "@tanstack/react-router";
import { Cog, ShoppingBag, Users, Wallet, Pencil } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/admin/services")({
  component: ServicesPage,
});

const services: { name: string; icon: ReactNode; agents: number; courriers: number; color: string }[] = [
  { name: "Technique",  icon: <Cog className="h-5 w-5" />,        agents: 24, courriers: 87, color: "from-primary-deep to-primary-bright" },
  { name: "Commercial", icon: <ShoppingBag className="h-5 w-5" />, agents: 18, courriers: 53, color: "from-[#1477C9] to-[#2EC4B6]" },
  { name: "RH",         icon: <Users className="h-5 w-5" />,       agents: 12, courriers: 21, color: "from-[#8B3FA8] to-[#D6377B]" },
  { name: "Financier",  icon: <Wallet className="h-5 w-5" />,      agents: 9,  courriers: 34, color: "from-[#F7941D] to-[#FDB913]" },
];

function ServicesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Services</h2>
        <p className="text-sm text-muted-foreground">Vue d'ensemble des 4 services métiers.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map(s => (
          <div key={s.name} className="rounded-xl bg-card border shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-br ${s.color} text-white p-5`}>
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center">{s.icon}</div>
                <button className="rounded-md p-1.5 hover:bg-white/15" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{s.name}</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-display font-bold">{s.agents}</div>
                <div className="text-xs text-muted-foreground">Agents</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold">{s.courriers}</div>
                <div className="text-xs text-muted-foreground">Courriers en cours</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
