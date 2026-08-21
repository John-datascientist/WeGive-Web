import Link from "next/link";
import { ButtonLink, Card, Eyebrow } from "@/components/ui";
import { FreeDeliveryBadge } from "@/components/free-delivery-badge";
import { categories, subcategories, type Category } from "@/lib/categories";
import { countries } from "@/lib/location";
import { getSelectedCountry } from "@/lib/location-server";
import { createClient } from "@/lib/supabase/server";
import { categoryEmoji, getReciprocityStatus, type Giveaway } from "@/lib/giveaways";

export const metadata = { title: "Browse giveaways" };

function isCategory(value: string | undefined): value is Category {
  return !!value && (categories as readonly string[]).includes(value);
}

export default async function BrowsePage({
  searchParams,
}: PageProps<"/browse">) {
  const params = await searchParams;
  const selectedCategory = isCategory(
    Array.isArray(params.category) ? params.category[0] : params.category
  )
    ? ((Array.isArray(params.category) ? params.category[0] : params.category) as Category)
    : undefined;
  const rawSub = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const selectedSub = selectedCategory && subcategories[selectedCategory].includes(rawSub ?? "")
    ? rawSub
    : undefined;

  const country = await getSelectedCountry();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as Record<string, string | undefined> | undefined;
  const isNigerianResident = country === "NG" && !!meta?.region;

  const claimLocked = user ? !(await getReciprocityStatus(supabase, user.id)).canClaimMore : false;

  let query = supabase
    .from("giveaways")
    .select("*")
    .eq("status", "AVAILABLE")
    .eq("country", country)
    .order("created_at", { ascending: false });
  if (selectedCategory) query = query.eq("category", selectedCategory);
  if (selectedSub) query = query.eq("subcategory", selectedSub);
  if (isNigerianResident) query = query.ilike("return_region", meta!.region!.trim());

  const { data: giveaways } = await query;
  const items = (giveaways ?? []) as Giveaway[];

  return (
    <div className="container-page flex flex-col gap-8 py-14 sm:py-20">
      <div className="flex max-w-2xl flex-col gap-4">
        <Eyebrow>Browse</Eyebrow>
        <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Find something you need
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          {isNigerianResident
            ? `Showing giveaways in ${meta!.region}. Exact pickup addresses are only shared once a claim is confirmed.`
            : `Showing giveaways in ${countries[country].name}. Exact pickup addresses are only shared once a claim is confirmed.`}
        </p>
      </div>

      {claimLocked && (
        <Card className="flex flex-col items-start gap-3 border-border-strong bg-warn-light/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            🔒 You&apos;ve used your first claim. List a giveaway to unlock
            the ability to claim again.
          </p>
          <ButtonLink href="/giveaway/create" variant="primary" className="w-full sm:w-auto">
            List a giveaway
          </ButtonLink>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/browse"
            className={`label-caps border border-border-strong px-4 py-1.5 text-xs font-semibold transition-colors ${
              !selectedCategory ? "bg-ink text-surface" : "bg-surface text-foreground/80 hover:bg-surface-muted"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/browse?category=${encodeURIComponent(c)}`}
              className={`label-caps border border-border-strong px-4 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === c ? "bg-ink text-surface" : "bg-surface text-foreground/80 hover:bg-surface-muted"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {selectedCategory && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/browse?category=${encodeURIComponent(selectedCategory)}`}
              className={`label-caps border px-3 py-1 text-[11px] font-semibold transition-colors ${
                !selectedSub
                  ? "border-ink bg-brand-light text-ink"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
              }`}
            >
              All {selectedCategory.toLowerCase()}
            </Link>
            {subcategories[selectedCategory].map((sub) => (
              <Link
                key={sub}
                href={`/browse?category=${encodeURIComponent(selectedCategory)}&sub=${encodeURIComponent(sub)}`}
                className={`label-caps border px-3 py-1 text-[11px] font-semibold transition-colors ${
                  selectedSub === sub
                    ? "border-ink bg-brand-light text-ink"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                }`}
              >
                {sub}
              </Link>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 border-dashed">
          <p className="text-sm font-semibold text-foreground">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            {isNigerianResident
              ? `No giveaways in ${meta!.region} match this category right now. Try a different one, or be the first to list something.`
              : `No giveaways in ${countries[country].name} match this category right now. Try a different one, or be the first to list something.`}
          </p>
          <ButtonLink href="/giveaway/create" variant="primary">
            List a giveaway
          </ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link key={item.id} href={`/giveaway/${item.id}`}>
              <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
                <div className="flex h-28 items-center justify-center bg-brand-light text-4xl">
                  {categoryEmoji[item.category]}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {item.category} · {item.subcategory}
                    </span>
                    {item.covers_delivery && <FreeDeliveryBadge />}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{item.condition}</p>
                <p className="mt-auto text-sm text-foreground/70">
                  {item.return_city}, {item.return_region}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
