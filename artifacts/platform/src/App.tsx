import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMe, getGetMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Finanzas from "./pages/finanzas";
import Bookings from "./pages/bookings";
import BookingDetail from "./pages/booking-detail";
import Companies from "./pages/companies";
import CompanyNew from "./pages/company-new";
import CompanyDetail from "./pages/company-detail";
import CatalogPackages from "./pages/catalog-packages";
import CatalogServices from "./pages/catalog-services";
import CatalogWashTypes from "./pages/catalog-wash-types";
import CatalogZones from "./pages/catalog-zones";
import ReportsRevenue from "./pages/reports-revenue";
import ReportsBookings from "./pages/reports-bookings";
import ReportsServices from "./pages/reports-services";
import ReportsMemberships from "./pages/reports-memberships";
import More from "./pages/more";
import PaymentMethods from "./pages/payment-methods";

setAuthTokenGetter(() => localStorage.getItem("platform_token"));

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (!isLoading && error) {
      setLocation("/login");
    }
  }, [isLoading, error, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return null;

  return <Component {...rest} />;
}

function Router() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/") setLocation("/dashboard");
    if (location === "/catalog") setLocation("/catalog/packages");
    if (location === "/reports") setLocation("/reports/revenue");
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/finanzas">{() => <ProtectedRoute component={Finanzas} />}</Route>

      <Route path="/bookings">{() => <ProtectedRoute component={Bookings} />}</Route>
      <Route path="/bookings/:bookingId">{() => <ProtectedRoute component={BookingDetail} />}</Route>

      <Route path="/companies">{() => <ProtectedRoute component={Companies} />}</Route>
      <Route path="/companies/new">{() => <ProtectedRoute component={CompanyNew} />}</Route>
      <Route path="/companies/:companyId">{() => <ProtectedRoute component={CompanyDetail} />}</Route>

      <Route path="/catalog/packages">{() => <ProtectedRoute component={CatalogPackages} />}</Route>
      <Route path="/catalog/wash-types">{() => <ProtectedRoute component={CatalogWashTypes} />}</Route>
      <Route path="/catalog/services">{() => <ProtectedRoute component={CatalogServices} />}</Route>
      <Route path="/catalog/zones">{() => <ProtectedRoute component={CatalogZones} />}</Route>

      <Route path="/reports/revenue">{() => <ProtectedRoute component={ReportsRevenue} />}</Route>
      <Route path="/reports/bookings">{() => <ProtectedRoute component={ReportsBookings} />}</Route>
      <Route path="/reports/services">{() => <ProtectedRoute component={ReportsServices} />}</Route>
      <Route path="/reports/memberships">{() => <ProtectedRoute component={ReportsMemberships} />}</Route>

      <Route path="/payment-methods">{() => <ProtectedRoute component={PaymentMethods} />}</Route>
      <Route path="/more">{() => <ProtectedRoute component={More} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
