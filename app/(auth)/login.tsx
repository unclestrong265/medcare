import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/theme";
import { ThemeColors } from "../../lib/colors";
import { supabase } from "../../lib/supabase";
import { getRedirectUrl, signInWithProvider } from "../../lib/oauth";

const headingFont =
  Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }) ||
  "serif";
const bodyFont =
  Platform.select({
    ios: "Avenir Next",
    android: "sans-serif-light",
    default: "Avenir Next",
  }) || "sans-serif";

export default function Login() {
  const [passwordHidden, setPasswordHidden] = useState(true);
  const cardFade = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectUrl = getRedirectUrl();
  const { colors, isDark, toggleMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const introAnimation = Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(formFade, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
        delay: 120,
      }),
    ]);

    introAnimation.start();

    return () => {
      introAnimation.stop();
    };
  }, [cardFade, formFade]);

  const cardStyle = {
    opacity: cardFade,
    transform: [
      {
        translateY: cardFade.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const formStyle = {
    opacity: formFade,
    transform: [
      {
        translateY: formFade.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const handleLogin = async () => {
    setError(null);
    setStatus(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/(tabs)/home");
  };

  const handleOAuth = async (provider: "google" | "twitter") => {
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      const result = await signInWithProvider(provider);
      if (result) {
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setStatus(null);
    const emailValue = email.trim();
    if (!emailValue) {
      setError("Enter your email to receive a login link.");
      return;
    }
    setIsSubmitting(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: emailValue,
      options: {
        emailRedirectTo: getRedirectUrl(),
        shouldCreateUser: true,
      },
    });
    setIsSubmitting(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStatus("Magic link sent. Check your email.");
  };

  const handleOpenPhone = () => {
    setPhoneError(null);
    setPhoneNumber("");
    setIsPhoneModalVisible(true);
  };

  const handleSendPhoneOtp = async () => {
    setPhoneError(null);
    const phoneValue = phoneNumber.trim();
    if (!phoneValue) {
      setPhoneError("Enter a phone number.");
      return;
    }
    setIsSubmitting(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: phoneValue,
      options: {
        channel: "sms",
        shouldCreateUser: true,
      },
    });
    setIsSubmitting(false);
    if (otpError) {
      setPhoneError(otpError.message);
      return;
    }
    setIsPhoneModalVisible(false);
    router.push({ pathname: "/(auth)/verify-otp", params: { phone: phoneValue } });
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modeToggleRow}>
              <View style={styles.modeToggleLabel}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.modeToggleText}>
                  {isDark ? "Dark" : "Light"} mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleMode}
                style={styles.modeToggleSwitch}
                trackColor={{
                  false: colors.border.subtle,
                  true: colors.accent.dark,
                }}
                thumbColor={
                  Platform.OS === "android"
                    ? isDark
                      ? colors.text.inverse
                      : colors.surface
                    : undefined
                }
                ios_backgroundColor={colors.border.subtle}
              />
            </View>
            <Animated.View style={[styles.card, cardStyle]}>
              <View style={styles.header}>
                <View style={styles.headerOrbLeft} />
                <View style={styles.headerOrbRight} />
                <Text style={styles.headerTitle}>Welcome back</Text>
                <Text style={styles.headerSubtitle}>
                  Sign in to continue
                </Text>
              </View>
              <View style={styles.sheet}>
              <View style={styles.socialMiniRow}>
                <Pressable
                  style={[
                    styles.socialMiniButton,
                    isSubmitting && styles.socialMiniButtonDisabled,
                  ]}
                  onPress={() => handleOAuth("google")}
                  disabled={isSubmitting}
                >
                  <FontAwesome name="google" size={16} color="#DB4437" />
                </Pressable>
                <Pressable
                  style={[
                    styles.socialMiniButton,
                    isSubmitting && styles.socialMiniButtonDisabled,
                  ]}
                  onPress={() => handleOAuth("twitter")}
                  disabled={isSubmitting}
                >
                  <FontAwesome name="twitter" size={16} color="#1DA1F2" />
                </Pressable>
                <Pressable
                  style={[
                    styles.socialMiniButton,
                    isSubmitting && styles.socialMiniButtonDisabled,
                  ]}
                  onPress={handleOpenPhone}
                  disabled={isSubmitting}
                >
                  <Ionicons
                    name="call"
                    size={16}
                    color={colors.text.primary}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.socialMiniButton,
                    isSubmitting && styles.socialMiniButtonDisabled,
                  ]}
                  onPress={() => handleOAuth("apple")}
                  disabled={isSubmitting}
                >
                  <FontAwesome
                    name="apple"
                    size={18}
                    color={colors.text.primary}
                  />
                </Pressable>
              </View>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
                <Animated.View style={formStyle}>
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={colors.text.subtle}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    returnKeyType="next"
                  />
                  <View style={styles.inputGroup}>
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor={colors.text.subtle}
                      style={styles.inputFlex}
                      secureTextEntry={passwordHidden}
                      autoCapitalize="none"
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="done"
                    />
                    <Pressable
                      onPress={() => setPasswordHidden((prev) => !prev)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={passwordHidden ? "eye" : "eye-off"}
                        size={18}
                        color={colors.text.muted}
                      />
                    </Pressable>
                  </View>
                  <Pressable style={styles.forgotLink} onPress={() => {}}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
                  {status ? <Text style={styles.statusText}>{status}</Text> : null}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <Pressable
                    style={[
                      styles.primaryButton,
                      isSubmitting && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.primaryButtonText}>Log in</Text>
                  </Pressable>
                  <Pressable
                    style={styles.inlineLink}
                    onPress={() => router.push("/(auth)/register")}
                  >
                    <Text style={styles.inlineLinkText}>
                      New here?{" "}
                      <Text style={styles.linkText}>Create an account</Text>
                    </Text>
                  </Pressable>
                  {__DEV__ ? (
                    <View style={styles.devBlock}>
                      <Text style={styles.devLabel}>Dev redirect URL</Text>
                      <Text style={styles.devValue} selectable>
                        {redirectUrl}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        transparent
        animationType="fade"
        visible={isPhoneModalVisible}
        onRequestClose={() => setIsPhoneModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Continue with phone</Text>
            <Text style={styles.modalSubtitle}>
              We will text you a one-time code.
            </Text>
            <TextInput
              placeholder="+1 555 000 0000"
              placeholderTextColor={colors.text.subtle}
              style={styles.modalInput}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButtonSecondary}
                onPress={() => setIsPhoneModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButtonPrimary,
                  isSubmitting && styles.primaryButtonDisabled,
                ]}
                onPress={handleSendPhoneOtp}
                disabled={isSubmitting}
              >
                <Text style={styles.modalButtonTextPrimary}>Send code</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    flexGrow: 1,
    justifyContent: "center",
  },
  modeToggleRow: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border.subtle,
    marginBottom: 10,
  },
  modeToggleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modeToggleText: {
    fontFamily: bodyFont,
    fontSize: 11,
    color: themeColors.text.secondary,
  },
  modeToggleSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  card: {
    borderRadius: 30,
    backgroundColor: themeColors.card,
    overflow: "hidden",
    shadowColor: "#111111",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  header: {
    height: 170,
    backgroundColor: themeColors.header,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  headerOrbLeft: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: themeColors.headerOrbs.sand,
    opacity: 0.7,
    left: -20,
    bottom: -35,
  },
  headerOrbRight: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: themeColors.headerOrbs.mint,
    opacity: 0.7,
    right: -25,
    top: -25,
  },
  headerTitle: {
    fontFamily: headingFont,
    fontSize: 28,
    color: themeColors.text.inverse,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: bodyFont,
    marginTop: 6,
    fontSize: 14,
    color: themeColors.headerTextMuted,
  },
  sheet: {
    backgroundColor: themeColors.surface,
    padding: 22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -24,
  },
  socialMiniRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  socialMiniButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: themeColors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.surface,
  },
  socialMiniButtonDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: themeColors.border.light,
  },
  dividerText: {
    fontFamily: bodyFont,
    marginHorizontal: 10,
    color: themeColors.text.muted,
    fontSize: 12,
  },
  input: {
    backgroundColor: themeColors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: bodyFont,
    fontSize: 15,
    color: themeColors.text.primary,
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: bodyFont,
    fontSize: 15,
    color: themeColors.text.primary,
  },
  forgotLink: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  forgotText: {
    fontFamily: bodyFont,
    fontSize: 13,
    color: themeColors.text.secondary,
  },
  primaryButton: {
    backgroundColor: themeColors.accent.dark,
    borderRadius: 999,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 2,
    marginBottom: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: bodyFont,
    fontSize: 16,
    color: themeColors.text.inverse,
    letterSpacing: 0.3,
  },
  linkText: {
    textDecorationLine: "underline",
    color: themeColors.text.primary,
  },
  inlineLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  inlineLinkText: {
    fontFamily: bodyFont,
    fontSize: 13,
    color: themeColors.text.secondary,
  },
  devBlock: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: themeColors.card,
  },
  devLabel: {
    fontFamily: bodyFont,
    fontSize: 11,
    color: themeColors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
    marginBottom: 4,
  },
  devValue: {
    fontFamily: bodyFont,
    fontSize: 12,
    color: themeColors.text.primary,
    textAlign: "center",
  },
  statusText: {
    fontFamily: bodyFont,
    color: themeColors.accent.success,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 6,
  },
  errorText: {
    fontFamily: bodyFont,
    color: themeColors.accent.error,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: themeColors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: themeColors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontFamily: bodyFont,
    fontSize: 18,
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: bodyFont,
    fontSize: 13,
    color: themeColors.text.secondary,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: themeColors.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: bodyFont,
    fontSize: 15,
    color: themeColors.text.primary,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  modalButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  modalButtonPrimary: {
    backgroundColor: themeColors.accent.dark,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalButtonTextSecondary: {
    fontFamily: bodyFont,
    color: themeColors.text.secondary,
    fontSize: 13,
  },
  modalButtonTextPrimary: {
    fontFamily: bodyFont,
    color: themeColors.text.inverse,
    fontSize: 13,
  },
});
