import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Next.js + Supabase</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">MyProject</h1>
        <p className="mt-4 leading-7 text-slate-600">
          App Router, TypeScript, Tailwind CSS 기반 프로젝트입니다.
          이메일로 로그인하고 나만의 메모를 저장하세요.
        </p>
      <Link href="/login" className="mt-6 inline-block rounded bg-emerald-700 px-5 py-3 text-white">개인 메모 시작하기</Link>
      </section>
    </main>
  );
}
