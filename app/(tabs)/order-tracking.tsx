import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

const steps = [
  { label: "Order placed", time: "Today, 10:12 AM", done: true },
  { label: "Packed at pharmacy", time: "Today, 11:05 AM", done: true },
  { label: "Out for delivery", time: "Today, 1:40 PM", done: true },
  { label: "Delivered", time: "Est. 3:15 PM", done: false },
];

export default function OrderTracking() {
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
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroOrbLeft} />
            <View style={styles.heroOrbRight} />
            <Text style={styles.heroTitle}>Order tracking</Text>
            <Text style={styles.heroSubtitle}>Order #HMD-1204</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status updates</Text>
            {steps.map((step, index) => (
              <View
                key={step.label}
                style={[
                  styles.statusRow,
                  index === steps.length - 1 && styles.statusRowLast,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    step.done && styles.statusDotActive,
                  ]}
                />
                <View style={styles.statusText}>
                  <Text style={styles.statusLabel}>{step.label}</Text>
                  <Text style={styles.statusTime}>{step.time}</Text>
                </View>
              </View>
            ))}
          </View>
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
    statusRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.light,
    },
    statusRowLast: {
      borderBottomWidth: 0,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: themeColors.border.subtle,
      marginTop: 6,
      marginRight: 12,
    },
    statusDotActive: {
      backgroundColor: themeColors.accent.dark,
    },
    statusText: {
      flex: 1,
    },
    statusLabel: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
    },
    statusTime: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.secondary,
      marginTop: 4,
    },
  });
