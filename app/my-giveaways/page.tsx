import { PortalShell } from "@/components/portal-shell";
import { ListRow, EmptyState } from "@/components/portal-widgets";
import { Card, ButtonLink } from "@/components/ui";
import { userNav } from "@/lib/portal-nav";
import { createClient } from "@/lib/supabase/server";
import type { Giveaway } from "@/lib/giveaways";

export const metadata = { title: "My giveaways" };

export default async function MyGiveawaysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("giveaways")
        .select("*")
        .eq("giver_id", user.id)
        .neq("status", "REMOVED")
        .order("created_at", { ascending: false })
    : { data: null };
  const giveaways = (data ?? []) as Giveaway[];

  const claimCounts = await Promise.all(
    giveaways.map((g) =>
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("giveaway_id", g.id)
    )
  );

  return (
    <PortalShell
      navItems={userNav}
      portalLabel="Your account"
      title="My giveaways"
      description="Items you've listed, from listing through to completed."
    >
      <div className="flex justify-end">
        <ButtonLink href="/giveaway/create">Create a giveaway</ButtonLink>
      </div>

      {giveaways.length === 0 ? (
        <EmptyState
          title="No giveaways yet"
          description="List something you no longer need and it'll show up here."
          action={<ButtonLink href="/giveaway/create">Create a giveaway</ButtonLink>}
        />
      ) : (
        <Card>
          {giveaways.map((g, i) => {
            const claims = claimCounts[i]?.count ?? 0;
            return (
              <ListRow
                key={g.id}
                title={g.title}
                subtitle={`${g.category} · ${claims} claim${claims === 1 ? "" : "s"} · listed ${new Date(g.created_at).toLocaleDateString()}`}
                status={g.status}
              />
            );
          })}
        </Card>
      )}
    </PortalShell>
  );
}
