
"use client";

import { useState, useEffect } from "react";
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
import { Megaphone, Calendar as CalendarIcon, Clock, Users, Heart, Loader, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, serverTimestamp, addDoc, Timestamp } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { UserProfile, UserGroup } from "@/types";

type AvisoModalProps = {
    user: User;
}

const BASE_AUDIENCES = ["neighbors", "family"];

export function AvisoModal({ user }: AvisoModalProps) {
  const { firestore } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "users", user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const userGroupsQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/groups`) : null),
    [user, firestore]
  );
  const { data: userGroups, isLoading: isLoadingGroups } = useCollection<UserGroup>(userGroupsQuery);

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setTitle("");
      setDescription("");
      setEventDate(undefined);
      setEventTime("");
      setAudience([]);
      setIsSending(false);
    }
  }, [isOpen]);

  const handleAudienceChange = (checked: boolean, value: string) => {
    setAudience(prev => 
        checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  }
  
  const handleSelectAll = () => {
    const allGroupIds = userGroups?.filter(g => g.status === 'accepted').map(g => g.id) || [];
    setAudience([...BASE_AUDIENCES, ...allGroupIds]);
  }

  const postMessageToChats = async (avisoTitle: string, avisoDescription: string) => {
      if (!firestore) return;

      const chatMessage = {
          text: `**AVISO: ${avisoTitle}**\n${avisoDescription}`,
          userId: 'system', // Special ID for system messages
          userName: 'Sistema de Avisos',
          userAvatarUrl: '', // No avatar for system
          timestamp: serverTimestamp(),
      };
      
      const postPromises: Promise<any>[] = [];

      for (const aud of audience) {
        if (aud === 'family' && userProfile) {
             const familyId = user.uid;
             const familyChatRef = collection(firestore, `family-chats/${familyId}/messages`);
             postPromises.push(addDoc(familyChatRef, chatMessage));
        } else if (aud === 'neighbors' && userProfile?.postalCode) {
            const neighborhoodChatRef = collection(firestore, `neighborhood-chats/${userProfile.postalCode}/messages`);
            postPromises.push(addDoc(neighborhoodChatRef, chatMessage));
        } else {
            // It's a group ID
            const groupChatRef = collection(firestore, `group-chats/${aud}/messages`);
            postPromises.push(addDoc(groupChatRef, chatMessage));
        }
      }

      await Promise.all(postPromises);
  }
  
  const getEventTimestamp = (): Timestamp | null => {
      if (!eventDate) return null;
      const [hours, minutes] = eventTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        eventDate.setHours(0,0,0,0);
        return Timestamp.fromDate(eventDate);
      }
      eventDate.setHours(hours, minutes, 0, 0);
      return Timestamp.fromDate(eventDate);
  }

  const handleSendAviso = async () => {
    if (isSending) return;

    if (!title.trim()) {
        toast({ title: "Título Requerido", description: "Por favor, dale un título a tu aviso.", variant: "destructive" });
        return;
    }
    if (!description.trim()) {
        toast({ title: "Descripción Requerida", description: "Por favor, añade una descripción para el aviso.", variant: "destructive" });
        return;
    }
     if (!eventDate) {
        toast({ title: "Fecha Requerida", description: "Por favor, selecciona una fecha para el evento.", variant: "destructive" });
        return;
    }
    if (audience.length === 0) {
        toast({ title: "Audiencia Requerida", description: "Por favor, selecciona a quién deseas notificar.", variant: "destructive" });
        return;
    }
    
    if (!firestore) {
        toast({ title: "Error", description: "La base de datos no está disponible.", variant: "destructive" });
        return;
    }
    
    const finalEventTimestamp = getEventTimestamp();
    if (!finalEventTimestamp) {
        toast({ title: "Error de Fecha", description: "La fecha o la hora no son válidas.", variant: "destructive" });
        return;
    }
    
    setIsSending(true);

    try {
        const avisosCollection = collection(firestore, 'avisos');
        const newAvisoData = {
            userId: user.uid,
            userName: user.displayName || "Usuario Anónimo",
            userAvatarUrl: user.photoURL || "",
            title,
            description,
            eventTimestamp: finalEventTimestamp,
            audience,
            timestamp: serverTimestamp(),
        };

        await addDoc(avisosCollection, newAvisoData);
        await postMessageToChats(title, description);

        toast({
            title: "¡Aviso Enviado!",
            description: "Los grupos seleccionados han sido notificados en sus respectivos chats.",
        });
        
        setIsOpen(false);

    } catch (error) {
        console.error("Error sending aviso:", error);
        toast({ title: "Error", description: "No se pudo enviar el aviso.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        aria-label="Crear Aviso"
      >
        <Megaphone className="h-6 w-6 text-muted-foreground" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-headline">
              <Megaphone className="h-6 w-6 text-primary" />
              Crear Aviso
            </DialogTitle>
            <DialogDescription>
              Informa a tus grupos sobre un próximo evento, reunión o cualquier comunicado general.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="aviso-title">Título del Aviso</Label>
                <Input 
                    id="aviso-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Junta Vecinal Mensual"
                />
            </div>
            <div className="space-y-2">
                 <Label htmlFor="aviso-description">Descripción</Label>
                <Textarea
                    id="aviso-description"
                    placeholder="Describe el motivo del aviso, la agenda, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                     <Label>Fecha del Evento</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !eventDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventDate ? format(eventDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={eventDate}
                            onSelect={setEventDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="aviso-time">Hora (HH:mm)</Label>
                    <div className="relative">
                        <Clock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="aviso-time"
                            type="time"
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Label className="text-sm font-medium">Notificar a:</Label>
                 <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleSelectAll}>Enviar a todos</Button>
              </div>
               <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox 
                                id="aviso-audience-neighbors" 
                                checked={audience.includes('neighbors')} 
                                onCheckedChange={(checked) => handleAudienceChange(!!checked, 'neighbors')} 
                            />
                            <Label htmlFor="aviso-audience-neighbors" className="flex items-center gap-2 text-sm font-normal"><Users className="h-4 w-4"/> Vecinos</Label>
                        </div>
                         <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox 
                                id="aviso-audience-family" 
                                checked={audience.includes('family')} 
                                onCheckedChange={(checked) => handleAudienceChange(!!checked, 'family')} 
                            />
                            <Label htmlFor="aviso-audience-family" className="flex items-center gap-2 text-sm font-normal"><Heart className="h-4 w-4"/> Familia</Label>
                        </div>
                    </div>
                    {isLoadingGroups && <p className="text-xs text-muted-foreground">Cargando grupos...</p>}
                    {userGroups && userGroups.filter(g => g.status === 'accepted').map(group => (
                         <div key={group.id} className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox 
                                id={`aviso-audience-${group.id}`}
                                checked={audience.includes(group.id)} 
                                onCheckedChange={(checked) => handleAudienceChange(!!checked, group.id)} 
                            />
                            <Label htmlFor={`aviso-audience-${group.id}`} className="flex items-center gap-2 text-sm font-normal"><Users className="h-4 w-4"/> {group.name}</Label>
                        </div>
                    ))}
               </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendAviso} className="flex-1" disabled={isSending}>
              {isSending ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
              {isSending ? "Enviando..." : "Enviar Aviso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    