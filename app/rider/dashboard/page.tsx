import { PortalShell } from "@/components/portal-shell";
import { StatCard, ListRow } from "@/components/portal-widgets";
import { Card } from "@/components/ui";
import { riderNav } from "@/lib/portal-nav";
import { riderDeliveries } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { average } from "@/lib/reviews";

export const metadata = { title: "Rider dashboard" };

export default async function RiderDashboardPage() {
  const active = riderDeliveries.filter((d) => d.status !== "Completed");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ratingLabel = "No ratings yet";
  if (user) {
    const { data: rider } = await supabase.from("riders").select("id").eq("user_id", user.id).maybeSingle();
    if (rider) {
      const { data: riderReviews } = await supabase
        .from("reviews")
        .select("rider_rating")
        .eq("rider_id", rider.id)
        .not("rider_rating", "is", null);
      const ratings = (riderReviews ?? []).map((r) => r.rider_rating as number);
      const avg = average(ratings);
      if (avg !== null) ratingLabel = `${avg.toFixed(1)} (${ratings.length})`;
    }
  }

  return (
    <PortalShell
      navItems={riderNav}
      portalLabel="Rider"
      title="Rider dashboard"
      description="Your rider profile and delivery activity."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Deliveries today" value={String(active.length)} />
        <StatCard label="Deliveries this week" value={String(riderDeliveries.length)} />
        <StatCard label="Rating" value={ratingLabel} />
      </div>
      <Card>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Active deliveries</h3>
        {active.map((d) => (
          <ListRow
            key={d.id}
            title={d.itemTitle}
            subtitle={`${d.pickupArea} → ${d.dropoffArea}`}
            status={d.status}
          />
        ))}
      </Card>
    </PortalShell>
  );
}
