"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

async function confirmationUrl(): Promise<string | null> {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host || /[\s,\\/@?#]/.test(host)) return null;
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
    const protocol = forwardedProtocol ??
      (new URL(`https://${host}`).hostname === "localhost" ? "http" : "https");
    if (protocol !== "http" && protocol !== "https") return null;
    const origin = new URL(`${protocol}://${host}`);
    if (!origin.hostname || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash) return null;
    return `${origin.origin}/auth/confirm`;
  } catch {
    return null;
  }
}

export async function authenticate(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = formData.get("mode");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6 || password.length > 128) {
    return { error: "올바른 이메일과 6~128자 비밀번호를 입력해 주세요." };
  }
  if (mode !== "login" && mode !== "signup") return { error: "잘못된 요청입니다." };

  const supabase = await createClient();
  if (mode === "signup") {
    const emailRedirectTo = await confirmationUrl();
    if (!emailRedirectTo) return { error: "가입 요청 주소를 확인할 수 없습니다. 다시 시도해 주세요." };
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo },
    });
    if (error) return { error: "가입하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요." };
    if (!data.session) return { message: "이메일의 확인 링크를 눌러 가입을 완료한 뒤 로그인해 주세요." };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "이메일 또는 비밀번호를 확인해 주세요." };
  }
  redirect("/notes");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/notes?error=signout");
  redirect("/login");
}
