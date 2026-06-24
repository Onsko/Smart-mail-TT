import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, Building2, Mail, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const stats = [
  { label: "Utilisateurs totaux", value: 142, delta: "+8%", up: true, icon: <Users className="h-5 w-5" /> },
  { label: "Acteurs actifs", value: 98, delta: "+3%", up: true, icon: <UserCheck className="h-5 w-5" /> },
  { label: "Services", value: 4, delta: "0%", up: true, icon: <Building2 className="h-5 w-5" /> },
  { label: "Courriers globaux", value: 1284, delta: "-2%", up: false, icon: <Mail className="h-5 w-5" /> },
];

const chartData = [42, 65, 51, 73, 88, 64, 92];

function AdminDashboard() {
  const max = Math.max(...chartData);
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl bg-card border p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{s.icon}</div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.up ? "text-teal-600" : "text-orange-600"}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.delta}
              </span>
            </div>
            <div className="mt-4 text-2xl font-display font-bold">{s.value.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold">Activité — 7 derniers jours</h3>
            <p className="text-sm text-muted-foreground">Courriers traités par jour</p>
          </div>
          <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option>7 jours</option>
            <option>30 jours</option>
          </select>
        </div>
        <div className="h-56 flex items-end gap-3">
          {chartData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-primary-deep to-primary-bright"
                style={{ height: `${(v / max) * 100}%` }}
              />
              <div className="text-xs text-muted-foreground">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"][i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
