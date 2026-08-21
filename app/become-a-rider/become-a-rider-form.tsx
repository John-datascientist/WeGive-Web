"use client";

import { useEffect, useState } from "react";
import { ButtonLink, Card } from "@/components/ui";
import { vehicleTypes, type Rider, type VehicleType } from "@/lib/riders";
import { createClient } from "@/lib/supabase/client";
import type { CountryCode } from "@/lib/location";

export function BecomeARiderForm({ country }: { country: CountryCode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingRider, setExistingRider] = useState<Rider | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("Motorcycle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        const { data } = await supabase
          .from("riders")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle<Rider>();
        setExistingRider(data);
      }
      setLoading(false);
    });
  }, []);

  async function handleApply() {
    if (!userId) {
      setError("You must be signed in to apply.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("riders")
      .insert({ user_id: userId, vehicle_type: vehicleType, country })
      .select("*")
      .single<Rider>();

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setExistingRider(data);
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card className="flex flex-col items-start gap-4 border-border-strong bg-brand-light/60 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">Sign in first to apply as a rider.</p>
        <ButtonLink href="/login?next=/become-a-rider" variant="primary" className="w-full shrink-0 sm:w-auto">
          Log in
        </ButtonLink>
      </Card>
    );
  }

  if (existingRider) {
    const statusCopy: Record<string, string> = {
      PENDING: "Your application is under review. We'll notify you once it's been checked.",
      VERIFIED: "You're verified! Deliveries will start showing up in your rider dashboard.",
      REJECTED: "Your application wasn't approved. Contact us if you'd like to know why.",
      SUSPENDED: "Your rider account is currently suspended. Contact us for details.",
    };
    return (
      <Card className="flex flex-col gap-2 border-border-strong bg-brand-light/60">
        <h3 className="text-sm font-semibold text-ink">
          Application status: {existingRider.status}
        </h3>
        <p className="text-sm text-ink/80">{statusCopy[existingRider.status]}</p>
        {existingRider.status === "VERIFIED" && (
          <ButtonLink href="/rider/dashboard" variant="primary" className="mt-2 w-fit">
            Go to rider dashboard
          </ButtonLink>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">Apply to become a rider</h3>
      <div className="flex flex-col gap-1.5">
        <span className="label-caps text-xs font-semibold text-foreground">Vehicle type</span>
        <div className="flex flex-wrap gap-2">
          {vehicleTypes.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setVehicleType(v)}
              className={`label-caps border px-4 py-1.5 text-xs font-semibold transition-colors ${
                vehicleType === v
                  ? "border-ink bg-ink text-surface"
                  : "border-border-strong bg-surface text-foreground/70 hover:bg-surface-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="border border-warn bg-warn-light px-3 py-2.5 text-sm text-warn">{error}</p>
      )}
      <button
        type="button"
        disabled={submitting}
        onClick={handleApply}
        className="label-caps self-start border border-ink bg-ink px-5 py-3.5 text-xs font-semibold text-surface transition-colors hover:bg-transparent hover:text-ink disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit application"}
      </button>
    </Card>
  );
}
