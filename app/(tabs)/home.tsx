import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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
import { useRouter } from "expo-router";
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

const HERO_FADE_DELAY_MS = 2000;
const HERO_FADE_DURATION_MS = 420;
const SEARCH_BAR_HEIGHT =
  Platform.select({ ios: 44, android: 48, default: 44 }) || 44;

export default function Home() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const searchTranslate = useRef(new Animated.Value(6)).current;
  const [showHero, setShowHero] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(() => {
      if (!isActive) return;
      setShowSearch(true);
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 0,
          duration: HERO_FADE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(searchOpacity, {
          toValue: 1,
          duration: HERO_FADE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(searchTranslate, {
          toValue: 0,
          duration: HERO_FADE_DURATION_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && isActive) {
          setShowHero(false);
        }
      });
    }, HERO_FADE_DELAY_MS);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [heroOpacity, searchOpacity, searchTranslate]);

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
          {showHero ? (
            <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
              <View style={styles.heroOrbLeft} />
              <View style={styles.heroOrbRight} />
              <Text style={styles.heroTitle}>Welcome home</Text>
              <Text style={styles.heroSubtitle}>
                Your care dashboard is ready.
              </Text>
            </Animated.View>
          ) : null}
          {showSearch ? (
            <Animated.View
              style={[
                styles.searchStack,
                {
                  opacity: searchOpacity,
                  transform: [{ translateY: searchTranslate }],
                },
              ]}
            >
              <View style={styles.searchTopRow}>
                <Pressable style={styles.iconButton}>
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color={colors.text.primary}
                  />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => router.push("/(tabs)/profile")}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color={colors.text.primary}
                  />
                </Pressable>
              </View>
              <View style={styles.searchCard}>
                <TextInput
                  placeholder="Search care, orders, or pharmacies"
                  placeholderTextColor={colors.text.subtle}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCapitalize="none"
                />
              </View>
            </Animated.View>
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
    searchStack: {
      marginTop: 16,
    },
    searchTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      shadowColor: "#111111",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    searchCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      height: SEARCH_BAR_HEIGHT,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      justifyContent: "center",
      shadowColor: "#111111",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.primary,
      paddingVertical: 0,
      includeFontPadding: false,
      textAlignVertical: "center",
    },
  });
