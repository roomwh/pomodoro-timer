# Task 001: 프로젝트 구조 및 라우팅 설정

- **Phase**: 1 (애플리케이션 골격 구축)
- **상태**: 완료
- **우선순위**: 우선순위 작업
- **유형**: 라우팅/구조 (API·비즈니스 로직 아님)

## 개요 (고수준 명세서)

Next.js 16 App Router의 **Route Groups**를 사용해 애플리케이션을 인증 보호 영역과 비보호 영역으로 분리하고, 앱의 5개 주요 페이지에 대한 빈 골격과 공통 레이아웃·특수 파일을 배치한다. 이 작업은 이후 모든 화면 구현의 기반이 되는 라우팅 토대를 세우는 것이 목적이며, 실제 UI/인증/타이머 로직은 포함하지 않는다.

- `(auth)` — **비로그인 전용** 영역: 랜딩, 로그인, 회원가입
- `(app)` — **로그인 필수** 영역: 타이머, 정원

Route Group 폴더(`(auth)`, `(app)`)는 조직화 목적이며 **URL 경로에 포함되지 않는다**. 세션 갱신/리디렉션 등 실제 인증 동작은 Phase 3(Task 008)에서 구현하며, 이번 작업의 `proxy.ts`는 빈 골격만 둔다.

## 목표 디렉토리 구조

```
app/
├── layout.tsx            # 루트 레이아웃(유일) — metadata 한국어/포모도로로 갱신, lang="ko"
├── globals.css           # 유지
├── not-found.tsx         # 404 UI (서버 컴포넌트)
├── loading.tsx           # 전역 로딩 UI (서버 컴포넌트)
├── error.tsx             # 'use client' 에러 바운더리
├── (auth)/               # 비로그인 전용 영역 (Route Group, URL 미포함)
│   ├── layout.tsx        # 그룹 레이아웃 + 헤더 내비 placeholder
│   ├── page.tsx          # 랜딩    →  /
│   ├── login/
│   │   └── page.tsx      # 로그인   →  /login
│   └── signup/
│       └── page.tsx      # 회원가입 →  /signup
└── (app)/                # 로그인 필수 영역 (Route Group, URL 미포함)
    ├── layout.tsx        # 그룹 레이아웃 + 헤더 내비 placeholder
    ├── timer/
    │   └── page.tsx      # 타이머   →  /timer
    └── garden/
        └── page.tsx      # 정원     →  /garden
proxy.ts                  # 빈 골격 (NextResponse.next() + matcher), 세션 로직은 Phase 3
```

### 설계 근거

- **단일 루트 레이아웃 유지**: `app/layout.tsx`만 `html`/`body`를 가지며, `(auth)`/`(app)`는 그 아래 중첩되는 그룹 레이아웃이다. 다중 루트 레이아웃을 두면 그룹 간 이동 시 full page reload가 발생하므로, 루트 레이아웃은 하나만 둔다.
- **랜딩 `/`는 `(auth)` 그룹에 배치**: 랜딩은 비로그인 사용자 대상(로그인 사용자는 Task 008에서 `/timer`로 리디렉션)이므로 `(auth)`에 둔다. 기존 보일러플레이트 `app/page.tsx`는 `(auth)/page.tsx`와 동일하게 `/`로 해석되어 **경로가 충돌**하므로 제거/대체한다.
- **`proxy.ts` (구 middleware)**: Next.js 16에서 미들웨어 명칭/규약이 `proxy`로 변경되었다. 이번엔 `NextResponse.next()`만 반환하는 빈 골격 + 정적 자산 제외 `matcher`만 두고, 세션 갱신·보호 라우트 리디렉션 로직은 Task 008(Phase 3)에 위임한다.
- **헤더 내비 placeholder**: 실제 헤더 내비 컴포넌트는 Task 003에서 구현하므로, 이번엔 각 그룹 레이아웃에 최소한의 placeholder 마크업만 둔다.
- **특수 파일 규약 (Next.js 16)**: `error.tsx`는 반드시 `'use client'`이며 `error`, `unstable_retry` prop을 받는다. `not-found.tsx`, `loading.tsx`는 서버 컴포넌트로 둔다.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `app/layout.tsx` | 수정 | 루트 레이아웃. `metadata`(현재 "Create Next App")를 포모도로 앱용 한국어로, `lang="en"` → `lang="ko"`로 갱신 |
| `app/page.tsx` | 제거/대체 | 보일러플레이트 랜딩. `(auth)/page.tsx`와 충돌하므로 정리 |
| `app/not-found.tsx` | 신규 | 404 UI placeholder |
| `app/loading.tsx` | 신규 | 전역 로딩 UI placeholder |
| `app/error.tsx` | 신규 | 에러 바운더리 (`'use client'`, `unstable_retry`) |
| `app/(auth)/layout.tsx` | 신규 | 비보호 영역 레이아웃 + 헤더 placeholder |
| `app/(auth)/page.tsx` | 신규 | 랜딩 페이지 골격 (`/`) |
| `app/(auth)/login/page.tsx` | 신규 | 로그인 페이지 골격 (`/login`) |
| `app/(auth)/signup/page.tsx` | 신규 | 회원가입 페이지 골격 (`/signup`) |
| `app/(app)/layout.tsx` | 신규 | 보호 영역 레이아웃 + 헤더 placeholder |
| `app/(app)/timer/page.tsx` | 신규 | 타이머 페이지 골격 (`/timer`) |
| `app/(app)/garden/page.tsx` | 신규 | 정원 페이지 골격 (`/garden`) |
| `proxy.ts` | 신규 | Proxy 빈 골격 + `matcher` |

