import { AppLayout } from "@/components/layout/app-layout";
import { useGetPlatformRevenueReport } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { SheetSelect } from "@/components/ui/sheet-select";
import { useState } from "react";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsRevenue() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  const { data: reportData, isLoading } = useGetPlatformRevenueReport(
    { period },
    { query: { queryKey: ["revenue-report", period] } }
  );

  const report = reportData?.data;

  const kpis = report
    ? [
        { label: "Ingresos totales", value: `$${report.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Ticket promedio", value: `$${report.averageTicket.toLocaleString()}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Lavados", value: `$${report.individualRevenue.toLocaleString()}`, icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
        { label: "Membresías", value: `$${report.membershipRevenue.toLocaleString()}`, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50" },
      ]
    : [];

  return (
    <AppLayout>
      {/* Period selector */}
      <div className="px-4 pt-4 pb-3">
        <SheetSelect
          value={period}
          onValueChange={(v) => setPeriod(v as any)}
          options={[
            { value: "day", label: "Hoy" },
            { value: "week", label: "Esta semana" },
            { value: "month", label: "Este mes" },
          ]}
          placeholder="Período"
          title="Período"
        />
      </div>

      {isLoading ? (
        <div className="px-4 grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 p-4" />
            </Card>
          ))}
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <p className="text-sm text-muted-foreground">Sin datos para este período</p>
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-2">
            {kpis.map((k) => (
              <Card key={k.label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">{k.value}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          {report.revenueByDay && report.revenueByDay.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Ingresos por día
                </p>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.revenueByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                        tickFormatter={(val) => `$${val}`}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "Ingresos"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("es-MX")}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
