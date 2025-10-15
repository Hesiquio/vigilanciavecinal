import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export function RecentActivity() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimos acontecimientos en tu colonia.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Junta Vecinal Mañana</p>
            <p className="text-xs text-muted-foreground">Confirmada para las 7:00 PM en el salón comunal.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
