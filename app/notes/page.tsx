import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { createNote, deleteNote } from "./actions";

const errors: Record<string, string> = {
  content: "메모는 공백을 제외한 1~10,000자로 입력해 주세요.",
  save: "메모를 저장하지 못했습니다. 다시 시도해 주세요.",
  delete: "메모를 삭제하지 못했습니다. 다시 시도해 주세요.",
  signout: "로그아웃하지 못했습니다. 다시 시도해 주세요.",
};

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: notes, error } = await supabase.from("notes").select("id, content, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">내 메모</h1><p className="mt-2 text-slate-600">{user.email}</p></div>
        <form action={signOut}><button className="rounded border px-4 py-2">로그아웃</button></form>
      </header>
      {params.error && errors[params.error] && <p role="alert" className="mt-4 text-red-700">{errors[params.error]}</p>}
      <form action={createNote} className="my-8 space-y-3">
        <label htmlFor="content" className="block font-medium">새 메모</label>
        <textarea id="content" name="content" required maxLength={10000} rows={5} className="w-full rounded border border-slate-300 bg-white p-3" />
        <button className="rounded bg-emerald-700 px-5 py-3 text-white">저장</button>
      </form>
      {error ? <p role="alert" className="text-red-700">메모를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p> : notes?.length ? (
        <ul className="space-y-4">{notes.map((note) => (
          <li key={note.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="whitespace-pre-wrap break-words">{note.content}</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <time dateTime={note.created_at} className="text-sm text-slate-500">{new Date(note.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</time>
              <form action={deleteNote}><input type="hidden" name="id" value={note.id} /><button className="text-red-700" aria-label="메모 삭제">삭제</button></form>
            </div>
          </li>
        ))}</ul>
      ) : <p className="text-slate-600">아직 메모가 없습니다. 첫 메모를 남겨 보세요.</p>}
    </main>
  );
}
