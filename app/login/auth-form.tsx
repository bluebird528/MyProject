"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export function AuthForm() {
  const [state, action, pending] = useActionState(authenticate, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">이메일
        <input className="mt-1 w-full rounded border border-slate-300 p-3" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block">비밀번호
        <input className="mt-1 w-full rounded border border-slate-300 p-3" name="password" type="password" autoComplete="current-password" minLength={6} maxLength={128} required />
      </label>
      {state.error && <p role="alert" className="text-red-700">{state.error}</p>}
      {state.message && <p role="status" className="text-emerald-700">{state.message}</p>}
      <div className="flex gap-3">
        <button disabled={pending} name="mode" value="login" className="rounded bg-emerald-700 px-5 py-3 text-white disabled:opacity-50">로그인</button>
        <button disabled={pending} name="mode" value="signup" className="rounded border border-slate-300 px-5 py-3 disabled:opacity-50">회원가입</button>
      </div>
    </form>
  );
}
