"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink, Card } from "@/components/ui";
import { vehicleTypes, RIDER_DOCUMENTS_BUCKET, type Rider, type VehicleType } from "@/lib/riders";
import { createClient } from "@/lib/supabase/client";
import type { CountryCode } from "@/lib/location";

const MAX_VEHICLE_PHOTOS = 4;

export function BecomeARiderForm({ country }: { country: CountryCode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingRider, setExistingRider] = useState<Rider | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>("Motorcycle");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const vehicleInputRef = useRef<HTMLInputElement>(null);

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

  function addVehiclePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setVehiclePhotos((prev) => [...prev, ...selected].slice(0, MAX_VEHICLE_PHOTOS));
    e.target.value = "";
  }

  function removeVehiclePhoto(index: number) {
    setVehiclePhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleApply() {
    if (!userId) {
      setError("You must be signed in to apply.");
      return;
    }
    if (!idPhoto) {
      setError("Upload a photo of your ID.");
      return;
    }
    if (vehiclePhotos.length === 0) {
      setError("Upload at least one photo of your vehicle.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const supabase = createClient();

    try {
      const idExt = idPhoto.name.split(".").pop() ?? "jpg";
      const idPath = `${userId}/id-${Date.now()}.${idExt}`;
      const { error: idUploadError } = await supabase.storage
        .from(RIDER_DOCUMENTS_BUCKET)
        .upload(idPath, idPhoto);
      if (idUploadError) throw idUploadError;

      const vehiclePaths: string[] = [];
      for (const [i, photo] of vehiclePhotos.entries()) {
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `${userId}/vehicle-${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(RIDER_DOCUMENTS_BUCKET)
          .upload(path, photo);
        if (uploadError) throw uploadError;
        vehiclePaths.push(path);
      }

      const { data, error: insertError } = await supabase
        .from("riders")
        .insert({
          user_id: userId,
          vehicle_type: vehicleType,
          country,
          id_photo_path: idPath,
          vehicle_photo_paths: vehiclePaths,
        })
        .select("*")
        .single<Rider>();

      if (insertError) throw insertError;
      setExistingRider(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your application.");
    } finally {
      setSubmitting(false);
    }
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
      PENDING: "Your application, ID and vehicle photos are under review. We'll notify you once it's been checked.",
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
    <Card className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-1.5">
        <span className="label-caps text-xs font-semibold text-foreground">
          Photo of your ID <span className="text-accent-dark">*</span>
        </span>
        {idPhoto ? (
          <div className="flex items-center justify-between border border-border-strong bg-surface-muted px-3 py-2.5 text-sm">
            <span className="truncate text-foreground/80">{idPhoto.name}</span>
            <button
              type="button"
              onClick={() => setIdPhoto(null)}
              className="label-caps shrink-0 text-xs font-semibold text-warn"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => idInputRef.current?.click()}
            className="flex h-16 items-center justify-center border border-dashed border-border-strong text-sm text-muted-foreground transition-colors hover:bg-surface-muted"
          >
            Click to upload a photo of a valid ID
          </button>
        )}
        <input
          ref={idInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setIdPhoto(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-caps text-xs font-semibold text-foreground">
          Photos of your vehicle <span className="text-accent-dark">*</span>{" "}
          <span className="font-normal normal-case text-muted-foreground">
            ({vehiclePhotos.length}/{MAX_VEHICLE_PHOTOS})
          </span>
        </span>
        <p className="text-xs text-muted-foreground">
          Front, side, and the plate/registration number, so we can confirm the vehicle&apos;s condition and identity.
        </p>
        {vehiclePhotos.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {vehiclePhotos.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between border border-border-strong bg-surface-muted px-3 py-2 text-sm"
              >
                <span className="truncate text-foreground/80">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeVehiclePhoto(i)}
                  className="label-caps shrink-0 text-xs font-semibold text-warn"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {vehiclePhotos.length < MAX_VEHICLE_PHOTOS && (
          <button
            type="button"
            onClick={() => vehicleInputRef.current?.click()}
            className="flex h-16 items-center justify-center border border-dashed border-border-strong text-sm text-muted-foreground transition-colors hover:bg-surface-muted"
          >
            Click to upload vehicle photos (up to {MAX_VEHICLE_PHOTOS})
          </button>
        )}
        <input
          ref={vehicleInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={addVehiclePhotos}
          className="hidden"
        />
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
        {submitting ? "Uploading & submitting…" : "Submit application"}
      </button>
    </Card>
  );
}
