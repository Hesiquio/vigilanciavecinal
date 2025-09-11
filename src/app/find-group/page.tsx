import { AppShell } from "@/components/AppShell";
import { FindGroupForm } from "@/components/find-group/FindGroupForm";
import { assignEmergencyGroup } from '@/ai/flows/emergency-group-assignment';

export default function FindGroupPage() {
  // Server action to be called from the client component
  async function handleFindGroup(address: string) {
    "use server";
    try {
      const result = await assignEmergencyGroup({ address });
      if (!result.groupName || result.groupName.includes("cannot determine")) {
        return { error: "No pudimos encontrar un grupo para esa dirección. Por favor, verifica los datos." };
      }
      return { data: result };
    } catch (e) {
      console.error(e);
      return { error: "Ocurrió un error al procesar tu solicitud." };
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <FindGroupForm onFindGroup={handleFindGroup} />
      </div>
    </AppShell>
  );
}
