"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function MessageInput() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  return (
    <div className="mt-4 flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Escribe un mensaje..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        className="flex-1"
      />
      <Button type="submit" size="icon" onClick={handleSend} disabled={!message.trim()}>
        <Send className="h-4 w-4" />
        <span className="sr-only">Enviar</span>
      </Button>
    </div>
  );
}
