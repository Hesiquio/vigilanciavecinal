import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ShieldAlert, MessagesSquare } from "lucide-react";

export function RecentActivity() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimos avisos y comunicaciones en tus grupos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Junta Vecinal Mañana</p>
            <p className="text-xs text-muted-foreground">Se convoca a junta para organizar rondas de vigilancia. 7:00 PM en el salón comunal.</p>
          </div>
        </div>
         <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-3">
          <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Alerta de vehículo sospechoso</p>
            <p className="text-xs text-muted-foreground">Carlos reportó un coche sin placas en la Calle Maple. Se resolvió sin incidentes.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
