import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/theme";
import { useAuth } from "../../context/auth";
import { ThemeColors } from "../../lib/colors";
import { api } from "../../lib/api";

const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif-light",
    default: "Avenir Next",
  }) || "sans-serif";

type Pharmacy = {
  id: number;
  name: string;
  license_number: string | null;
  address: string;
  contact_email: string;
  contact_phone: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  is_verified: boolean;
  is_active: boolean;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const maybeAny = error as { response?: { data?: unknown } };
    const data = maybeAny.response?.data;
    if (data && typeof data === "object") {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const message = entries[0][1];
        if (Array.isArray(message)) {
          return message[0];
        }
        if (typeof message === "string") {
          return message;
        }
      }
    }
  }
  return error instanceof Error ? error.message : "Something went wrong.";
};

export default function PharmacyRegistry() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [form, setForm] = useState({
    name: "",
    license_number: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
  });
  const canEditLicense = !pharmacy || !pharmacy.license_number;

  const fullName = [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    let isMounted = true;

    const loadPharmacy = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Pharmacy[]>("/pharmacies/");
        if (!isMounted) return;
        const existing = response.data?.[0] ?? null;
        setPharmacy(existing);
        if (existing) {
          setForm({
            name: existing.name ?? "",
            license_number: existing.license_number ?? "",
            address: existing.address ?? "",
            contact_email: existing.contact_email ?? "",
            contact_phone: existing.contact_phone ?? "",
            owner_name: existing.owner_name ?? "",
            owner_email: existing.owner_email ?? "",
            owner_phone: existing.owner_phone ?? "",
          });
        } else {
          setForm((prev) => ({
            ...prev,
            owner_name: prev.owner_name || fullName || "",
            owner_email: prev.owner_email || user?.email || "",
          }));
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPharmacy();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email, fullName]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const requiredFields: (keyof typeof form)[] = [
      "name",
      "license_number",
      "address",
      "contact_email",
      "contact_phone",
      "owner_name",
      "owner_email",
      "owner_phone",
    ];
    for (const field of requiredFields) {
      if (!form[field].trim()) {
        return `Please fill in ${field.replace("_", " ")}.`;
      }
    }
    if (!form.contact_email.includes("@")) {
      return "Contact email looks invalid.";
    }
    if (!form.owner_email.includes("@")) {
      return "Owner email looks invalid.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    setError(null);
    setSuccess(null);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      if (pharmacy) {
        const response = await api.patch<Pharmacy>(
          `/pharmacies/${pharmacy.id}/`,
          form
        );
        setPharmacy(response.data);
        setSuccess("Pharmacy details updated.");
      } else {
        const response = await api.post<Pharmacy>("/pharmacies/", form);
        setPharmacy(response.data);
        setSuccess("Registration submitted. Check your email for verification.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }
    setError(null);
    setSuccess(null);
    setVerifying(true);
    try {
      const response = await api.post<Pharmacy>("/pharmacies/verify/", {
        token: verificationCode.trim(),
      });
      setPharmacy(response.data);
      setSuccess("Pharmacy verified and activated.");
      setVerificationCode("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <Text style={styles.title}>Pharmacy Registry</Text>
            <Text style={styles.subtitle}>
              Register your pharmacy to start receiving orders.
            </Text>
            {pharmacy ? (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusPill,
                    pharmacy.is_verified
                      ? styles.statusVerified
                      : styles.statusPending,
                  ]}
                >
                  <Ionicons
                    name={pharmacy.is_verified ? "checkmark-circle" : "time"}
                    size={14}
                    color={colors.text.inverse}
                  />
                  <Text style={styles.statusText}>
                    {pharmacy.is_verified ? "Verified" : "Pending"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    pharmacy.is_active ? styles.statusActive : styles.statusPaused,
                  ]}
                >
                  <Ionicons
                    name={pharmacy.is_active ? "flash" : "pause"}
                    size={14}
                    color={colors.text.inverse}
                  />
                  <Text style={styles.statusText}>
                    {pharmacy.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            ) : null}
            {pharmacy && pharmacy.is_verified && !pharmacy.is_active ? (
              <Text style={styles.statusHint}>
                This pharmacy is verified but inactive. Contact support to
                activate.
              </Text>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.text.primary} />
              <Text style={styles.loadingText}>Loading pharmacy details...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.alert}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.accent.error}
              />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.alert, styles.alertSuccess]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={colors.accent.success}
              />
              <Text style={[styles.alertText, styles.alertTextSuccess]}>
                {success}
              </Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Pharmacy Details</Text>
            <TextInput
              placeholder="Pharmacy name"
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
              value={form.name}
              onChangeText={(value) => handleChange("name", value)}
            />
            <TextInput
              placeholder="License number"
              placeholderTextColor={colors.text.subtle}
              style={[
                styles.input,
                !canEditLicense && styles.inputDisabled,
              ]}
              value={form.license_number}
              onChangeText={(value) => handleChange("license_number", value)}
              autoCapitalize="characters"
              editable={canEditLicense}
            />
            {!canEditLicense ? (
              <Text style={styles.helperText}>
                License number changes require admin approval.
              </Text>
            ) : null}
            <TextInput
              placeholder="Address"
              placeholderTextColor={colors.text.subtle}
              style={[styles.input, styles.inputMultiline]}
              value={form.address}
              onChangeText={(value) => handleChange("address", value)}
              multiline
            />

            <Text style={styles.sectionTitle}>Contact Details</Text>
            <TextInput
              placeholder="Contact email"
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
              value={form.contact_email}
              onChangeText={(value) => handleChange("contact_email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Contact phone"
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
              value={form.contact_phone}
              onChangeText={(value) => handleChange("contact_phone", value)}
              keyboardType="phone-pad"
            />

            <Text style={styles.sectionTitle}>Owner Details</Text>
            <TextInput
              placeholder="Owner name"
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
              value={form.owner_name}
              onChangeText={(value) => handleChange("owner_name", value)}
            />
            <TextInput
              placeholder="Owner email"
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
              value={form.owner_email}
              onChangeText={(value) => handleChange("owner_email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Owner phone"
              placeholderTextColor={colors.text.subtle}
              style={styles.input}
              value={form.owner_phone}
              onChangeText={(value) => handleChange("owner_phone", value)}
              keyboardType="phone-pad"
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (saving || loading) && styles.primaryButtonDisabled,
                pressed && !saving && styles.primaryButtonPressed,
              ]}
              onPress={handleSubmit}
              disabled={saving || loading}
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? "Saving..."
                  : pharmacy
                  ? "Update pharmacy"
                  : "Submit registration"}
              </Text>
            </Pressable>
          </View>

          {pharmacy && !pharmacy.is_verified ? (
            <View style={styles.verifyCard}>
              <Text style={styles.sectionTitle}>Verify your email</Text>
              <Text style={styles.verifyHint}>
                Enter the code from your verification email to activate the
                pharmacy.
              </Text>
              <TextInput
                placeholder="Verification code"
                placeholderTextColor={colors.text.subtle}
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                autoCapitalize="characters"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  verifying && styles.primaryButtonDisabled,
                  pressed && !verifying && styles.primaryButtonPressed,
                ]}
                onPress={handleVerify}
                disabled={verifying}
              >
                <Text style={styles.secondaryButtonText}>
                  {verifying ? "Verifying..." : "Verify pharmacy"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.appBackground,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    headerCard: {
      marginTop: 8,
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 18,
      shadowColor: "#000000",
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    title: {
      fontFamily: bodyFont,
      fontSize: 20,
      fontWeight: "600",
      color: themeColors.text.primary,
    },
    subtitle: {
      fontFamily: bodyFont,
      fontSize: 13,
      color: themeColors.text.secondary,
      marginTop: 6,
    },
    statusRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    statusHint: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.secondary,
      marginTop: 10,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      gap: 6,
    },
    statusText: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.inverse,
    },
    statusVerified: {
      backgroundColor: themeColors.accent.success,
    },
    statusPending: {
      backgroundColor: themeColors.text.muted,
    },
    statusActive: {
      backgroundColor: themeColors.accent.dark,
    },
    statusPaused: {
      backgroundColor: themeColors.accent.error,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 14,
      paddingHorizontal: 4,
    },
    loadingText: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.secondary,
    },
    alert: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: themeColors.card,
      borderWidth: 1,
      borderColor: themeColors.accent.error,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    alertText: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.accent.error,
      flex: 1,
    },
    alertSuccess: {
      borderColor: themeColors.accent.success,
    },
    alertTextSuccess: {
      color: themeColors.accent.success,
    },
    formCard: {
      marginTop: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 18,
    },
    sectionTitle: {
      fontFamily: bodyFont,
      fontSize: 14,
      fontWeight: "600",
      color: themeColors.text.primary,
      marginBottom: 10,
      marginTop: 6,
    },
    input: {
      backgroundColor: themeColors.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
      marginBottom: 12,
    },
    inputMultiline: {
      minHeight: 70,
      textAlignVertical: "top",
    },
    inputDisabled: {
      opacity: 0.6,
    },
    helperText: {
      fontFamily: bodyFont,
      fontSize: 11,
      color: themeColors.text.muted,
      marginBottom: 12,
      marginTop: -6,
    },
    primaryButton: {
      marginTop: 4,
      backgroundColor: themeColors.accent.dark,
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonPressed: {
      opacity: 0.8,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontFamily: bodyFont,
      fontSize: 15,
      color: themeColors.text.inverse,
    },
    verifyCard: {
      marginTop: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 18,
    },
    verifyHint: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.secondary,
      marginBottom: 10,
    },
    secondaryButton: {
      backgroundColor: themeColors.surface,
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
    },
    secondaryButtonText: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
    },
  });
