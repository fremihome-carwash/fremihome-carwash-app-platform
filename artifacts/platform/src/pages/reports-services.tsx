import { AppLayout } from "@/components/layout/app-layout";
import { useGetPlatformServicesReport } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function ReportsServices() {
  const { data: reportData, isLoading } = useGetPlatformServicesReport(
    {},
    { query: { queryKey: ["services-report"] } }
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-52 p-4" />
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

  const washTypeData = data.washTypeBreakdown.map((i) => ({ name: i.washType.slug, value: i.count }));
  const vehicleSizeData = data.vehicleSizeBreakdown.map((i) => ({ name: i.vehicleSize.slug, value: i.count }));

  const PieSection = ({ title, items }: { title: string; items: { name: string; value: number }[] }) => (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{title}</p>
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Sin datos</p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {items.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="px-4 pb-6 space-y-4 mt-2">
        <PieSection title="Tipos de lavado" items={washTypeData} />
        <PieSection title="Tamaño de vehículo" items={vehicleSizeData} />

        {/* Add-ons */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Popularidad de add-ons
            </p>
            {data.addOnBreakdown.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Sin add-ons usados</p>
            ) : (
              <div className="space-y-2">
                {data.addOnBreakdown.map((item) => (
                  <div key={item.addOn.id} className="flex items-center justify-between px-3 py-2.5 border rounded-lg">
                    <span className="text-sm font-medium">{item.addOn.slug}</span>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {item.count} veces
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
