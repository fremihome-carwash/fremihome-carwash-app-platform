import { AppLayout } from "@/components/layout/app-layout";
import { useState } from "react";
import { useGetPlatformCompanies } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, Star, Phone, ChevronLeft, ChevronRight } from "lucide-react";

export default function Companies() {
  const [page, setPage] = useState(1);

  const { data: companiesData, isLoading } = useGetPlatformCompanies(
    { page, limit: 20 },
    { query: { queryKey: ["companies", page] } }
  );

  const companies = companiesData?.data ?? [];
  const pagination = companiesData?.pagination;

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <Card key={company.id} className="hover:bg-muted/50 transition-colors">
                <Link href={`/companies/${company.id}`}>
                  <CardContent className="p-4 cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-base leading-tight">{company.name}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                        company.status === "active"   ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        company.status === "pending"  ? "bg-amber-100 text-amber-800 border-amber-200" :
                        company.status === "blocked"  ? "bg-red-100 text-red-800 border-red-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {company.status === "active"   ? "Activa" :
                         company.status === "pending"  ? "Pendiente" :
                         company.status === "blocked"  ? "Bloqueada" : "Rechazada"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {company.rating ? company.rating.toFixed(1) : "—"}
                        <span className="ml-0.5">({company.completedBookings} lavados)</span>
                      </span>
                      {company.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {company.phone}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}

            {companies.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground border-dashed">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                No se encontraron empresas.
              </Card>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
