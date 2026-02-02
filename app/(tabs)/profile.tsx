import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
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
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { useAuth } from "../../context/auth";
import { useTheme } from "../../context/theme";
import { supabase } from "../../lib/supabase";
import { ThemeColors } from "../../lib/colors";

const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif-light",
    default: "Avenir Next",
  }) || "sans-serif";
const tabBarHeight = 64;
const tabBarInset = Platform.OS === "ios" ? 18 : 12;
const menuBottomPadding = tabBarHeight + tabBarInset + 12;

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const AVATAR_BUCKET = "avatars";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const logoutColor = isDark ? "#FF3B30" : "#DC2626";
  const styles = useMemo(
    () => createStyles(colors, logoutColor),
    [colors, logoutColor]
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const metadata = user?.user_metadata ?? {};
  const firstName = getString(metadata.first_name);
  const lastName = getString(metadata.last_name);
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    getString(metadata.full_name) ||
    getString(metadata.name);
  const accountName = fullName || "Not set";
  const accountEmail = user?.email || "Not set";
  const avatarPathFromProfile = getString(metadata.avatar_path);
  const avatarUrlFromProfile = getString(metadata.avatar_url);
  useEffect(() => {
    let isActive = true;

    const resolveAvatar = async () => {
      if (avatarPathFromProfile) {
        const { data, error } = await supabase.storage
          .from(AVATAR_BUCKET)
          .createSignedUrl(avatarPathFromProfile, SIGNED_URL_TTL_SECONDS);
        if (!isActive) return;
        if (error) {
          setUploadError(error.message);
          setAvatarUri(null);
          return;
        }
        setAvatarUri(data.signedUrl);
        return;
      }
      if (avatarUrlFromProfile) {
        setAvatarUri(avatarUrlFromProfile);
        return;
      }
      setAvatarUri(null);
    };

    resolveAvatar();
    return () => {
      isActive = false;
    };
  }, [avatarPathFromProfile, avatarUrlFromProfile, user?.id]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handlePickImage = async () => {
    if (isPicking || isUploading) return;
    setUploadError(null);
    if (!user) {
      setUploadError("You need to be logged in to upload a profile photo.");
      return;
    }
    setIsPicking(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setUploadError("Gallery access is required to upload a profile photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        setUploadError("Unable to read the selected image.");
        return;
      }
      const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "";
      const extRaw = fileName.includes(".")
        ? fileName.split(".").pop()
        : "jpg";
      const fileExt = (extRaw || "jpg").toLowerCase();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const contentType =
        asset.mimeType ||
        (fileExt === "jpg" ? "image/jpeg" : `image/${fileExt}`);

      setIsUploading(true);
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, decode(asset.base64), {
          contentType,
          upsert: true,
        });
      if (uploadError) {
        setUploadError(uploadError.message);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_path: filePath, avatar_url: null },
      });
      if (updateError) {
        setUploadError(updateError.message);
        return;
      }

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from(AVATAR_BUCKET)
          .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
      if (signedError) {
        setUploadError(signedError.message);
        return;
      }

      setAvatarUri(signedData.signedUrl);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Unable to upload photo."
      );
    } finally {
      setIsPicking(false);
      setIsUploading(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      key: "profile",
      label: "Profile info",
      icon: "person-outline",
      route: "/(tabs)/profile-info",
    },
    {
      key: "addresses",
      label: "Address",
      icon: "location-outline",
      route: "/(tabs)/addresses",
    },
    {
      key: "prescriptions",
      label: "Prescriptions",
      icon: "document-text-outline",
      route: "/(tabs)/prescriptions",
    },
    {
      key: "orderHistory",
      label: "Order history",
      icon: "time-outline",
      route: "/(tabs)/orders",
    },
    {
      key: "notifications",
      label: "Notification history",
      icon: "notifications-outline",
      route: "/(tabs)/notifications",
    },
    {
      key: "security",
      label: "Security",
      icon: "shield-checkmark-outline",
      route: "/(tabs)/security",
    },
    {
      key: "support",
      label: "Supports",
      icon: "help-circle-outline",
      route: "/(tabs)/support",
    },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
      return;
    }
    if (item.route) {
      router.push(item.route);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Pressable
              style={({ pressed }) => [
                styles.profileCard,
                pressed && styles.cardPressed,
              ]}
              onPress={handlePickImage}
              disabled={isPicking || isUploading}
            >
              <View style={styles.avatarShell}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={56}
                    color={colors.text.subtle}
                  />
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{accountName}</Text>
                <Text style={styles.profileDetail}>{accountEmail}</Text>
                <Text style={styles.profileHint}>Tap to change photo</Text>
              </View>
            </Pressable>

            {uploadError ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.accent.error}
                />
                <Text style={styles.errorText}>{uploadError}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) => {
              const isLast = index === menuItems.length - 1;
              const iconColor = colors.text.primary;
              const textColor = colors.text.primary;
              const rowBase = [styles.menuItem, !isLast && styles.menuItemDivider];
              const rightContent = null;

              const rowContent = (
                <>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconShell}>
                      <Ionicons name={item.icon} size={24} color={iconColor} />
                    </View>
                    <Text
                      style={[styles.menuItemLabel, { color: textColor }]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.menuItemRight}>{rightContent}</View>
                </>
              );

              return (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    ...rowBase,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleMenuPress(item)}
                  disabled={false}
                >
                  {rowContent}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
              isSigningOut && styles.logoutButtonDisabled,
            ]}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <Text style={styles.logoutText}>
              {isSigningOut ? "Signing out..." : "logout"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (themeColors: ThemeColors, logoutColor: string) =>
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
      paddingTop: 14,
      paddingBottom: menuBottomPadding,
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#0B141A",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardPressed: {
      opacity: 0.86,
    },
    avatarShell: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: themeColors.card,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    profileInfo: {
      marginLeft: 14,
      flex: 1,
    },
    profileName: {
      fontFamily: bodyFont,
      fontSize: 18,
      fontWeight: "700",
      color: themeColors.text.primary,
    },
    profileDetail: {
      fontFamily: bodyFont,
      fontSize: 14,
      color: themeColors.text.secondary,
      marginTop: 4,
    },
    profileHint: {
      fontFamily: bodyFont,
      fontSize: 13,
      color: themeColors.text.muted,
      marginTop: 6,
    },
    errorBanner: {
      marginTop: 10,
      backgroundColor: themeColors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.accent.error,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    errorText: {
      fontFamily: bodyFont,
      fontSize: 12,
      color: themeColors.accent.error,
      marginLeft: 6,
    },
    menuCard: {
      marginTop: 14,
      backgroundColor: themeColors.surface,
      borderRadius: 16,
      paddingVertical: 6,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: themeColors.border.light,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 0,
      minHeight: 56,
    },
    menuItemDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border.light,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 12,
    },
    menuIconShell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: themeColors.card,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuItemLabel: {
      fontFamily: bodyFont,
      fontSize: 16,
      lineHeight: 20,
      flex: 1,
      flexShrink: 1,
      includeFontPadding: false,
      textAlignVertical: "center",
      textAlign: "left",
    },
    menuItemRight: {
      minWidth: 24,
      alignItems: "flex-end",
      justifyContent: "center",
      marginLeft: 8,
    },
    menuItemPressed: {
      opacity: 0.78,
    },
    logoutButton: {
      marginTop: 16,
      backgroundColor: logoutColor,
      borderRadius: 16,
      minHeight: 54,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
    },
    logoutButtonPressed: {
      opacity: 0.85,
    },
    logoutButtonDisabled: {
      opacity: 0.6,
    },
    logoutText: {
      fontFamily: bodyFont,
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
      textTransform: "lowercase",
    },
  });
