import { AppLayout } from "@/components/layout/app-layout";
import { useGetPlatformBookingsReport } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ReportsBookings() {
  const { data: reportData, isLoading } = useGetPlatformBookingsReport(
    {},
    { query: { queryKey: ["bookings-report"] } }
  );

  const report = reportData?.data;

  const kpis = report
    ? [
        { label: "Total citas", value: report.totalBookings.toLocaleString(), icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Completadas", value: `${(report.completionRate * 100).toFixed(1)}%`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Canceladas", value: `${(report.cancellationRate * 100).toFixed(1)}%`, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
      ]
    : [];

  return (
    <AppLayout>
      {isLoading ? (
        <div className="px-4 pt-4 grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 p-4" />
            </Card>
          ))}
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </div>
      ) : (
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

          {/* Chart */}
          {report.byDay && report.byDay.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Citas por día
                </p>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.byDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return isNaN(d.getTime()) ? val : d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("es-MX")}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="completed" name="Completadas" stackId="a" fill="hsl(var(--chart-2))" />
                      <Bar dataKey="cancelled" name="Canceladas" stackId="a" fill="hsl(var(--chart-4))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppLayout>
  );
}
