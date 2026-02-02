import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

const initialItems = [
  { id: "vitamin-c", name: "Vitamin C", detail: "30 tablets", amount: 12.5 },
  { id: "cough-syrup", name: "Cough syrup", detail: "200 ml", amount: 9.8 },
  { id: "zinc", name: "Zinc", detail: "60 capsules", amount: 6.4 },
];

const formatCurrency = (value: number) => `MWK ${value.toFixed(2)}`;

export default function Cart() {
  const [items, setItems] = useState(initialItems);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items]
  );

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

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
            <Text style={styles.heroTitle}>Your cart</Text>
            <Text style={styles.heroSubtitle}>
              Review items before checkout.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Add items to start your order.
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetail}>{item.detail}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleRemoveItem(item.id)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.text.muted}
                      />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
            <Pressable
              style={[
                styles.primaryButton,
                items.length === 0 && styles.primaryButtonDisabled,
              ]}
              disabled={items.length === 0}
            >
              <Text style={styles.primaryButtonText}>Proceed to checkout</Text>
            </Pressable>
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
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.light,
    },
    itemRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    itemName: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
    },
    itemDetail: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.secondary,
      marginTop: 4,
    },
    itemPrice: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
    },
    deleteButton: {
      marginLeft: 10,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.surface,
    },
    emptyState: {
      paddingVertical: 18,
      alignItems: "center",
    },
    emptyTitle: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
    },
    emptySubtitle: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.text.secondary,
      marginTop: 6,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    totalLabel: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.secondary,
    },
    totalValue: {
      fontFamily: bodyFont,
      fontSize: 16,
      color: themeColors.accent.dark,
    },
    primaryButton: {
      backgroundColor: themeColors.accent.dark,
      borderRadius: 999,
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 4,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontFamily: bodyFont,
      fontSize: 15,
      color: themeColors.text.inverse,
    },
  });
