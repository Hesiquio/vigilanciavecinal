"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    if (auth) {
      try {
        await signInWithPopup(auth, provider);
        router.push("/");
      } catch (error) {
        console.error("Error during sign-in:", error);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-16 w-16 text-primary"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Sistema de Vigilancia Vecinal
        </h1>
        <p className="text-lg text-muted-foreground">
          Únete a tu red de seguridad. Inicia sesión para continuar.
        </p>
        <Button
          onClick={handleSignIn}
          className="w-full"
          disabled={isUserLoading}
        >
           {isUserLoading ? "Cargando..." : "Iniciar Sesión con Google"}
        </Button>
      </div>
    </div>
  );
}
