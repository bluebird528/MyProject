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
http://localhost:3000 에 접속합니다. 초기 화면은 Supabase 연결 없이도 실행 및 빌드됩니다.

## Supabase 사용

- Client Component: `import { createClient } from "@/lib/supabase/client"`
- Server Component / Server Action / Route Handler: `import { createClient } from "@/lib/supabase/server"` 후 `await createClient()`

서버 클라이언트는 요청 쿠키를 사용합니다. 인증 기능을 추가할 때는 Next.js proxy에서
세션을 갱신하고 응답 쿠키를 저장하는 구성을 함께 추가해야 합니다.
secret / service-role 키는 서버에서만 사용하고 `NEXT_PUBLIC_` 변수로 노출하지 않습니다.
DB 마이그레이션은 `supabase/migrations/`에 두고 새 테이블에는 RLS를 활성화합니다.

## 검증

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test`는 Vitest를 실행합니다. 초기 뼈대에는 테스트가 없으며, 테스트 파일이 없을 때도 성공하도록 설정했습니다.

`npm run build`는 Webpack을 사용합니다. 로컬 포트 생성이 제한된 환경에서도 빌드할 수 있도록 구성했습니다.
빌드의 타입 검사는 TypeScript compiler API를 사용하며, `typecheck` 명령은 별도로 `tsc`를 실행합니다.
