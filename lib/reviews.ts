export type Review = {
  id: string;
  claim_id: string;
  reviewer_id: string;
  giveaway_id: string;
  rider_id: string | null;
  product_rating: number;
  product_review: string | null;
  rider_rating: number | null;
  rider_review: string | null;
  created_at: string;
};

export function average(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}
