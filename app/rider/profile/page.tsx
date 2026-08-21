import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { Card } from "@/components/ui";
import { riderNav } from "@/lib/portal-nav";
import { createClient } from "@/lib/supabase/server";
import type { Rider } from "@/lib/riders";
import { average } from "@/lib/reviews";

export const metadata = { title: "Rider profile" };

const statusTone: Record<string, string> = {
  PENDING: "bg-warn-light text-warn",
  VERIFIED: "bg-brand-light text-ink",
  REJECTED: "bg-surface-muted text-muted-foreground",
  SUSPENDED: "bg-warn-light text-warn",
};

export default async function RiderProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rider } = user
    ? await supabase.from("riders").select("*").eq("user_id", user.id).maybeSingle<Rider>()
    : { data: null };

  let ratingLabel = "No ratings yet";
  if (rider) {
    const { data: riderReviews } = await supabase
      .from("reviews")
      .select("rider_rating")
      .eq("rider_id", rider.id)
      .not("rider_rating", "is", null);
    const ratings = (riderReviews ?? []).map((r) => r.rider_rating as number);
    const avg = average(ratings);
    if (avg !== null) ratingLabel = `${avg.toFixed(1)} ★ (${ratings.length} review${ratings.length === 1 ? "" : "s"})`;
  }

  return (
    <PortalShell
      navItems={riderNav}
      portalLabel="Rider"
      title="Rider profile"
      description="Your WeeGive rider application and verification status."
    >
      {!rider ? (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-foreground">You haven&apos;t applied as a rider yet.</p>
          <Link
            href="/become-a-rider"
            className="label-caps w-fit border border-ink bg-ink px-5 py-2.5 text-xs font-semibold text-surface transition-colors hover:bg-transparent hover:text-ink"
          >
            Apply now
          </Link>
        </Card>
      ) : (
        <Card>
          <h3 className="text-sm font-semibold text-foreground">Application details</h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-foreground/80">Status</span>
              <span className={`label-caps px-2.5 py-1 text-[11px] font-semibold ${statusTone[rider.status]}`}>
                {rider.status}
              </span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-foreground/80">Vehicle type</span>
              <span className="text-foreground">{rider.vehicle_type}</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-foreground/80">Country</span>
              <span className="text-foreground">{rider.country}</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-foreground/80">Applied</span>
              <span className="text-foreground">{new Date(rider.created_at).toLocaleDateString()}</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-foreground/80">Documents</span>
              <span className="text-foreground">
                {rider.id_photo_path ? "ID uploaded" : "No ID uploaded"} · {rider.vehicle_photo_paths.length} vehicle photo
                {rider.vehicle_photo_paths.length === 1 ? "" : "s"}
              </span>
            </li>
            <li className="flex items-center justify-between last:border-none">
              <span className="text-foreground/80">Rating</span>
              <span className="text-foreground">{ratingLabel}</span>
            </li>
          </ul>
        </Card>
      )}
    </PortalShell>
  );
}
