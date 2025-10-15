"use client";

import { AlertCard } from "@/components/dashboard/AlertCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUser } from "@/lib/data";
import type { SosAlert } from "@/lib/data";

export default function DashboardPage({ alerts = [] }: { alerts: SosAlert[] }) {
  return (
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
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <p className="text-sm text-center text-destructive/80">No hay alertas activas en este momento.</p>
          )}
        </CardContent>
      </Card>

      <RecentActivity />
      
    </div>
  );
}
