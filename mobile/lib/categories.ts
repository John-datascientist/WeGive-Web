// Mirrors the web app's lib/categories.ts + the category emoji map from
// lib/giveaways.ts, so listings look the same across platforms.
export const categories = ["Furniture", "Electronics", "Food", "Clothing", "Household"] as const;
export type Category = (typeof categories)[number];

export const categoryEmoji: Record<Category, string> = {
  Furniture: "🛋️",
  Electronics: "💻",
  Food: "🍚",
  Clothing: "👕",
  Household: "🍳",
};
