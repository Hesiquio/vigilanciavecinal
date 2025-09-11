import { chatMessages, currentUser } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function MessageList() {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      {chatMessages.map((message) => {
        const isCurrentUser = message.user.id === currentUser.id;
        return (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2",
              isCurrentUser ? "justify-end" : "justify-start"
            )}
          >
            {!isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.avatarUrl} alt={message.user.name} />
                <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-xs rounded-xl px-4 py-2 md:max-w-md",
                isCurrentUser
                  ? "rounded-br-none bg-primary text-primary-foreground"
                  : "rounded-bl-none bg-card"
              )}
            >
              {!isCurrentUser && (
                <p className="text-xs font-bold text-primary">{message.user.name}</p>
              )}
              <p className="text-sm">{message.text}</p>
              <p className={cn("text-right text-xs", isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {message.timestamp}
              </p>
            </div>
            {isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.avatarUrl} alt={message.user.name} />
                <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}
    </div>
  );
}
