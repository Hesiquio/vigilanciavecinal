"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Siren, Mic, Video, MapPin, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SosModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSendSos = () => {
    if (message.trim() === "") {
        toast({
            title: "Mensaje Requerido",
            description: "Por favor, describe la emergencia antes de enviar la alerta.",
            variant: "destructive",
        });
        return;
    }
    
    console.log("SOS Enviado:", { message });
    toast({
        title: "¡Alerta de Auxilio Enviada!",
        description: "Tu grupo ha sido notificado y tu ubicación compartida.",
    });
    setIsOpen(false);
    setMessage("");
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="destructive"
        className="fixed bottom-20 right-4 z-20 h-16 w-16 rounded-full shadow-2xl animate-pulse"
        aria-label="Enviar Alerta de Auxilio"
      >
        <Siren className="h-8 w-8" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-headline text-destructive">
              <Siren className="h-6 w-6" />
              Confirmar Alerta de Auxilio
            </DialogTitle>
            <DialogDescription>
              Tu ubicación actual será compartida con tu grupo. Describe la emergencia para validarla.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Compartiendo ubicación: Parque Central</span>
            </div>
            <div className="relative">
              <Textarea
                placeholder="Describe la emergencia (ej. persona sospechosa, accidente, etc.)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] pr-10"
              />
              <MessageCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Mic className="h-4 w-4" /> Grabar Audio
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Video className="h-4 w-4" /> Grabar Video
                </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleSendSos} className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Enviar Alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
