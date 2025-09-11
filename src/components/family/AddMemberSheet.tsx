"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function AddMemberSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Agregar Miembro Familiar</SheetTitle>
          <SheetDescription>
            Ingresa los detalles de la persona que quieres monitorear. Se enviará una invitación para que acepten.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input id="name" value="Mateo" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Teléfono
            </Label>
            <Input id="phone" type="tel" placeholder="+52 55 1234 5678" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit" className="w-full">Enviar Invitación</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
