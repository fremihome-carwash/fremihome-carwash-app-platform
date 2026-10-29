import { AppLayout } from "@/components/layout/app-layout";
import { useState } from "react";
import { useCreatePlatformCompanyId, useUpsertPlatformCompany } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompanyNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createId = useCreatePlatformCompanyId();
  const upsert = useUpsertPlatformCompany();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Get new ID
      const idRes = await createId.mutateAsync(undefined as unknown as void);
      const companyId = idRes.data.id;
      
      // 2. Create company
      await upsert.mutateAsync({
        companyId,
        data: formData
      });
      
      toast({ title: "Success", description: "Company created successfully" });
      setLocation(`/companies/${companyId}`);
      
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Failed to create company", 
        variant: "destructive" 
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Company</h1>
          <p className="text-muted-foreground mt-2">Onboard a new service provider</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Login)</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">Active immediately?</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow them to receive bookings right away
                  </p>
                </div>
                <Switch 
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, active: checked }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createId.isPending || upsert.isPending}>
                <Building2 className="w-4 h-4 mr-2" />
                {createId.isPending || upsert.isPending ? "Creating..." : "Create Company"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
