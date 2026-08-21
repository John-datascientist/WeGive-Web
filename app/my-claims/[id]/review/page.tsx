"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Eyebrow, ButtonLink } from "@/components/ui";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/client";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={`text-2xl transition-colors ${n <= value ? "text-btn-amber" : "text-border-strong"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

type ClaimInfo = {
  status: string;
  rider_id: string | null;
  giveaway_id: string;
  giveaways: { title: string } | null;
};

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const claimId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimInfo | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const [productRating, setProductRating] = useState(0);
  const [productReview, setProductReview] = useState("");
  const [riderRating, setRiderRating] = useState(0);
  const [riderReview, setRiderReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }

      const { data: claimData } = await supabase
        .from("claims")
        .select("status, rider_id, giveaway_id, giveaways(title)")
        .eq("id", claimId)
        .eq("claimant_id", user.id)
        .maybeSingle<ClaimInfo>();

      if (!claimData) {
        setError("Claim not found.");
        setLoading(false);
        return;
      }

      if (claimData.status !== "COMPLETED") {
        setError("Mark this item as received before leaving a review.");
        setLoading(false);
        return;
      }

      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("claim_id", claimId)
        .maybeSingle();

      setClaim(claimData);
      setAlreadyReviewed(!!existingReview);
      setLoading(false);
    }
    load();
  }, [claimId]);

  async function handleSubmit() {
    if (!claim || productRating === 0) {
      setError("Give the item a star rating.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("reviews").insert({
      claim_id: claimId,
      reviewer_id: user!.id,
      giveaway_id: claim.giveaway_id,
      rider_id: claim.rider_id,
      product_rating: productRating,
      product_review: productReview.trim() || null,
      rider_rating: claim.rider_id && riderRating > 0 ? riderRating : null,
      rider_review: claim.rider_id && riderReview.trim() ? riderReview.trim() : null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="container-page flex justify-center py-14 sm:py-20">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error && !claim) {
    return (
      <div className="container-page flex flex-col items-center py-14 sm:py-20">
        <div className="mb-6 w-full max-w-lg">
          <BackButton />
        </div>
        <Card className="w-full max-w-lg text-center">
          <p className="text-sm text-warn">{error}</p>
          <ButtonLink href="/my-claims" variant="secondary" className="mt-6 w-full">
            Back to my claims
          </ButtonLink>
        </Card>
      </div>
    );
  }

  if (alreadyReviewed || submitted) {
    return (
      <div className="container-page flex flex-col items-center py-14 sm:py-20">
        <Card className="w-full max-w-lg border-border-strong bg-brand-light/60 text-center">
          <p className="text-3xl">⭐</p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-ink">Thanks for the review</h1>
          <ButtonLink href="/my-claims" variant="primary" className="mt-6 w-full">
            Back to my claims
          </ButtonLink>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col items-center py-14 sm:py-20">
      <div className="w-full max-w-lg">
        <BackButton className="mb-6" />
        <Eyebrow>Review</Eyebrow>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground">
          {claim?.giveaways?.title ?? "Leave a review"}
        </h1>

        <Card className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="label-caps text-xs font-semibold text-foreground">
              Rate the item <span className="text-accent-dark">*</span>
            </span>
            <StarPicker value={productRating} onChange={setProductRating} />
            <textarea
              value={productReview}
              onChange={(e) => setProductReview(e.target.value)}
              rows={3}
              placeholder="What was it like? (optional)"
              className="border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </div>

          {claim?.rider_id ? (
            <div className="flex flex-col gap-2 border-t border-border pt-5">
              <span className="label-caps text-xs font-semibold text-foreground">Rate your delivery rider</span>
              <StarPicker value={riderRating} onChange={setRiderRating} />
              <textarea
                value={riderReview}
                onChange={(e) => setRiderReview(e.target.value)}
                rows={3}
                placeholder="How was the delivery? (optional)"
                className="border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </div>
          ) : (
            <p className="border-t border-border pt-5 text-xs text-muted-foreground">
              No rider is on record for this delivery yet, so there&apos;s nothing to rate there.
            </p>
          )}

          {error && (
            <p className="border border-warn bg-warn-light px-3 py-2.5 text-sm text-warn">{error}</p>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="label-caps self-start border border-ink bg-ink px-5 py-3.5 text-xs font-semibold text-surface transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </Card>
      </div>
    </div>
  );
}
