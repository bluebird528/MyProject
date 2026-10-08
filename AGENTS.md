# 프로젝트 작업 규칙

## 스택

- Next.js App Router, React, TypeScript (strict)
- Tailwind CSS, ESLint, Vitest
- Supabase: `@supabase/supabase-js`, `@supabase/ssr`
- Node.js 22.13.0 이상, npm과 `package-lock.json` 사용

## 명령어

- `npm ci`: 잠금 파일 기준 의존성 설치
- `npm run dev`: 개발 서버 실행
- `npm run lint`: ESLint 검사 (경고도 실패)
- `npm run typecheck`: Next.js 타입 생성 및 TypeScript 검사
- `npm test`: Vitest 실행 (초기 뼈대에는 테스트 없음)
- `npm run build`: 프로덕션 빌드
- `npm start`: 프로덕션 서버 실행

## 규칙

- DB 마이그레이션은 반드시 `supabase/migrations/`에 SQL 파일로 작성한다.
- 새 테이블에는 같은 마이그레이션에서 RLS를 활성화한다. 필요한 접근 정책도 명시하고, 검증 없이 광범위한 허용 정책을 추가하지 않는다.
- secret 키와 service-role 키는 서버에서만 사용한다. `NEXT_PUBLIC_` 환경변수, 클라이언트 코드, 로그, 저장소에 포함하지 않는다.
- 브라우저에서는 `lib/supabase/client.ts`, 서버에서는 `lib/supabase/server.ts`를 사용한다. 서버 클라이언트는 요청마다 생성한다.
- `.env.example`에는 공개 설정의 예시만 기록한다. 실제 값은 `.env.local`에 저장하고 `.env*.local`은 커밋하지 않는다.
- Server Components를 기본으로 사용하고 상호작용이 필요한 컴포넌트에만 `"use client"`를 선언한다.
- 인증 기능을 추가할 때 Next.js proxy에서 Supabase 세션을 갱신하고 응답 쿠키를 저장한다. 서버 권한 검사는 검증된 사용자 정보로 수행한다.
- 변경 후 `npm run lint`, `npm run typecheck`, `npm run build`를 실행한다. 동작을 변경하면 해당 동작을 검증하는 테스트를 추가하고 `npm test`도 실행한다.
