import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import { categoryEmoji } from "@/lib/categories";
import { getReciprocityStatus, type Giveaway } from "@/lib/giveaways";
import { Button } from "@/components/button";
import { BackButton } from "@/components/back-button";

export default function GiveawayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Giveaway | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canClaim, setCanClaim] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: giveaway } = await supabase.from("giveaways").select("*").eq("id", id).maybeSingle<Giveaway>();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      setItem(giveaway);
      if (giveaway && user) {
        setIsOwner(user.id === giveaway.giver_id);
        const reciprocity = await getReciprocityStatus(supabase, user.id);
        if (!cancelled) setCanClaim(reciprocity.canClaimMore);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!item || item.status === "REMOVED") {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <BackButton label="Back to browse" />
          <Text style={styles.emptyBody}>This giveaway couldn&apos;t be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton label="Back to browse" />

        <View style={styles.hero}>
          <Text style={{ fontSize: 56 }}>{categoryEmoji[item.category]}</Text>
        </View>

        <Text style={styles.eyebrow}>{item.category}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.location}>
          {item.return_city}, {item.return_region}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Details</Text>
          <Row label="Condition" value={item.condition} />
          <Row label="Status" value={item.status} />
          {item.covers_delivery && <Row label="Delivery" value="Free, covered by the giver" />}
        </View>

        {isOwner ? (
          <View style={[styles.card, styles.notice]}>
            <Text style={styles.noticeTitle}>This is your listing</Text>
            <Text style={styles.noticeBody}>You can&apos;t claim your own giveaway.</Text>
          </View>
        ) : item.status !== "AVAILABLE" ? (
          <View style={[styles.card, styles.notice]}>
            <Text style={styles.noticeTitle}>No longer available</Text>
            <Text style={styles.noticeBody}>This item has already been claimed by someone else.</Text>
          </View>
        ) : canClaim ? (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Interested in this item?</Text>
            <Text style={styles.noticeBody}>
              Claiming reserves this item for a limited time while delivery is arranged.
            </Text>
            <View style={{ marginTop: 12 }}>
              <Button label="Claim this item" onPress={() => router.push(`/giveaway/${item.id}/claim`)} />
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.notice]}>
            <Text style={styles.noticeTitle}>🔒 Give once to claim again</Text>
            <Text style={styles.noticeBody}>
              You&apos;ve used your free claims. List something you no longer need to unlock more.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
  hero: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandLight,
    marginTop: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.mutedForeground,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.foreground,
  },
  location: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  rowValue: {
    fontSize: 13,
    color: colors.foreground,
  },
  notice: {
    backgroundColor: colors.surfaceMuted,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedForeground,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 12,
  },
});
