import { PortalShell } from "@/components/portal-shell";
import { StatCard, ListRow } from "@/components/portal-widgets";
import { Card } from "@/components/ui";
import { adminNav } from "@/lib/portal-nav";
import {
  adminGiveawayQueue,
  adminDeliveries,
  adminBusinesses,
} from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { count: verifiedRiders } = await supabase
    .from("riders")
    .select("id", { count: "exact", head: true })
    .eq("status", "VERIFIED");

  const activeDeliveries = adminDeliveries.filter((d) => d.status !== "Delivered").length;
  const verifiedBusinesses = adminBusinesses.filter((b) => b.status === "Verified").length;

  return (
    <PortalShell
      navItems={adminNav}
      portalLabel="Admin"
      title="Platform overview"
      description="A snapshot of activity across WeeGive."
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Pending reviews" value={String(adminGiveawayQueue.length)} />
        <StatCard label="Active deliveries" value={String(activeDeliveries)} />
        <StatCard label="Verified riders" value={String(verifiedRiders ?? 0)} />
        <StatCard label="Verified businesses" value={String(verifiedBusinesses)} />
      </div>
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Listings awaiting review</h3>
        {adminGiveawayQueue.map((g) => (
          <ListRow key={g.id} title={g.title} subtitle={`${g.category} · ${g.giver}`} status={g.submitted} />
        ))}
      </Card>
    </PortalShell>
  );
}
