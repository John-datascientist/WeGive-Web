import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import { categoryEmoji } from "@/lib/categories";
import type { Giveaway } from "@/lib/giveaways";

export default function BrowseScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Giveaway[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const country = (user?.user_metadata as Record<string, string | undefined> | undefined)?.country ?? "NG";

        const { data } = await supabase
          .from("giveaways")
          .select("*")
          .eq("status", "AVAILABLE")
          .eq("country", country)
          .order("created_at", { ascending: false });

        if (!cancelled) {
          setItems((data ?? []) as Giveaway[]);
          setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>Browse</Text>
            <Text style={styles.title}>Find something you need</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.ink} style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                No giveaways in your country right now. Be the first to list something.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/giveaway/${item.id}`)}>
            <View style={styles.cardEmoji}>
              <Text style={{ fontSize: 32 }}>{categoryEmoji[item.category]}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardCategory}>
                  {item.category} · {item.subcategory}
                </Text>
                {item.covers_delivery && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>🚚 Free delivery</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCondition}>{item.condition}</Text>
              <Text style={styles.cardLocation}>
                {item.return_city}, {item.return_region}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.foreground,
    marginBottom: 16,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedForeground,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  cardEmoji: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandLight,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.accent,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  cardCondition: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  cardLocation: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  freeBadge: {
    backgroundColor: colors.accentDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.surface,
  },
});
