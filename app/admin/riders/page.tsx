"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { SimpleTable, StatusBadge } from "@/components/portal-widgets";
import { adminNav } from "@/lib/portal-nav";
import { createClient } from "@/lib/supabase/client";
import { RIDER_DOCUMENTS_BUCKET, type Rider, type RiderStatus } from "@/lib/riders";

const tone: Record<RiderStatus, "brand" | "warning" | "neutral"> = {
  VERIFIED: "brand",
  PENDING: "warning",
  REJECTED: "neutral",
  SUSPENDED: "warning",
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("riders").select("*").order("created_at", { ascending: false });
      if (!cancelled) {
        setRiders((data ?? []) as Rider[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function setStatus(id: string, status: RiderStatus) {
    const supabase = createClient();
    await supabase.from("riders").update({ status }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function viewDocument(path: string) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from(RIDER_DOCUMENTS_BUCKET).createSignedUrl(path, 300);
    if (error || !data) {
      window.alert("Couldn't load that document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <PortalShell
      navItems={adminNav}
      portalLabel="Admin"
      title="Riders"
      description="WeeGive's own rider applications, pending manual verification. (Names/emails aren't shown here yet, real user profiles aren't wired up, only what riders submit is stored.)"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : riders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rider applications yet.</p>
      ) : (
        <SimpleTable
          columns={["Rider", "Vehicle", "Country", "Status", "Documents", "Actions"]}
          rows={riders.map((r) => [
            r.user_id.slice(0, 8),
            r.vehicle_type,
            r.country,
            <StatusBadge key="s" label={r.status} tone={tone[r.status]} />,
            <div key="docs" className="flex flex-col gap-1">
              {r.id_photo_path && (
                <button
                  onClick={() => viewDocument(r.id_photo_path!)}
                  className="label-caps text-left text-[11px] font-semibold text-ink underline decoration-1 underline-offset-4"
                >
                  View ID
                </button>
              )}
              {r.vehicle_photo_paths.map((path, i) => (
                <button
                  key={path}
                  onClick={() => viewDocument(path)}
                  className="label-caps text-left text-[11px] font-semibold text-ink underline decoration-1 underline-offset-4"
                >
                  Vehicle photo {i + 1}
                </button>
              ))}
              {!r.id_photo_path && r.vehicle_photo_paths.length === 0 && (
                <span className="text-xs text-muted-foreground">None uploaded</span>
              )}
            </div>,
            <div key="actions" className="flex gap-2">
              {r.status !== "VERIFIED" && (
                <button
                  onClick={() => setStatus(r.id, "VERIFIED")}
                  className="label-caps border border-ink bg-ink px-3 py-1 text-[11px] font-semibold text-surface hover:bg-transparent hover:text-ink"
                >
                  Verify
                </button>
              )}
              {r.status !== "REJECTED" && (
                <button
                  onClick={() => setStatus(r.id, "REJECTED")}
                  className="label-caps border border-border-strong px-3 py-1 text-[11px] font-semibold text-foreground/70 hover:border-red-400 hover:text-red-600"
                >
                  Reject
                </button>
              )}
            </div>,
          ])}
        />
      )}
    </PortalShell>
  );
}
