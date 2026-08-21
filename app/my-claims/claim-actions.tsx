"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClaimActions({
  claimId,
  giveawayId,
  status,
  hasReview,
}: {
  claimId: string;
  giveawayId: string;
  status: string;
  hasReview: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function markReceived() {
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("claims").update({ status: "COMPLETED" }).eq("id", claimId).eq("status", "DELIVERY_PENDING");
    setSubmitting(false);
    router.refresh();
  }

  if (status === "COMPLETED") {
    return hasReview ? (
      <span className="label-caps text-[11px] font-semibold text-muted-foreground">Reviewed</span>
    ) : (
      <Link
        href={`/my-claims/${claimId}/review`}
        className="label-caps text-[11px] font-semibold text-ink underline decoration-1 underline-offset-4"
      >
        Leave a review
      </Link>
    );
  }

  if (status === "DELIVERY_PENDING") {
    return (
      <button
        type="button"
        disabled={submitting}
        onClick={markReceived}
        className="label-caps border border-ink bg-ink px-3 py-1 text-[11px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60"
      >
        {submitting ? "Marking…" : "Mark as received"}
      </button>
    );
  }

  if (status === "RESERVED") {
    return (
      <Link
        href={`/giveaway/${giveawayId}/delivery`}
        className="label-caps text-[11px] font-semibold text-ink underline decoration-1 underline-offset-4"
      >
        Arrange delivery
      </Link>
    );
  }

  return null;
}
