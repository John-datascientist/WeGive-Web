import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/lib/categories";
import type { CountryCode } from "@/lib/countries";

export type GiveawayStatus = "AVAILABLE" | "RESERVED" | "CLAIMED" | "COMPLETED" | "REMOVED";

export type Giveaway = {
  id: string;
  giver_id: string;
  title: string;
  category: Category;
  subcategory: string;
  condition: string;
  covers_delivery: boolean;
  return_city: string;
  return_region: string;
  country: CountryCode;
  status: GiveawayStatus;
  created_at: string;
};

// Mirrors lib/giveaways.ts on the web: first claim is free, then every
// give unlocks 2 more claims, repeating.
const CLAIMS_PER_GIVE = 2;

export async function getReciprocityStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{ claimsMade: number; givesMade: number; canClaimMore: boolean }> {
  const [claimsResult, givesResult] = await Promise.all([
    supabase.from("claims").select("id", { count: "exact", head: true }).eq("claimant_id", userId),
    supabase.from("giveaways").select("id", { count: "exact", head: true }).eq("giver_id", userId).neq("status", "REMOVED"),
  ]);

  const claimsMade = claimsResult.count ?? 0;
  const givesMade = givesResult.count ?? 0;
  const claimsAllowed = 1 + givesMade * CLAIMS_PER_GIVE;

  return { claimsMade, givesMade, canClaimMore: claimsMade < claimsAllowed };
}
