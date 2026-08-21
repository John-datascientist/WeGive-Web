import { notFound } from "next/navigation";
import { Card, Eyebrow, ButtonLink } from "@/components/ui";
import { BackButton } from "@/components/back-button";
import { FreeDeliveryBadge } from "@/components/free-delivery-badge";
import { ShareSponsorLink } from "@/components/share-sponsor-link";
import { categoryEmoji, getReciprocityStatus, type Giveaway } from "@/lib/giveaways";
import { createClient } from "@/lib/supabase/server";

const lifecycle = ["AVAILABLE", "RESERVED", "CLAIMED", "COMPLETED"];

export default async function GiveawayDetailPage({
  params,
}: PageProps<"/giveaway/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("giveaways")
    .select("*")
    .eq("id", id)
    .maybeSingle<Giveaway>();

  if (!item || item.status === "REMOVED") notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === item.giver_id;
  const canClaim = user ? (await getReciprocityStatus(supabase, user.id)).canClaimMore : true;

  return (
    <div className="container-page py-14 sm:py-20">
      <BackButton label="Back to browse" className="mb-6" />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className="flex h-72 items-center justify-center bg-brand-light text-7xl">
          {categoryEmoji[item.category]}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <Eyebrow>{item.category}</Eyebrow>
            {item.covers_delivery && <FreeDeliveryBadge />}
          </div>
          <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground">
            {item.title}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            {item.return_city}, {item.return_region}
          </p>
        </div>
        <Card>
          <h3 className="text-sm font-semibold text-foreground">Details</h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Condition</dt>
              <dd className="text-foreground">{item.condition}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground">{item.status}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-foreground">Lifecycle</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {lifecycle.map((stage) => (
              <span
                key={stage}
                className={`label-caps border px-3 py-1 text-[11px] font-semibold ${
                  stage === item.status
                    ? "border-ink bg-ink text-surface"
                    : "border-border bg-surface-muted text-muted-foreground"
                }`}
              >
                {stage}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {isOwner ? (
          <Card className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">This is your listing</h3>
            <p className="text-sm text-muted-foreground">
              You can&apos;t claim your own giveaway. Manage it from My giveaways.
            </p>
            <ButtonLink href="/my-giveaways" variant="secondary">
              Go to my giveaways
            </ButtonLink>
          </Card>
        ) : item.status !== "AVAILABLE" ? (
          <Card className="flex flex-col gap-2 border-border-strong bg-surface-muted">
            <h3 className="text-sm font-semibold text-foreground">No longer available</h3>
            <p className="text-sm text-muted-foreground">
              This item has already been claimed by someone else.
            </p>
          </Card>
        ) : canClaim ? (
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">
              Interested in this item?
            </h3>
            <p className="text-sm text-muted-foreground">
              Claiming reserves this item for a limited time while delivery
              is arranged. The exact pickup address is shared only once your
              claim is confirmed.
            </p>
            <ButtonLink href={`/giveaway/${item.id}/claim`} variant="primary">
              Claim this item
            </ButtonLink>
            {item.covers_delivery && (
              <p className="label-caps text-center text-[11px] font-semibold text-accent-dark">
                🚚 The giver is covering delivery: free for whoever claims this.
              </p>
            )}
          </Card>
        ) : (
          <Card className="flex flex-col gap-4 border-border-strong bg-warn-light/60">
            <h3 className="text-sm font-semibold text-ink">
              🔒 Give once to claim again
            </h3>
            <p className="text-sm text-ink/80">
              You&apos;ve used your first claim. List something you no
              longer need to unlock the ability to claim more, it keeps
              WeeGive a two-way exchange instead of a one-way stream.
            </p>
            <ButtonLink href="/giveaway/create" variant="primary">
              List a giveaway
            </ButtonLink>
          </Card>
        )}
        {!item.covers_delivery && <ShareSponsorLink giveawayId={item.id} />}
      </div>
      </div>
    </div>
  );
}
