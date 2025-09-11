import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatMessages } from "@/lib/data";
import { MessageSquare, Users } from "lucide-react";

export function RecentActivity() {
  const recentMessages = chatMessages.slice(-3).reverse();

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

        <div className="space-y-3 pt-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-primary" />
                Últimos Mensajes del Chat
            </h4>
            {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.user.avatarUrl} alt={message.user.name} />
                        <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{message.user.name}:</span> {message.text}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
