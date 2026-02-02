import React, { useMemo } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/theme";
import { ThemeColors } from "../../lib/colors";

export default function Pharmacies() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.card}>
        <Text style={styles.title}>Pharmacies</Text>
        <Text style={styles.subtitle}>Find nearby pharmacies</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.appBackground,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: themeColors.surface,
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
      color: themeColors.text.primary,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: themeColors.text.secondary,
    },
  });
