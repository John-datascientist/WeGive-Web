import { PortalShell } from "@/components/portal-shell";
import { EmptyState } from "@/components/portal-widgets";
import { Card, ButtonLink } from "@/components/ui";
import { userNav } from "@/lib/portal-nav";
import { createClient } from "@/lib/supabase/server";
import { ClaimActions } from "./claim-actions";

export const metadata = { title: "My claims" };

type ClaimWithGiveaway = {
  id: string;
  giveaway_id: string;
  status: string;
  reserved_until: string;
  giveaways: { title: string; return_city: string; return_region: string } | null;
  reviews: { id: string }[] | null;
};

export default async function MyClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("claims")
        .select("id, giveaway_id, status, reserved_until, giveaways(title, return_city, return_region), reviews(id)")
        .eq("claimant_id", user.id)
        .order("created_at", { ascending: false })
        .returns<ClaimWithGiveaway[]>()
    : { data: null };
  const claims = data ?? [];

  return (
    <PortalShell
      navItems={userNav}
      portalLabel="Your account"
      title="My claims"
      description="Items you've claimed. Mark one as received once it arrives, then leave a review."
    >
      {claims.length === 0 ? (
        <EmptyState
          title="No claims yet"
          description="When you claim an item someone's giving away, it'll show up here."
          action={<ButtonLink href="/browse">Browse giveaways</ButtonLink>}
        />
      ) : (
        <Card className="divide-y divide-border p-0">
          {claims.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">{c.giveaways?.title ?? "Giveaway"}</p>
                <p className="text-xs text-muted-foreground">
                  From {c.giveaways?.return_city ?? "?"}, {c.giveaways?.return_region ?? "?"} · {c.status}
                </p>
              </div>
              <ClaimActions
                claimId={c.id}
                giveawayId={c.giveaway_id}
                status={c.status}
                hasReview={(c.reviews?.length ?? 0) > 0}
              />
            </div>
          ))}
        </Card>
      )}
    </PortalShell>
  );
}
