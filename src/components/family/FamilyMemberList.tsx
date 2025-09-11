import { familyMembers } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FamilyMemberList() {
  return (
    <div className="space-y-4">
      {familyMembers.map((member) => (
        <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatarUrl} alt={member.name} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.lastSeen}</p>
            </div>
          </div>
          <Badge
            variant={member.status === 'Safe' ? 'secondary' : 'destructive'}
            className={cn(
              member.status === 'Safe' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
              member.status === 'Away' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
              member.status === 'Alert' && 'bg-red-100 text-red-800'
            )}
          >
            {member.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
