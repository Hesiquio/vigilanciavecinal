"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GoogleMap from "@/components/dashboard/GoogleMap";
import { useFirebase } from "@/firebase";

// Example coordinates for a neighborhood polygon
const neighborhoodPolygon = [
  { lat: 19.435, lng: -99.135 },
  { lat: 19.430, lng: -99.135 },
  { lat: 19.430, lng: -99.130 },
  { lat: 19.435, lng: -99.130 },
];

export default function SettingsPage() {
  const { user, isUserLoading, auth } = useFirebase();
  const router = useRouter();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapLoading(false);
        },
        () => {
          // Default to Mexico City on error
          setMapCenter({ lat: 19.4326, lng: -99.1332 });
          setMapLoading(false);
          console.error("Error getting user location.");
        }
      );
    } else {
      // Default to Mexico City if geolocation is not supported
      setMapCenter({ lat: 19.4326, lng: -99.1332 });
      setMapLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push("/login");
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <AppShell user={user} onSignOut={handleSignOut} />
    </div>
  );
}
