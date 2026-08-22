import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import { getReciprocityStatus } from "@/lib/giveaways";
import { BackButton } from "@/components/back-button";

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function ClaimScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [status, setStatus] = useState<"loading" | "reserved" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function reserve() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setError("You must be signed in to claim an item.");
          setStatus("error");
        }
        return;
      }

      // Idempotent: reuse an existing reservation instead of duplicating on re-entry.
      const { data: existingClaim } = await supabase
        .from("claims")
        .select("reserved_until")
        .eq("giveaway_id", id)
        .eq("claimant_id", user.id)
        .eq("status", "RESERVED")
        .maybeSingle();

      if (existingClaim) {
        if (!cancelled) {
          setReservedUntil(existingClaim.reserved_until);
          setStatus("reserved");
        }
        return;
      }

      const { data: giveaway } = await supabase
        .from("giveaways")
        .select("status, giver_id")
        .eq("id", id)
        .maybeSingle();

      if (!giveaway || giveaway.status !== "AVAILABLE") {
        if (!cancelled) {
          setError("This item is no longer available to claim.");
          setStatus("error");
        }
        return;
      }

      if (giveaway.giver_id === user.id) {
        if (!cancelled) {
          setError("You can't claim your own giveaway.");
          setStatus("error");
        }
        return;
      }

      const reciprocity = await getReciprocityStatus(supabase, user.id);
      if (!reciprocity.canClaimMore) {
        if (!cancelled) {
          setError("You've reached your claim limit. List a giveaway of your own to unlock more claims.");
          setStatus("error");
        }
        return;
      }

      const { data: claim, error: claimError } = await supabase
        .from("claims")
        .insert({ giveaway_id: id, claimant_id: user.id })
        .select("reserved_until")
        .single();

      if (claimError || !claim) {
        if (!cancelled) {
          setError(claimError?.message ?? "Couldn't reserve this item.");
          setStatus("error");
        }
        return;
      }

      await supabase.from("giveaways").update({ status: "RESERVED" }).eq("id", id).eq("status", "AVAILABLE");

      if (!cancelled) {
        setReservedUntil(claim.reserved_until);
        setStatus("reserved");
      }
    }

    reserve();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (status !== "reserved") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <BackButton />
          <ActivityIndicator color={colors.ink} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <BackButton />
          <View style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const msRemaining = reservedUntil ? new Date(reservedUntil).getTime() - now : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.content}>
        <BackButton />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Reserved</Text>
          <Text style={styles.title}>Reserved for you</Text>
          <Text style={styles.body}>
            If a delivery isn&apos;t requested and funded before the timer runs out, this item returns to Available.
          </Text>
          <View style={styles.timer}>
            <Text style={styles.timerText}>{formatCountdown(msRemaining)}</Text>
          </View>
          <Text style={styles.note}>
            Delivery and payment aren&apos;t built into the app yet, finish arranging delivery on the WeeGive
            website for now.
          </Text>
        </View>
      </View>
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
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.foreground,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  timer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.warn,
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: colors.warn,
    textAlign: "center",
  },
});