## 수락 기준 (Acceptance Criteria)

- [x] `(auth)`(비로그인 전용)와 `(app)`(로그인 필수) Route Group으로 영역이 분리되고, 그룹 폴더명이 URL 경로에 노출되지 않는다.
- [x] 5개 주요 페이지가 빈 껍데기로 렌더된다: 랜딩(`/`), 회원가입(`/signup`), 로그인(`/login`), 타이머(`/timer`), 정원(`/garden`).
- [x] 루트 레이아웃(`app/layout.tsx`)과 그룹별 레이아웃이 존재하고, 각 그룹 레이아웃에 헤더 내비 placeholder가 포함된다.
- [x] 루트 레이아웃은 하나만 존재한다(`html`/`body`는 `app/layout.tsx`에만). 그룹 레이아웃은 중첩 레이아웃이다.
- [x] `proxy.ts` 빈 골격이 프로젝트 루트(= `app`과 동일 레벨)에 존재한다. 세션 갱신/리디렉션 로직은 미구현이며 정적 자산 제외 `matcher`가 설정된다.
- [x] `not-found.tsx`, `loading.tsx`, `error.tsx` 기본 파일이 배치된다(`error.tsx`는 `'use client'`).
- [x] 보일러플레이트 `app/page.tsx`의 경로 충돌이 제거된다.
- [x] `npm run lint` 통과.

## 구현 단계

> Next.js 16 규약 변경(Route Groups, `proxy.ts`, 특수 파일 prop)을 코드 작성 전 `node_modules/next/dist/docs/`에서 재확인할 것.

- [x] `app/(auth)`, `app/(app)` Route Group 디렉토리 생성
- [x] `app/(auth)/page.tsx`(랜딩), `login/page.tsx`, `signup/page.tsx` 빈 페이지 골격 작성
- [x] `app/(app)/timer/page.tsx`, `garden/page.tsx` 빈 페이지 골격 작성
- [x] `app/(auth)/layout.tsx`, `app/(app)/layout.tsx` 그룹 레이아웃 + 헤더 placeholder 작성
- [x] 기존 보일러플레이트 `app/page.tsx` 제거(`/` 경로 충돌 해소)
- [x] `app/layout.tsx`의 `metadata`를 포모도로 앱용 한국어로, `lang`을 `ko`로 갱신
- [x] `app/not-found.tsx`, `app/loading.tsx` 작성(서버 컴포넌트)
- [x] `app/error.tsx` 작성(`'use client'`, `error` / `unstable_retry` prop)
- [x] `proxy.ts` 빈 골격 작성(`NextResponse.next()` + 정적 자산 제외 `matcher`)
- [x] `npm run lint` 실행 및 통과 확인 (Next.js 16은 빌드 시 자동 린트하지 않음)

## 검증 시나리오 (수동)

> 본 작업은 API/비즈니스 로직이 아니므로 Playwright E2E는 필수가 아니다. `npm run dev`로 개발 서버를 띄운 뒤 아래를 수동 확인한다.

- [x] `/`, `/login`, `/signup`, `/timer`, `/garden` 각각 정상 렌더(`next build` 정적 생성 8/8 성공)
- [x] 주소창에 그룹 폴더명(`(auth)`, `(app)`)이 노출되지 않는다 — 빌드 라우트 출력에 `/`, `/login`, `/signup`, `/timer`, `/garden`로만 표기됨
- [x] 존재하지 않는 경로 접근 시 `not-found.tsx` 404 UI 표시 — 빌드 결과 `/_not-found` 생성 확인
- [x] `(auth)`/`(app)` 각 그룹 레이아웃에 헤더 placeholder 포함(코드 확인)
- [x] `npm run lint` 통과 (`next build` TypeScript 타입 체크도 통과)

> 비고: `next build`는 워크스페이스 루트 추론 경고를 출력한다(상위 `C:\Users\M2MS\package-lock.json`와 프로젝트 lockfile 2개 감지). 본 작업 범위 밖이며, 추후 `next.config.ts`의 `turbopack.root` 설정 또는 불필요한 lockfile 정리로 해소 가능.

## 변경 사항 요약

- **신규 라우트 구조**: `app/(auth)`(랜딩 `/`·`/login`·`/signup`)와 `app/(app)`(`/timer`·`/garden`) Route Group으로 비보호/보호 영역을 분리. 그룹 폴더명은 URL에 노출되지 않음.
- **레이아웃**: 루트 레이아웃 `app/layout.tsx` 1개 유지(`metadata` 한국어/포모도로로 갱신, `lang="ko"`). `(auth)`/`(app)` 각각에 헤더 내비 placeholder를 가진 중첩 그룹 레이아웃 추가.
- **페이지 골격**: 5개 페이지(`(auth)/page.tsx`, `(auth)/login`, `(auth)/signup`, `(app)/timer`, `(app)/garden`) 빈 껍데기 생성.
- **특수 파일**: `app/not-found.tsx`(404), `app/loading.tsx`(로딩), `app/error.tsx`(`'use client'` 에러 바운더리, `unstable_retry` prop) 배치.
- **Proxy**: 프로젝트 루트에 `proxy.ts` 빈 골격 생성(`NextResponse.next()` + 정적 자산 제외 `matcher`). 세션 갱신/리디렉션은 Task 008로 위임.
- **정리**: 보일러플레이트 `app/page.tsx` 제거(`/` 경로 충돌 해소).
- **검증**: `npm run lint` 통과, `next build` 성공(5개 라우트 + `/_not-found` 정적 생성, Proxy 감지).
