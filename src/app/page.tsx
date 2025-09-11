import { AppShell } from "@/components/AppShell";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sosAlerts, currentUser } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground">
            Hola, {currentUser.name}
          </h2>
          <p className="text-muted-foreground">Bienvenido a tu red de seguridad vecinal.</p>
        </div>

        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Alerta Activa</CardTitle>
          </CardHeader>
          <CardContent>
            {sosAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </CardContent>
        </Card>

        <RecentActivity />
        
      </div>
    </AppShell>
  );
}
