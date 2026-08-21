"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Eyebrow, ButtonLink } from "@/components/ui";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/client";

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function ClaimPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [status, setStatus] = useState<"loading" | "reserved" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function reserve() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setError("You must be signed in to claim an item.");
          setStatus("error");
        }
        return;
      }

      // Idempotent: reuse an existing reservation for this item if one
      // already exists, instead of creating a duplicate on refresh.
      const { data: existingClaim } = await supabase
        .from("claims")
        .select("reserved_until")
        .eq("giveaway_id", id)
        .eq("claimant_id", user.id)
        .eq("status", "RESERVED")
        .maybeSingle();

      if (existingClaim) {
        if (!cancelled) {
          setReservedUntil(existingClaim.reserved_until);
          setStatus("reserved");
        }
        return;
      }

      const { data: giveaway } = await supabase
        .from("giveaways")
        .select("status, giver_id")
        .eq("id", id)
        .maybeSingle();

      if (!giveaway || giveaway.status !== "AVAILABLE") {
        if (!cancelled) {
          setError("This item is no longer available to claim.");
          setStatus("error");
        }
        return;
      }

      if (giveaway.giver_id === user.id) {
        if (!cancelled) {
          setError("You can't claim your own giveaway.");
          setStatus("error");
        }
        return;
      }

      const { data: claim, error: claimError } = await supabase
        .from("claims")
        .insert({ giveaway_id: id, claimant_id: user.id })
        .select("reserved_until")
        .single();

      if (claimError || !claim) {
        if (!cancelled) {
          setError(claimError?.message ?? "Couldn't reserve this item.");
          setStatus("error");
        }
        return;
      }

      await supabase.from("giveaways").update({ status: "RESERVED" }).eq("id", id).eq("status", "AVAILABLE");

      if (!cancelled) {
        setReservedUntil(claim.reserved_until);
        setStatus("reserved");
      }
    }

    reserve();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (status !== "reserved") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "loading") {
    return (
      <div className="container-page flex flex-col items-center py-14 sm:py-20">
        <div className="mb-6 w-full max-w-lg">
          <BackButton />
        </div>
        <Card className="w-full max-w-lg text-center">
          <p className="text-sm text-muted-foreground">Reserving this item…</p>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container-page flex flex-col items-center py-14 sm:py-20">
        <div className="mb-6 w-full max-w-lg">
          <BackButton />
        </div>
        <Card className="w-full max-w-lg text-center">
          <Eyebrow>Couldn&apos;t claim this item</Eyebrow>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
          <ButtonLink href="/browse" variant="secondary" className="mt-6 w-full">
            Back to browse
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const msRemaining = reservedUntil ? new Date(reservedUntil).getTime() - now : 0;

  return (
    <div className="container-page flex flex-col items-center py-14 sm:py-20">
      <div className="mb-6 w-full max-w-lg">
        <BackButton />
      </div>
      <Card className="w-full max-w-lg text-center">
        <Eyebrow>Reserved</Eyebrow>
        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-foreground">
          Reserved for you
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          If a delivery isn&apos;t requested and funded before the timer runs
          out, this item returns to Available so someone else can claim it.
        </p>
        <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-ink text-xl font-semibold text-ink">
          {formatCountdown(msRemaining)}
        </div>
        <ButtonLink href={`/giveaway/${id}/delivery`} variant="primary" className="mt-6 w-full">
          Arrange delivery
        </ButtonLink>
      </Card>
    </div>
  );
}
