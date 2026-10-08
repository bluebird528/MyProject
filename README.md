# MyProject

Next.js App Router + TypeScript + Tailwind CSS + Supabase 기본 프로젝트.

## 시작하기

Node.js 22.13.0 이상을 사용합니다.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local`에 Supabase 프로젝트의 `NEXT_PUBLIC_SUPABASE_URL`과
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정한 뒤
http://localhost:3000 에 접속합니다. `/login`에서 가입/로그인하면 `/notes`에서 본인의 메모를 조회·작성·삭제할 수 있습니다. 홈 화면과 빌드는 Supabase 연결 없이도 실행됩니다.

## Supabase 사용

- Client Component: `import { createClient } from "@/lib/supabase/client"`
- Server Component / Server Action / Route Handler: `import { createClient } from "@/lib/supabase/server"` 후 `await createClient()`

서버 클라이언트는 요청 쿠키를 사용합니다. `proxy.ts`는 인증 경로에서 세션을 갱신하고 요청/응답 쿠키를 저장합니다. 페이지와 Server Action은 `getUser()`로 사용자를 검증합니다.
secret / service-role 키는 서버에서만 사용하고 `NEXT_PUBLIC_` 변수로 노출하지 않습니다.
DB 마이그레이션은 `supabase/migrations/`에 두고 새 테이블에는 RLS를 활성화합니다.

## 검증

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test`는 인증/메모 Server Action, proxy 쿠키 갱신, PostgreSQL(PGlite)에서 실제 마이그레이션을 적용한 사용자 간 RLS 격리를 검증합니다. 실제 Supabase 프로젝트를 사용한 통합 테스트는 별도입니다.

`npm run build`는 Webpack을 사용합니다. 로컬 포트 생성이 제한된 환경에서도 빌드할 수 있도록 구성했습니다.
빌드의 타입 검사는 TypeScript compiler API를 사용하며, `typecheck` 명령은 별도로 `tsc`를 실행합니다.

## 인증 및 DB 설정

1. Supabase 프로젝트에 `supabase/migrations/20261008000000_create_notes.sql`을 적용합니다. 연결된 Supabase CLI에서 `supabase db push`를 실행하거나 SQL Editor에서 실행할 수 있습니다. 이 PR은 원격 DB에 직접 적용하지 않습니다.
2. Authentication에서 Email 제공자를 활성화하고 Site URL을 앱 주소로 설정합니다.
3. 이메일 확인을 사용하는 경우 Confirm signup 이메일 템플릿 링크를 다음으로 설정합니다.

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">이메일 확인</a>
```

확인 완료 시 `/notes`로 이동합니다. 이메일 확인이 꺼져 있으면 가입 즉시 이동합니다.
`notes`는 인증된 사용자에게 SELECT/INSERT/DELETE만 허용하며 각 정책은 `auth.uid() = user_id`를 검사합니다. UPDATE와 익명 접근은 허용하지 않습니다. 사용자 삭제 시 해당 메모도 삭제됩니다.
