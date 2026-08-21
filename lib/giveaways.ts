import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/lib/categories";
import type { CountryCode } from "@/lib/location";

export type GiveawayStatus = "AVAILABLE" | "RESERVED" | "CLAIMED" | "COMPLETED" | "REMOVED";

export type Giveaway = {
  id: string;
  giver_id: string;
  title: string;
  category: Category;
  subcategory: string;
  condition: string;
  category_fields: Record<string, string>;
  covers_delivery: boolean;
  return_line1: string;
  return_line2: string | null;
  return_city: string;
  return_region: string;
  return_postcode: string;
  country: CountryCode;
  status: GiveawayStatus;
  created_at: string;
  updated_at: string;
};

export type ClaimStatus = "RESERVED" | "EXPIRED" | "CANCELLED" | "COMPLETED";

export type Claim = {
  id: string;
  giveaway_id: string;
  claimant_id: string;
  status: ClaimStatus;
  reserved_until: string;
  created_at: string;
};

export const categoryEmoji: Record<Category, string> = {
  Furniture: "🛋️",
  Electronics: "💻",
  Food: "🍚",
  Clothing: "👕",
  Household: "🍳",
};

/**
 * Give-to-claim reciprocity: the first claim is free, then every give
 * unlocks CLAIMS_PER_GIVE more claims, repeating indefinitely (claim 1,
 * give 1, claim 2 more, give 1, claim 2 more, ...).
 */
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
