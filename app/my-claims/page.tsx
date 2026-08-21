import { PortalShell } from "@/components/portal-shell";
import { ListRow, EmptyState } from "@/components/portal-widgets";
import { Card, ButtonLink } from "@/components/ui";
import { userNav } from "@/lib/portal-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My claims" };

type ClaimWithGiveaway = {
  id: string;
  status: string;
  reserved_until: string;
  giveaways: { title: string; return_city: string; return_region: string } | null;
};

export default async function MyClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("claims")
        .select("id, status, reserved_until, giveaways(title, return_city, return_region)")
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
      description="Items you've claimed. A claim reserves an item for you while delivery is arranged."
    >
      {claims.length === 0 ? (
        <EmptyState
          title="No claims yet"
          description="When you claim an item someone's giving away, it'll show up here."
          action={<ButtonLink href="/browse">Browse giveaways</ButtonLink>}
        />
      ) : (
        <Card>
          {claims.map((c) => (
            <ListRow
              key={c.id}
              title={c.giveaways?.title ?? "Giveaway"}
              subtitle={`From ${c.giveaways?.return_city ?? "?"}, ${c.giveaways?.return_region ?? "?"}`}
              status={c.status}
            />
          ))}
        </Card>
      )}
    </PortalShell>
  );
}
