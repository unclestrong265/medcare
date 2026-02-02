import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/theme";

const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif-light",
    default: "Avenir Next",
  }) || "sans-serif";

export default function Security() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Security</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: { appBackground: string; text: { primary: string } }) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: themeColors.appBackground,
    },
    content: {
      padding: 16,
    },
    title: {
      fontFamily: bodyFont,
      fontSize: 18,
      fontWeight: "600",
      color: themeColors.text.primary,
    },
  });
