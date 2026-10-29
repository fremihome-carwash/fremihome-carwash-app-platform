import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetPlatformPaymentMethods,
  useGetPlatformCompanies,
  useUpdatePlatformPaymentMethod,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Building2,
  Banknote,
  Smartphone,
  Wallet,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  CreditCard:  <CreditCard className="h-5 w-5" />,
  Building2:   <Building2 className="h-5 w-5" />,
  Banknote:    <Banknote className="h-5 w-5" />,
  Smartphone:  <Smartphone className="h-5 w-5" />,
  Wallet:      <Wallet className="h-5 w-5" />,
};

export default function PaymentMethods() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: methodsData, isLoading } = useGetPlatformPaymentMethods({
    query: {
      queryKey: ["payment-methods"],
      staleTime: 0,
      refetchOnMount: "always",
    },
  });
  const { data: companiesData } = useGetPlatformCompanies(
    { page: 1, limit: 100 },
    { query: { queryKey: ["companies-all"] } },
  );
  const updateMethod = useUpdatePlatformPaymentMethod();

  const methods = methodsData?.data ?? [];
  const companies = companiesData?.data ?? [];

  const countByMethod = (methodId: string) =>
    companies.filter((c) => c.paymentMethods?.includes(methodId)).length;

  const toggleActive = (id: string, active: boolean) => {
    updateMethod.mutate(
      { methodId: id, data: { active } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" }),
      },
    );
  };

  return (
    <AppLayout>
      <div className="px-4 pt-2 pb-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Métodos de pago</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Activa o desactiva los métodos disponibles en la plataforma. Cada empresa eligirá los que acepta de los que estén activos.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-16 p-4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((m: any) => {
              const count = countByMethod(m.id);
              return (
                <Card key={m.id} className={!m.active ? "opacity-60" : ""}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {ICON_MAP[m.icon] ?? <Wallet className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight">{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.active
                          ? count === 0
                            ? "Ninguna empresa lo usa aún"
                            : count === 1
                            ? "1 empresa lo acepta"
                            : `${count} empresas lo aceptan`
                          : "No disponible en la plataforma"}
                      </p>
                    </div>
                    <Switch
                      checked={m.active}
                      onCheckedChange={(c) => toggleActive(m.id, c)}
                      disabled={updateMethod.isPending}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
