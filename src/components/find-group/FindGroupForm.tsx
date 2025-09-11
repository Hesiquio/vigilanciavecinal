"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck, Phone, Info } from "lucide-react";
import type { EmergencyGroupOutput } from "@/ai/flows/emergency-group-assignment";

type FindGroupResult = {
  data?: EmergencyGroupOutput;
  error?: string;
}

type FindGroupFormProps = {
  onFindGroup: (address: string) => Promise<FindGroupResult>;
};

export function FindGroupForm({ onFindGroup }: FindGroupFormProps) {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmergencyGroupOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    const { data, error } = await onFindGroup(address);
    if (data) {
      setResult(data);
    } else if (error) {
      setError(error);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Encuentra tu Grupo Vecinal</CardTitle>
            <CardDescription>
              Ingresa tu dirección para asignarte al grupo de vigilancia de tu
              colonia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección Completa</Label>
              <Input
                id="address"
                placeholder="Calle, Número, Colonia, Ciudad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !address}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar Grupo
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
            <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="mt-6 animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck />
              ¡Grupo Encontrado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre del Grupo</Label>
              <p className="font-semibold text-lg">{result.groupName}</p>
            </div>
            <div>
              <Label>Contacto del Grupo</Label>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {result.contactInformation}
              </p>
            </div>
            <Button className="w-full">Unirse al Grupo</Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
