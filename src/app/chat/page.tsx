import { AppShell } from "@/components/AppShell";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

export default function ChatPage() {
  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <MessageList />
        <MessageInput />
      </div>
    </AppShell>
  );
}
