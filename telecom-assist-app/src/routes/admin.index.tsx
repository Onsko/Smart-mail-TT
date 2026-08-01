import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Users, UserCheck, Building2, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { usersApi, courriersApi, servicesApi, type DashboardStatsData, type UserStatsData, type ActivityByTypeDay } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const PIE_COLORS = ["oklch(0.546 0.245 262.881)", "oklch(0.577 0.245 27.66)", "oklch(0.627 0.194 149.214)", "oklch(0.715 0.143 215.221)", "oklch(0.707 0.165 56.017)", "oklch(0.546 0.245 262.881)"];

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useTranslation();
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [serviceCount, setServiceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.getStats(),
      courriersApi.getStats(),
      servicesApi.getAll(),
    ])
      .then(([us, s, svc]) => { setUserStats(us); setStats(s); setServiceCount(svc.length); })
      .catch(() => { setUserStats(null); setStats(null); setServiceCount(0); })
      .finally(() => setLoading(false));
  }, []);

  const statCards = userStats && stats ? [
    { label: t("admin.totalUsers"), value: userStats.total, delta: `+${userStats.total > 0 ? Math.round((userStats.actifs / userStats.total) * 100) : 0}%`, up: true, icon: <Users className="h-5 w-5" /> },
    { label: t("admin.activeUsers"), value: userStats.actifs, delta: `${userStats.total > 0 ? Math.round((userStats.actifs / userStats.total) * 100) : 0}%`, up: true, icon: <UserCheck className="h-5 w-5" /> },
    { label: t("admin.services"), value: serviceCount, delta: ``, up: true, icon: <Building2 className="h-5 w-5" /> },
    { label: t("admin.totalMails"), value: stats.total, delta: ``, up: true, icon: <Mail className="h-5 w-5" /> },
  ] : [];

  const chartData: { name: string; courriers: number }[] = (stats?.activityByDay ?? []).map((d: ActivityByTypeDay) => ({
    name: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    courriers: d.total,
  }));

  const roleData = userStats ? Object.entries(userStats.byRole)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v })) : [];

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{t("admin.loading") || "Chargement..."}</div>;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded-xl bg-card border p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{s.icon}</div>
              {s.delta && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.up ? "text-teal-600" : "text-orange-600"}`}>
                  {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.delta}
                </span>
              )}
            </div>
            <div className="mt-4 text-2xl font-display font-bold">{s.value.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card border p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">{t("admin.chartTitle")}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="courriers" name={t("admin.totalMails")} fill="oklch(0.546 0.245 262.881)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {roleData.length > 0 && (
          <div className="rounded-xl bg-card border p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4">{t("admin.repartitionRoles") || "Utilisateurs par rôle"}</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
