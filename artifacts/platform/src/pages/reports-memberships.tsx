import { AppLayout } from "@/components/layout/app-layout";
import { useGetPlatformMembershipsReport } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, DollarSign, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsMemberships() {
  const { data: reportData, isLoading } = useGetPlatformMembershipsReport(
    {},
    { query: { queryKey: ["memberships-report"] } }
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 p-4" />
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!reportData?.data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16 px-4">
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </div>
      </AppLayout>
    );
  }

  const data = reportData.data;

  const packageData = data.byPackage.map((p) => ({ name: p.package.slug, count: p.count, revenue: p.revenue }));
  const durationData = data.byDuration.map((d) => ({ name: `${d.durationDays}d`, count: d.count }));

  const kpis = [
    { label: "Vendidas", value: data.totalSold.toLocaleString(), icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
    { label: "Activas", value: data.currentlyActive.toLocaleString(), icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Ingresos", value: `$${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <AppLayout>
      <div className="px-4 pb-6 space-y-4 mt-2">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {kpis.map((k) => (
            <Card key={k.label} className="border-0 shadow-sm">
              <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <p className="text-base font-bold leading-tight">{k.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* By package */}
        {packageData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Por paquete
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={packageData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      width={70}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    />
                    <Bar dataKey="count" name="Vendidas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* By duration */}
        {durationData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Por duración
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    />
                    <Bar dataKey="count" name="Cantidad" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
