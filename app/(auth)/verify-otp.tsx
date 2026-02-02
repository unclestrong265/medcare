import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function VerifyOtp() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    setError(null);
    if (!phone || typeof phone !== "string") {
      setError("Missing phone number.");
      return;
    }
    if (!code.trim()) {
      setError("Enter the verification code.");
      return;
    }
    setIsSubmitting(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code.trim(),
      type: "sms",
    });
    setIsSubmitting(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the code we sent to {phone ?? "your phone"}.
        </Text>
        <TextInput
          placeholder="123456"
          placeholderTextColor="#9B9B9B"
          style={styles.input}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable
          style={[
            styles.primaryButton,
            isSubmitting && styles.primaryButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>Verify</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F8FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F1F1F",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
  },
  input: {
    marginTop: 16,
    width: "100%",
    backgroundColor: "#F3F3F3",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#2F2F2F",
  },
  errorText: {
    marginTop: 10,
    color: "#C83434",
    fontSize: 13,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: "#111111",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
