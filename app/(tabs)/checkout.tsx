import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
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
import { useTheme } from "../../context/theme";
import { ThemeColors } from "../../lib/colors";

const headingFont =
  Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }) ||
  "serif";
const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif-light",
    default: "Avenir Next",
  }) || "sans-serif";

export default function Checkout() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.background} pointerEvents="none">
        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbLeft} />
        <View style={styles.bgOrbRight} />
      </View>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <View style={styles.heroOrbLeft} />
              <View style={styles.heroOrbRight} />
              <Text style={styles.heroTitle}>Checkout</Text>
              <Text style={styles.heroSubtitle}>
                Confirm delivery details and pay.
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Delivery details</Text>
              <TextInput
                placeholder="Delivery address"
                placeholderTextColor={colors.text.subtle}
                style={styles.input}
                autoCapitalize="words"
              />
              <TextInput
                placeholder="Phone number"
                placeholderTextColor={colors.text.subtle}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Delivery notes"
                placeholderTextColor={colors.text.subtle}
                style={[styles.input, styles.inputMultiline]}
                multiline
                numberOfLines={3}
              />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>MWK 28.70</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>MWK 2.50</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryTotal}>MWK 31.20</Text>
              </View>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Place order</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    screen: {
      flex: 1,
      backgroundColor: themeColors.appBackground,
    },
    safeArea: {
      flex: 1,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: themeColors.appBackground,
    },
    bgOrbTop: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: themeColors.orbs.peach,
      opacity: 0.4,
      right: -80,
      top: -40,
    },
    bgOrbLeft: {
      position: "absolute",
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: themeColors.orbs.apricot,
      opacity: 0.45,
      left: -90,
      top: 80,
    },
    bgOrbRight: {
      position: "absolute",
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: themeColors.orbs.mint,
      opacity: 0.5,
      right: -120,
      top: 240,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 120,
    },
    hero: {
      borderRadius: 26,
      backgroundColor: themeColors.header,
      padding: 22,
      overflow: "hidden",
    },
    heroOrbLeft: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: themeColors.headerOrbs.sand,
      opacity: 0.7,
      left: -30,
      bottom: -40,
    },
    heroOrbRight: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: themeColors.headerOrbs.mint,
      opacity: 0.7,
      right: -40,
      top: -30,
    },
    heroTitle: {
      fontFamily: headingFont,
      fontSize: 26,
      color: themeColors.text.inverse,
      letterSpacing: 0.3,
    },
    heroSubtitle: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.headerTextMuted,
      marginTop: 6,
    },
    card: {
      marginTop: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 24,
      padding: 20,
      shadowColor: "#111111",
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },
    sectionTitle: {
      fontFamily: bodyFont,
      fontSize: 16,
      color: themeColors.text.primary,
      marginBottom: 12,
    },
    input: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
      marginBottom: 12,
    },
    inputMultiline: {
      minHeight: 90,
      textAlignVertical: "top",
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    summaryLabel: {
      fontFamily: bodyFont,
      fontSize: 13,
      color: themeColors.text.secondary,
    },
    summaryValue: {
      fontFamily: bodyFont,
      fontSize: 13,
      color: themeColors.text.primary,
    },
    summaryTotal: {
      fontFamily: bodyFont,
      fontSize: 15,
      color: themeColors.accent.dark,
    },
    primaryButton: {
      backgroundColor: themeColors.accent.dark,
      borderRadius: 999,
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 12,
    },
    primaryButtonText: {
      fontFamily: bodyFont,
      fontSize: 15,
      color: themeColors.text.inverse,
    },
  });
