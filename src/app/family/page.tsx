import { AppShell } from "@/components/AppShell";
import { FamilyMemberList } from "@/components/family/FamilyMemberList";
import { AddMemberSheet } from "@/components/family/AddMemberSheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FamilyPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monitoreo Familiar</CardTitle>
              <CardDescription>
                Supervisa la ubicación de tus seres queridos.
              </CardDescription>
            </div>
            <AddMemberSheet />
          </CardHeader>
          <CardContent>
            <FamilyMemberList />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
