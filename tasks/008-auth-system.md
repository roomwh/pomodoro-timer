# Task 008: 인증 시스템 구현 (Supabase Auth + Next.js 16 Proxy)

- **Phase**: 3 (핵심 기능 구현)
- **상태**: 완료
- **우선순위**: 높음
- **유형**: 비즈니스 로직 / 보안

## 개요 (고수준 명세서)

더미 폼 제출을 **실제 Supabase Auth**로 교체하고, `proxy.ts`로 보호/비보호 라우트를 올바르게 분기하며, 헤더에 로그인 사용자 이메일과 로그아웃 버튼을 연동한다.

범위와 경계:

- **회원가입/로그인**: `supabase.auth.signUp()` / `signInWithPassword()`를 브라우저 클라이언트에서 직접 호출. 성공 시 `router.push('/timer')`, 실패 시 인라인 에러. **이메일 확인 비활성화**는 Supabase 대시보드 설정(Authentication → Email → Enable email confirmations 해제)이므로 코드 변경 없음.
- **로그아웃**: `"use server"` Server Action(`app/actions/auth.ts`)에서 `supabase.auth.signOut()` + `redirect('/login')`. `SiteHeader`의 로그아웃 버튼을 `<form action={...}>`으로 연동.
- **proxy.ts 세션 갱신**: `@supabase/ssr` 공식 패턴 — `createServerClient` + `supabase.auth.getUser()` 호출로 만료 토큰 갱신, 쿠키를 응답에 전파.
- **보호 라우트 (`/timer`, `/garden`)**: proxy.ts에서 미인증 시 `/login` 리디렉션(optimistic) + `(app)/layout.tsx`에서 `supabase.auth.getUser()` 서버 측 재검증 + 미인증 시 `redirect('/login')`.
- **비보호 라우트 (`/`, `/login`, `/signup`)**: proxy.ts에서 인증 사용자를 `/timer`로 리디렉션(optimistic).
- **헤더 이메일**: `(app)/layout.tsx`(서버 컴포넌트)가 세션 이메일을 추출해 `SiteHeader`에 `email` prop으로 전달.
- **`(auth)/layout.tsx` 수정 없음**: auth 레이아웃은 proxy.ts의 optimistic 체크만으로 충분(비로그인 전용). 서버 컴포넌트 재검증은 범위 밖.

## 현재 상태 (파악 결과)

- `components/auth/login-form.tsx`: `onSubmit`이 더미 비동기(센티넬 에러 시연). `formError` 상태 + 인라인 에러 영역 이미 구현됨. React Hook Form + Zod 클라이언트 검증 완성 → **`onSubmit`만 교체**.
- `components/auth/signup-form.tsx`: `onSubmit`이 더미 비동기. React Hook Form + Zod 완성 → **`onSubmit`만 교체**.
- `proxy.ts`: 빈 골격 — `NextResponse.next()` 반환만. `request` 파라미터 없음 → **전면 교체**.
- `app/(app)/layout.tsx`: 서버 측 세션 검증 없음 → **`getUser()` 추가 및 이메일 추출**.
- `components/site-header.tsx`: `"use client"`. `email` prop 없음, 로그아웃 `disabled` → **`email` prop 추가 + 로그아웃 Server Action 연동**.
- `lib/supabase/client.ts`: `createBrowserClient` 래퍼 완성 → 재사용.
- `lib/supabase/server.ts`: `createServerClient` + cookies() 래퍼 완성 → 재사용.
- `lib/schemas.ts`: `loginSchema`, `signupSchema` 정의됨 → 재사용.
- Supabase 이메일 확인 비활성화: Supabase 대시보드에서 미리 완료되어 있어야 함(Task 007 설정 가정). 가입 즉시 자동 로그인.

## 설계 결정

### 폼 제출 방식: 브라우저 클라이언트 직접 호출
기존 React Hook Form 구조(Zod 클라이언트 검증 → `onSubmit`)를 유지한다. `onSubmit`에서 `createClient()`(브라우저 클라이언트)를 호출해 `signUp` / `signInWithPassword`를 실행한다.
- **장점**: 기존 폼 구조 최대 보존, 인라인 에러 표시 패턴 유지.
- **주의**: 성공 후 리디렉션은 `router.push('/timer')`(클라이언트 라우터). 세션 쿠키는 `@supabase/ssr` 브라우저 클라이언트가 자동으로 쓴다.

