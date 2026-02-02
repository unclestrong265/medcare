import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { applyAuthRedirect } from "./auth-redirect";

WebBrowser.maybeCompleteAuthSession();

export function getRedirectUrl() {
  const explicitRedirect = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL;
  if (explicitRedirect) {
    return explicitRedirect;
  }

  const owner = process.env.EXPO_PUBLIC_EXPO_OWNER ?? Constants.expoConfig?.owner;
  const slug = Constants.expoConfig?.slug;

  return AuthSession.makeRedirectUri({
    path: "auth/callback",
    useProxy: Constants.appOwnership === "expo",
    projectNameForProxy: owner && slug ? `@${owner}/${slug}` : undefined,
  });
}

export async function signInWithProvider(provider: Provider) {
  const redirectTo = getRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error("Missing OAuth URL.");
  }

  const useProxy = redirectTo.startsWith("https://auth.expo.io/");
  const returnUrl = useProxy
    ? AuthSession.getDefaultReturnUrl()
    : Linking.createURL("auth/callback");
  const startUrl = useProxy
    ? `${redirectTo}/start?${new URLSearchParams({
        authUrl: data.url,
        returnUrl,
      }).toString()}`
    : data.url;

  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

  if (result.type !== "success") {
    return null;
  }

  const resultUrl =
    "url" in result && result.url
      ? result.url
      : result.params
      ? `${redirectTo}?${new URLSearchParams(result.params).toString()}`
      : null;

  if (!resultUrl) {
    throw new Error("Missing OAuth callback URL.");
  }

  await applyAuthRedirect(resultUrl);
  return true;
}
