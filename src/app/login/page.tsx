
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserProfile } from "@/types";

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    // This effect handles the case where the user is already logged in
    // and lands on the login page. It will redirect them.
    if (!isUserLoading && user && firestore) {
        const checkUserProfile = async () => {
            const userDocRef = doc(firestore, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data()?.postalCode) {
                router.push("/");
            } else {
                router.push("/settings");
            }
        }
        checkUserProfile();
    }
  }, [user, isUserLoading, router, firestore]);

  const handleSignIn = async () => {
    if (auth && firestore) {
      try {
        const result = await signInWithPopup(auth, provider);
        const signedInUser = result.user;

        const userDocRef = doc(firestore, "users", signedInUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data()?.postalCode) {
          // User profile is complete, go to dashboard
          router.push("/");
        } else {
          // New user or incomplete profile, go to settings to complete it
          if (!userDocSnap.exists()) {
             // Create a basic profile if it doesn't exist
            const newUserProfile: UserProfile = {
              name: signedInUser.displayName || "",
              email: signedInUser.email || "",
              avatarUrl: signedInUser.photoURL || "",
              postalCode: "",
            };
            await setDoc(userDocRef, newUserProfile, { merge: true });
          }
          router.push("/settings");
        }
      } catch (error) {
        console.error("Error during sign-in or profile check:", error);
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
