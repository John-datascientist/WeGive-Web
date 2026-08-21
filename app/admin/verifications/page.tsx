import { PortalShell } from "@/components/portal-shell";
import { SimpleTable, StatusBadge } from "@/components/portal-widgets";
import { adminNav } from "@/lib/portal-nav";
import { adminBusinesses } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Rider } from "@/lib/riders";

export const metadata = { title: "Admin · Verifications" };

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("riders")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });
  const pendingRiders = (data ?? []) as Rider[];
  const pendingBusinesses = adminBusinesses.filter((b) => b.status === "Pending review");

  return (
    <PortalShell
      navItems={adminNav}
      portalLabel="Admin"
      title="Verifications"
      description="Recipient, rider and business verification requests awaiting review."
    >
      <h3 className="text-sm font-semibold text-foreground">Riders</h3>
      {pendingRiders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending rider applications.</p>
      ) : (
        <SimpleTable
          columns={["Rider", "Vehicle", "Status"]}
          rows={pendingRiders.map((r) => [
            r.user_id.slice(0, 8),
            r.vehicle_type,
            <StatusBadge key="s" label="Pending" tone="warning" />,
          ])}
        />
      )}
      <h3 className="text-sm font-semibold text-foreground">Businesses</h3>
      <SimpleTable
        columns={["Business", "Submitted", "Status"]}
        rows={pendingBusinesses.map((b) => [b.name, b.submitted, <StatusBadge key="s" label="Pending review" tone="warning" />])}
      />
    </PortalShell>
  );
}
