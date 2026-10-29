import { useState, type FormEvent } from "react";
import { useLogin } from "@workspace/api-client-react";
import { MobileFrame } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("12345");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    login.mutate(
      { data: { email: email.trim(), password } },
      {
        onSuccess: (data) => {
          localStorage.setItem("platform_token", data.data.token);
          window.location.href = "/dashboard";
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Credenciales incorrectas");
        },
      },
    );
  }

  return (
    <MobileFrame>
      <div className="flex-1 flex flex-col justify-center px-6 py-10 gap-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CW Super Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Panel de administración</p>
          </div>
        </div>

        <Card className="p-5 space-y-4">
          <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="login-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ¿Necesitas ayuda? Contacta a soporte
        </p>
      </div>
    </MobileFrame>
  );
}
