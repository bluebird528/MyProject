export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Next.js + Supabase</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">MyProject</h1>
        <p className="mt-4 leading-7 text-slate-600">
          App Router, TypeScript, Tailwind CSS 기반 프로젝트입니다.
          환경변수를 설정하고 첫 기능을 만들어 보세요.
        </p>
      </section>
    </main>
  );
}