### 로그아웃: Server Action
`app/actions/auth.ts` (`"use server"`)에 `signOutAction` 정의. `SiteHeader`(클라이언트 컴포넌트)에서 `<form action={signOutAction}>` 형태로 연동. Next.js App Router에서 클라이언트 컴포넌트가 Server Action을 form action으로 사용하는 표준 패턴.

### proxy.ts: `@supabase/ssr` 공식 Next.js proxy 패턴
`createServerClient` + `request.cookies` / `supabaseResponse.cookies`로 쿠키를 전파한다. `supabase.auth.getUser()` 호출 사이에 분기(if/else, early return) 없이 반드시 `await` 완료 후 리디렉션 로직 실행 — SSR 문서의 주의 사항.

보호/비보호 경로 분류:
- `PROTECTED = ['/timer', '/garden']`
- `PUBLIC_AUTH = ['/', '/login', '/signup']` (로그인 사용자 → `/timer`)

### `(app)/layout.tsx` 이중 검증
proxy.ts optimistic 체크 + layout에서 `auth.getUser()` 서버 측 재검증. 미인증 시 `redirect('/login')`. 인증 시 `user.email`을 `SiteHeader`에 전달.

### `SiteHeader` 변경
- `email?: string` prop 추가.
- private variant: `email ?? 'user@example.com'`으로 표시 (이메일 없는 edge case 방어).
- 로그아웃: `<form action={signOutAction}><button type="submit">로그아웃</button></form>`. `disabled` 제거.

## 목표 파일 구조

```
app/actions/
└── auth.ts                     # 신규 "use server": signOutAction
proxy.ts                        # 수정: 세션 갱신 + 보호/비보호 라우트 리디렉션
app/(app)/layout.tsx            # 수정: getUser() 서버 측 검증 + email 추출
components/site-header.tsx      # 수정: email prop + 로그아웃 form 연동
components/auth/login-form.tsx  # 수정: onSubmit → signInWithPassword
components/auth/signup-form.tsx # 수정: onSubmit → signUp
```

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `app/actions/auth.ts` | 신규 | `signOutAction` Server Action — signOut + redirect |
| `proxy.ts` | 수정 | `@supabase/ssr` 세션 갱신 + 보호/비보호 라우트 분기 |
| `app/(app)/layout.tsx` | 수정 | 서버 측 `getUser()` 검증 → email 추출 → SiteHeader 전달 |
| `components/site-header.tsx` | 수정 | `email` prop + 로그아웃 `<form action>` |
| `components/auth/login-form.tsx` | 수정 | `onSubmit` → `signInWithPassword` + router.push |
| `components/auth/signup-form.tsx` | 수정 | `onSubmit` → `signUp` + router.push |
| `lib/supabase/client.ts` | 재사용 | 브라우저 Supabase 클라이언트 |
| `lib/supabase/server.ts` | 재사용 | 서버 Supabase 클라이언트 |

## 수락 기준 (Acceptance Criteria)

- [ ] 회원가입 성공 시 이메일 확인 없이 즉시 `/timer`로 리디렉션된다.
- [ ] 로그인 성공 시 `/timer`로 리디렉션된다.
- [ ] 잘못된 자격 증명(이메일 미존재 또는 비밀번호 불일치) 로그인 시 폼 상단 인라인 에러가 표시된다.
- [x] 비로그인 상태로 `/timer` 또는 `/garden`에 직접 접근하면 `/login`으로 리디렉션된다. _(Playwright로 검증: `/timer` → `/login`)_
- [ ] 로그인 상태로 `/login`, `/signup`, `/`에 접근하면 `/timer`로 리디렉션된다.
- [ ] 로그아웃 후 세션이 무효화되고 `/login`으로 이동하며, 이후 보호 라우트 접근 시 다시 `/login`으로 리디렉션된다.
- [ ] 로그인된 헤더에 실제 사용자 이메일이 표시된다.
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/경고 없음).

## 구현 단계

> 코드 작성 전 `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`(Proxy 패턴)와 `@supabase/ssr` 공식 Next.js proxy 예시를 확인할 것. proxy.ts의 `supabase.auth.getUser()` 호출과 분기 사이에 early return이 없어야 한다.

