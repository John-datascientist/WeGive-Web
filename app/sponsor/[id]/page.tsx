import { notFound } from "next/navigation";
import { Card, Eyebrow } from "@/components/ui";
import { BackButton } from "@/components/back-button";
import { PaymentPanel } from "@/components/payment-panel";
import { estimateDeliveryFee, openSponsorships } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/location";
import { getSelectedCountry } from "@/lib/location-server";
import { createClient } from "@/lib/supabase/server";

export default async function SponsorCheckoutPage({
  params,
}: PageProps<"/sponsor/[id]">) {
  const { id } = await params;
  const country = await getSelectedCountry();
  const listed = openSponsorships.find((s) => s.id === id);

  let giveaway: { title: string; return_city: string; return_region: string } | null = null;
  if (!listed) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("giveaways")
      .select("title, return_city, return_region")
      .eq("id", id)
      .maybeSingle();
    giveaway = data;
  }

  if (!listed && !giveaway) notFound();

  // Anyone can be first to help: a giveaway with no sponsorship yet just
  // starts at ₦0 funded against an estimated fee (real distance-based
  // pricing isn't wired up yet, so this uses a placeholder distance).
  const sponsorship = listed ?? {
    id,
    itemTitle: giveaway!.title,
    recipientArea: `${giveaway!.return_city}, ${giveaway!.return_region}`,
    totalFee: estimateDeliveryFee(5),
    fundedAmount: 0,
  };

  const remaining = Math.max(0, sponsorship.totalFee - sponsorship.fundedAmount);
  const pct = Math.min(100, Math.round((sponsorship.fundedAmount / sponsorship.totalFee) * 100));

  return (
    <div className="container-page flex flex-col items-center py-14 sm:py-20">
      <div className="w-full max-w-lg">
        <BackButton className="mb-6" />
        <Eyebrow>Sponsor a delivery</Eyebrow>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground">
          {sponsorship.itemTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivering to {sponsorship.recipientArea}
        </p>

        <Card className="mt-6">
          <div className="h-1.5 w-full overflow-hidden bg-surface-muted">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {formatCurrency(sponsorship.fundedAmount, country)} of {formatCurrency(sponsorship.totalFee, country)}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border-strong pt-3 text-base font-semibold">
            <span className="text-foreground">You&apos;re covering</span>
            <span className="text-ink">{formatCurrency(remaining, country)}</span>
          </div>
        </Card>

        <div className="mt-6">
          <PaymentPanel
            amount={remaining}
            actionLabel="Sponsor"
            continueHref="/my-sponsorships"
            continueLabel="Go to my sponsorships"
            country={country}
          />
        </div>
      </div>
    </div>
  );
}
