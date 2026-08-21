"use client";

import { useState } from "react";
import { PaymentPanel } from "@/components/payment-panel";
import { ShareSponsorLink } from "@/components/share-sponsor-link";
import { AddressFields, type ProfileAddress } from "@/components/address-fields";
import { formatCurrency, type CountryCode } from "@/lib/location";
import { createClient } from "@/lib/supabase/client";

export function DeliveryFlow({
  giveawayId,
  country,
  coversDelivery,
  profileAddress,
  total,
  youPay,
}: {
  giveawayId: string;
  country: CountryCode;
  coversDelivery: boolean;
  profileAddress: ProfileAddress | null;
  total: number;
  youPay: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function markDeliveryPending() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("claims")
      .update({ status: "DELIVERY_PENDING" })
      .eq("giveaway_id", giveawayId)
      .eq("claimant_id", user.id)
      .eq("status", "RESERVED");
  }

  async function confirmFreeDelivery() {
    setConfirming(true);
    await markDeliveryPending();
    setConfirming(false);
    setConfirmed(true);
  }

  return (
    <>
      <div className="mt-6">
        <AddressFields
          country={country}
          idPrefix="delivery"
          heading="Delivery address"
          helperText="Where should this be delivered? Your exact address is shared only with the assigned rider, once delivery is confirmed."
          profileAddress={profileAddress}
        />
      </div>

      {coversDelivery ? (
        confirmed ? (
          <div className="mt-6 border border-border-strong bg-brand-light/60 p-6 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-3 text-sm font-semibold text-ink">Delivery confirmed</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Go to My claims and mark it as received once it arrives.
            </p>
          </div>
        ) : (
          <div className="mt-6 border border-border-strong bg-brand-light/60 p-6 text-center">
            <p className="text-3xl">🚚</p>
            <p className="mt-3 text-sm font-semibold text-ink">
              Delivery is free: covered by the giver
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The giver committed to covering delivery when they listed this
              item. We&apos;ll charge them {formatCurrency(total, country)} now that the
              fee is calculated. You pay nothing.
            </p>
            <button
              type="button"
              disabled={confirming}
              onClick={confirmFreeDelivery}
              className="label-caps mt-4 w-full border border-ink bg-ink px-5 py-3 text-xs font-semibold text-surface transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60"
            >
              {confirming ? "Confirming…" : "Confirm delivery address"}
            </button>
          </div>
        )
      ) : (
        <>
          <div className="mt-6">
            <PaymentPanel
              amount={youPay}
              actionLabel="Pay"
              continueHref="/my-claims"
              continueLabel="Go to my claims"
              country={country}
              onPaid={markDeliveryPending}
            />
          </div>
          <p className="mt-6 text-center text-xs font-semibold text-muted-foreground">or</p>
          <div className="mt-3">
            <ShareSponsorLink giveawayId={giveawayId} />
          </div>
        </>
      )}
    </>
  );
}