- [x] `app/actions/auth.ts` 작성 (`"use server"`, `signOutAction` — `signOut()` + `redirect('/login')`)
- [x] `proxy.ts` 수정 (`@supabase/ssr` 패턴으로 세션 갱신, 보호/비보호 라우트 리디렉션)
- [x] `app/(app)/layout.tsx` 수정 (`getUser()` 서버 측 검증, 미인증 시 `redirect`, `email` 추출 → `SiteHeader` 전달)
- [x] `components/site-header.tsx` 수정 (`email` prop 추가, 로그아웃 `<form action={signOutAction}>` 연동, `disabled` 제거)
- [x] `components/auth/signup-form.tsx` 수정 (`onSubmit` → `createClient().auth.signUp()` + `router.push('/timer')` + 에러 처리)
- [x] `components/auth/login-form.tsx` 수정 (`onSubmit` → `createClient().auth.signInWithPassword()` + `router.push('/timer')` + 에러 처리)
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 테스트 체크리스트 (수동 / Playwright)

- [ ] **회원가입 → 자동 로그인 → 타이머 리디렉션**: 신규 이메일로 회원가입 → 확인 없이 `/timer`로 이동, 헤더에 이메일 표시 확인
- [ ] **잘못된 자격 증명**: 가입하지 않은 이메일 또는 틀린 비밀번호 → 인라인 에러 메시지 표시, 리디렉션 없음
- [ ] **보호 라우트 접근 차단**: 비로그인 상태에서 `/timer`, `/garden` 직접 URL 입력 → `/login` 리디렉션 확인
- [ ] **로그인 사용자 비보호 라우트 차단**: 로그인 상태에서 `/login`, `/signup` 방문 → `/timer` 리디렉션 확인
- [ ] **로그아웃**: 헤더 드롭다운 → 로그아웃 클릭 → `/login` 이동, 이후 `/timer` 직접 접근 시 `/login` 재리디렉션 확인
- [ ] **세션 지속**: 로그인 후 브라우저 새로고침 → 여전히 로그인 상태, `/timer` 접근 가능
- [ ] **토큰 갱신**: (수동 확인 생략 가능) proxy.ts가 요청마다 실행되는지 개발자 도구 네트워크 탭으로 확인

## 변경 사항 요약

더미 폼 제출을 실제 Supabase Auth로 교체하고, Next.js 16 Proxy로 세션 갱신 및 보호/비보호 라우트 분기를 구현했다.

### 신규 파일
- `app/actions/auth.ts`: `"use server"` `signOutAction` — `supabase.auth.signOut()` 후 `redirect('/login')`.

### 수정 파일
- `proxy.ts`: 빈 골격을 `@supabase/ssr` 공식 패턴으로 전면 교체. `createServerClient`로 요청/응답 쿠키를 동기화하고 `getUser()`로 세션을 갱신한다. `createServerClient`와 `getUser()` 사이에 분기를 두지 않는 SSR 권장 패턴 준수. `PROTECTED=['/timer','/garden']` 미인증 → `/login`, `PUBLIC_AUTH=['/','/login','/signup']` 인증 사용자 → `/timer` optimistic 리디렉션.
- `app/(app)/layout.tsx`: 서버 컴포넌트로 전환. `getUser()` 재검증 후 미인증 시 `redirect('/login')`, 인증 시 `user.email`을 `SiteHeader`에 전달.
- `components/site-header.tsx`: `email?: string` prop 추가, `LogoutMenuItem`(`<form action={signOutAction}>` + submit 버튼) 추가, 데스크톱/모바일 양쪽 placeholder 교체 및 `disabled` 제거.
- `components/auth/login-form.tsx`: `onSubmit`을 `signInWithPassword`로 교체. 실패 시 인라인 에러, 성공 시 `router.push('/timer')` + `router.refresh()`.
- `components/auth/signup-form.tsx`: `onSubmit`을 `signUp`으로 교체. `formError` 상태 + 인라인 에러 영역 추가, 성공 시 `router.push('/timer')` + `router.refresh()`.

### 검증
- `npx tsc --noEmit`·`npm run lint`·`npm run build` 모두 통과. 빌드 결과 `/timer`·`/garden`이 동적(ƒ)으로, Proxy(Middleware)가 등록됨.
- Playwright: 비로그인 상태 `/timer` 접근 → `/login` 리디렉션 확인(콘솔 에러 없음).
- 회원가입/로그인/로그아웃 전체 플로우는 실제 Supabase 계정 생성을 동반하므로 수동 검증 항목으로 남겨둠.
