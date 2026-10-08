import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "./auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/notes");
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">개인 메모 로그인</h1>
      <p className="mt-3 text-slate-600">이메일과 비밀번호로 로그인하거나 가입하세요.</p>
      {params.error && <p role="alert" className="mt-4 text-red-700">이메일 확인 링크가 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.</p>}
      <AuthForm />
    </main>
  );
}
