
"use client";

import { useState, useEffect, ReactElement, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Siren, Mic, Video, MapPin, Send, MessageCircle, ShieldAlert, Users, Heart, Loader, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { useFirebase, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import type { UserProfile, UserGroup, SosAlert as SosAlertType } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type SosModalProps = {
    user: User;
    trigger: ReactElement;
}

const alertCategories = [
    "Robo",
    "Accidentes",
    "Desastres Naturales",
    "Personas Sospechosas",
]

const BASE_AUDIENCES = ["neighbors", "family"];

export function SosModal({ user, trigger }: SosModalProps) {
  const { firestore } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Ubicación no disponible");
  const [audience, setAudience] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);


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


  // Get location when modal opens, but not camera
  useEffect(() => {
    if (isOpen) {
      setLocation("Obteniendo ubicación...");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          },
          () => {
            setLocation("No se pudo obtener la ubicación.");
            toast({
                title: "Error de Ubicación",
                description: "No se pudo obtener la ubicación. Por favor, ingrésala manually.",
                variant: "destructive"
            })
          }
        );
      } else {
        setLocation("Geolocalización no soportada.");
      }
    } else {
        // Cleanup when modal closes
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setHasCameraPermission(null);
        setIsRecording(false);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  
  const handleAudienceChange = (checked: boolean, value: string) => {
    setAudience(prev => 
        checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  }
  
  const handleSelectAll = () => {
    const allGroupIds = userGroups?.map(g => g.id) || [];
    setAudience([...BASE_AUDIENCES, ...allGroupIds]);
  }
  
  const handleEnableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acceso a Cámara Denegado',
          description: 'Habilita los permisos de cámara en tu navegador para adjuntar video.',
        });
      }
  }


  const postMessageToChats = async (alertId: string, alertMessage: string, alertCategory: string) => {
      if (!firestore) return;

      const chatMessage = {
          text: `**ALERTA: ${alertCategory.toUpperCase()}**\n${alertMessage}`,
          userId: 'system', // Special ID for system messages
          userName: 'Sistema de Alertas',
          userAvatarUrl: '', // No avatar for system
          timestamp: serverTimestamp(),
          alertId: alertId,
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

  const handleSendSos = async () => {
    if (isSending) return;

    if (!category) {
        toast({ title: "Categoría Requerida", description: "Por favor, selecciona una categoría para la alerta.", variant: "destructive" });
        return;
    }
     if (message.trim() === "") {
        toast({ title: "Mensaje Requerido", description: "Por favor, describe la emergencia.", variant: "destructive" });
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
    
    setIsSending(true);

    try {
        const alertsCollection = collection(firestore, 'sos-alerts');
        const newAlertData: Omit<SosAlertType, 'id' | 'timestamp'> & { timestamp: any } = {
            userId: user.uid,
            userName: user.displayName || "Usuario Anónimo",
            userAvatarUrl: user.photoURL || "",
            message,
            location,
            category: category as SosAlertType['category'],
            audience,
            timestamp: serverTimestamp(),
            // videoUrl will be added later when we implement video upload
        };

        // Create the alert document
        const alertDocRef = await addDoc(alertsCollection, newAlertData);
        
        // Post a corresponding message to the selected chats
        await postMessageToChats(alertDocRef.id, message, category);

        toast({
            title: "¡Alerta de Auxilio Enviada!",
            description: "Los grupos seleccionados han sido notificados en sus respectivos chats.",
        });
        
        // Reset form
        setIsOpen(false);
        setMessage("");
        setCategory("");
        setAudience([]);

    } catch (error) {
        console.error("Error sending SOS:", error);
        toast({ title: "Error", description: "No se pudo enviar la alerta.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };
  
  const handleToggleRecording = () => {
      if (!hasCameraPermission) {
          toast({ variant: "destructive", title: "Cámara no disponible", description: "Primero debes habilitar la cámara." });
          return;
      }
      setIsRecording(prev => !prev);
  }
  
  const renderVideoButton = () => {
    if (hasCameraPermission === null) {
        return (
             <Button 
                variant="outline"
                className="flex items-center justify-center gap-2"
                onClick={handleEnableCamera}
               >
                  <Camera className="h-4 w-4" /> Habilitar Cámara
              </Button>
        )
    }
    if (hasCameraPermission === false) {
        return (
             <Button 
                variant="outline"
                className="flex items-center justify-center gap-2"
                disabled
               >
                  <Camera className="h-4 w-4" /> Cámara no disponible
              </Button>
        )
    }
    // Camera is enabled
    return (
        <Button 
            variant={isRecording ? "destructive" : "outline"} 
            className="flex items-center justify-center gap-2"
            onClick={handleToggleRecording}
            >
            <Video className="h-4 w-4" /> {isRecording ? "Detener Grabación" : "Grabar Video"}
        </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-headline text-destructive">
            <Siren className="h-6 w-6" />
            Reportar Incidencia
          </DialogTitle>
          <DialogDescription>
            Tu ubicación actual será compartida con los grupos que selecciones. Describe la emergencia para que sea validada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="relative">
              <ShieldAlert className="absolute top-3 left-3 h-4 w-4 text-primary" />
               <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Selecciona una categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                      {alertCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
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
                              id="audience-neighbors" 
                              checked={audience.includes('neighbors')} 
                              onCheckedChange={(checked) => handleAudienceChange(!!checked, 'neighbors')} 
                          />
                          <Label htmlFor="audience-neighbors" className="flex items-center gap-2 text-sm font-normal"><ShieldAlert className="h-4 w-4"/> Vecinos</Label>
                      </div>
                       <div className="flex items-center gap-2 rounded-md border p-3">
                          <Checkbox 
                              id="audience-family" 
                              checked={audience.includes('family')} 
                              onCheckedChange={(checked) => handleAudienceChange(!!checked, 'family')} 
                          />
                          <Label htmlFor="audience-family" className="flex items-center gap-2 text-sm font-normal"><Heart className="h-4 w-4"/> Familia</Label>
                      </div>
                  </div>
                  {isLoadingGroups && <p className="text-xs text-muted-foreground">Cargando grupos...</p>}
                  {userGroups && userGroups.map(group => (
                       <div key={group.id} className="flex items-center gap-2 rounded-md border p-3">
                          <Checkbox 
                              id={`audience-${group.id}`}
                              checked={audience.includes(group.id)} 
                              onCheckedChange={(checked) => handleAudienceChange(!!checked, group.id)} 
                          />
                          <Label htmlFor={`audience-${group.id}`} className="flex items-center gap-2 text-sm font-normal"><Users className="h-4 w-4"/> {group.name}</Label>
                      </div>
                  ))}
             </div>
          </div>
          <div className="relative">
              <MapPin className="absolute top-3 left-3 h-4 w-4 text-primary" />
              <Input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Escribe la ubicación..."
                  className="pl-9"
              />
          </div>
          <div className="relative">
            <Textarea
              placeholder="Describe la incidencia (ej. persona sospechosa, vehículo desconocido, etc.)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] pr-10"
            />
            <MessageCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground" />
          </div>

           {/* Video Section */}
            <div className="space-y-2">
                 <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Acceso a Cámara Denegado</AlertTitle>
                        <AlertDescription>
                            No se puede usar la función de video sin acceso a la cámara.
                        </AlertDescription>
                    </Alert>
                 )}
            </div>

          <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="flex items-center justify-center gap-2" disabled>
                  <Mic className="h-4 w-4" /> Grabar Audio
              </Button>
             {renderVideoButton()}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleSendSos} className="flex-1" disabled={isSending}>
            {isSending ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
            {isSending ? "Enviando..." : "Enviar Alerta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
