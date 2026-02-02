import { supabase } from "./supabase";

type AuthRedirectParams = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error_description?: string;
};

function extractAuthParams(url: string): AuthRedirectParams {
  const query = url.split("?")[1] ?? "";
  const hash = url.split("#")[1] ?? "";
  const params = new URLSearchParams(query);
  const hashParams = new URLSearchParams(hash);
  const merged = new URLSearchParams();
  params.forEach((value, key) => merged.set(key, value));
  hashParams.forEach((value, key) => merged.set(key, value));

  return {
    access_token: merged.get("access_token") ?? undefined,
    refresh_token: merged.get("refresh_token") ?? undefined,
    code: merged.get("code") ?? undefined,
    error_description: merged.get("error_description") ?? undefined,
  };
}

export async function applyAuthRedirect(url: string) {
  const params = extractAuthParams(url);

  if (params.error_description) {
    throw new Error(params.error_description);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      params.code
    );
    if (error) {
      throw error;
    }
    return data.session;
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) {
      throw error;
    }
    return data.session;
  }

  return null;
}
