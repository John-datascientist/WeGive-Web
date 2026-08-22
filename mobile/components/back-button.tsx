import { Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/theme";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} hitSlop={8}>
      <Text style={styles.text}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.ink,
  },
});
