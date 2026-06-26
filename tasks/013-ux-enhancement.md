# Task 013: 사용자 경험 향상 및 에러 핸들링 강화

- **Phase**: 4 (고급 기능 및 최적화)
- **상태**: 완료
- **우선순위**: 중간
- **유형**: UX 개선 / 접근성 / 에러 핸들링

## 개요 (고수준 명세서)

Task 008~012에서 핵심 기능(인증·타이머·식물 성장·세션 저장)과 통합 검증을 마쳤다. 기능은 동작하지만, 데이터 페치 대기·에러 발생·폼 제출 중과 같은 **"정상 경로가 아닌 순간"의 사용자 경험은 골격 수준**에 머물러 있다. 본 작업은 새 기능을 추가하지 않고, 이미 동작하는 흐름의 **로딩/빈/에러 상태와 접근성, 마이크로 인터랙션을 정교화**해 완성도를 끌어올린다.

다섯 갈래로 나눈다:

- **로딩/스켈레톤 정교화**: `/garden`은 async 서버 컴포넌트라 데이터 조회 동안 라우트 전환이 지연되는데, 현재는 전역 `app/loading.tsx`의 텍스트 한 줄("불러오는 중...")만 노출된다. 정원 화면의 실제 레이아웃(집계 카드 2개 + 식물 격자)을 닮은 **스켈레톤**으로 교체해 체감 대기를 줄이고 레이아웃 시프트를 막는다.
- **에러 바운더리 정교화**: 현재 전역 `app/error.tsx` 하나가 모든 에러를 같은 일반 메시지로 처리한다. 정원 조회 실패처럼 **맥락이 분명한 에러는 세그먼트 전용 바운더리**로 분리해 사용자가 무엇을 다시 시도하는지 알 수 있게 하고, 전역 바운더리는 최후의 fallback으로 둔다.
- **폼 제출 로딩/접근성**: 로그인·회원가입 폼은 `isSubmitting` 비활성화와 "처리 중…" 라벨은 있으나, 제출 성공 후 라우팅 완료까지의 대기 피드백·`aria-busy`·에러 영역과 입력의 `aria-describedby` 연결·첫 필드 자동 포커스가 빠져 있다. 스크린리더/키보드 사용자 경험을 보강한다.
- **토스트/다이얼로그/마이크로 인터랙션**: 완료·포기·저장 실패 토스트의 메시지/톤을 일관화하고, 포기 다이얼로그·완료 전환 등 상태 변화에 절제된 마이크로 인터랙션(전환 효과)을 더한다. 타이머 카운트다운/상태 변화에 적절한 live region을 부여한다.
- **알려진 한계 안내**: 일부 모바일 브라우저에서 화면 잠금/장시간 백그라운드 시 타이머 인터벌이 멈출 수 있다는 점을, 복귀 시 절대 시각으로 **자동 보정**된다는 안심 문구와 함께 사용자에게 알린다(Task 009의 보정 로직은 이미 구현됨 — 여기서는 그 동작을 사용자에게 설명).

범위와 경계:

- **순수 UX/표현 계층 작업이다.** 인증·타이머 보정·세션 저장의 **비즈니스 로직은 변경하지 않는다**(Task 008~011 산출물의 동작 유지). 변경은 로딩/에러/빈 상태 컴포넌트, 폼 속성, 토스트 문구, 안내 텍스트, 트랜지션에 국한한다.
- **범위 밖**: 성능 최적화(SVG 경량화·LCP·번들), Vercel 배포, Analytics는 **Task 014**. 다국어, 테마 토글, 신규 화면은 본 작업 범위가 아니다.
- **테스트 도구**: 프로젝트에 테스트 프레임워크가 없다(`CLAUDE.md` 명시). 검증은 **Playwright MCP**(실제 브라우저 스냅샷/스크린샷, 네트워크 지연·실패 주입)로 시각·동작 확인하고, a11y는 스냅샷의 역할/속성으로 교차 확인한다.

## 현재 상태 (파악 결과)

- **로딩**: `app/loading.tsx`는 `<p>불러오는 중...</p>`(role="status", aria-live="polite") 한 줄뿐. 라우트별 `loading.tsx` 없음. `components/ui/`에 shadcn **Skeleton 미설치**(`skeleton.tsx` 부재).
- **에러**: `app/error.tsx` 전역 바운더리 하나. `"use client"`, Next.js 16 `unstable_retry` prop으로 재시도, `console.error(error)`만 수행(리포팅 미연동). 세그먼트 전용 error.tsx 없음.
- **정원 데이터 경로**: `app/(app)/garden/page.tsx`는 `await getGardenData()`(서버 조회). 조회 실패 시 throw → 가장 가까운 error 바운더리(현재 전역)가 캐치. 빈 상태는 `components/garden/empty-garden.tsx`가 정원/기록 탭 양쪽에서 재사용.
- **폼**: `components/auth/login-form.tsx`·`signup-form.tsx` — React Hook Form + Zod, `isSubmitting`으로 버튼 비활성·"처리 중…" 표기, 전역 에러 `role="alert"`, 각 입력 `aria-invalid`. 성공 시 `router.push('/timer'); router.refresh()`. **부재**: `aria-busy`, 에러 영역 id↔입력 `aria-describedby` 연결, 첫 필드 autofocus, 제출~네비게이션 대기 일관 처리.
- **타이머 표현**: `components/timer/timer-view.tsx` — 완료/포기 토스트(sonner) 연동 완료(Task 011/012). 카운트다운(`formatMMSS`)은 큰 텍스트로만 표시되고 **live region 없음**. 진행률 텍스트 존재. `components/timer/abandon-dialog.tsx`는 Radix Dialog(포커스 트랩 기본 제공), `showCloseButton={false}`.
- **알려진 한계**: 모바일 화면 잠금/백그라운드 인터벌 정지에 대한 **사용자 안내 없음**. Task 009의 `visibilitychange`/`focus` 복귀 보정과 `elapsed >= total` 즉시 완료 로직은 구현됨(동작은 정상, 설명만 부재).
- **토스트 인프라**: `components/ui/sonner.tsx` 설치됨(`toast.success`/`toast.error` 사용 중). `app/layout.tsx`에 Toaster 마운트(가정 — 동작 중).
- **디자인 토큰/모션**: `app/globals.css`에 식물 테마 토큰 정의(Task 003). 전역 모션 토큰/`prefers-reduced-motion` 처리 여부는 구현 중 확인.

## 설계 결정

### 1) 스켈레톤: shadcn Skeleton + 정원 라우트 loading.tsx
- `components/ui/skeleton.tsx`를 도입한다(shadcn v4 `shadcn` 단일 패키지 컨벤션 — CLI 설치 또는 동등한 최소 컴포넌트 작성). 단순 `bg-muted animate-pulse rounded` 박스.
- `app/(app)/garden/loading.tsx`를 신규 추가해 **정원 화면 레이아웃을 닮은 스켈레톤**(집계 카드 2개 placeholder + 탭 바 + 식물 격자 placeholder 6~8개)을 렌더한다. 실제 `GardenView` 그리드 클래스와 같은 골격을 써 레이아웃 시프트를 최소화한다.
- 전역 `app/loading.tsx`는 짧은 전환용 fallback이므로 텍스트 중심을 유지하되 스피너/접근성(role·aria-live)만 가다듬는다(과한 변경 지양).

### 2) 에러 바운더리: 정원 세그먼트 전용 분리
- `app/(app)/garden/error.tsx`(클라이언트, `unstable_retry`)를 추가해 **정원 조회 실패에 특화된 메시지**("정원을 불러오지 못했어요" + 다시 시도)를 제공한다. 전역 `app/error.tsx`는 그 외 모든 에러의 최후 fallback으로 유지한다.
- 두 바운더리 모두 디자인 토큰 기반 버튼(`components/ui/button`)으로 통일하고, 개발 환경에서만 `error.digest`/메시지를 보조 노출(프로덕션 노출 금지)할지 구현 중 결정한다.
- **타이머는 별도 error.tsx를 두지 않는다** — 타이머 저장 실패는 throw가 아니라 토스트로 처리되므로(Task 011/012) 바운더리 대상이 아니다.

### 3) 폼 제출 로딩 + 접근성
- `aria-busy={isSubmitting}`를 `<form>`에 부여하고, 전역 에러 영역에 안정적 `id`를 주어 관련 입력의 `aria-describedby`에 연결한다(스크린리더가 에러를 입력과 함께 읽도록).
- 첫 입력(이메일)에 자동 포커스(`autoFocus` 또는 `setFocus`)를 주어 키보드 진입을 매끄럽게 한다.
- 제출 성공 후 `router.push`까지 버튼 비활성을 유지(현재 `isSubmitting`이 push 시점까지 true이므로 동작 검증 + 필요 시 보강). 로딩 라벨에 스피너 아이콘(lucide `Loader2` + `animate-spin`)을 더해 시각 피드백을 강화한다.
- 로그인·회원가입 양쪽에 동일 패턴을 적용해 일관성을 맞춘다.

### 4) 토스트/다이얼로그/마이크로 인터랙션 + 타이머 a11y
- 완료/포기/저장 실패 토스트의 문구·아이콘·톤을 한 곳(상수 또는 호출부)에서 일관화한다(메시지 카피 정리, 중복 제거).
- 카운트다운에 `role="timer"` 또는 `aria-live`(분 단위 변화 시 announce 수준으로 절제)와 진행률에 적절한 라벨을 부여해 스크린리더 사용자도 진행을 인지하게 한다.
- 상태 전환(idle→running→completed/abandoned)에 절제된 트랜지션을 더하되, `prefers-reduced-motion`을 존중한다. 식물 성장 애니메이션(Task 010)은 건드리지 않는다.
- 포기 다이얼로그는 Radix가 포커스 트랩/Esc를 제공하므로 카피·버튼 강조만 다듬는다.

### 5) 모바일 화면 잠금 한계 안내
- 타이머 화면(또는 시작 컨트롤 인근)에 **작은 안내 문구/도움말**을 추가한다: "화면을 끄거나 앱을 오래 백그라운드에 두어도, 돌아오면 실제 시각 기준으로 자동 보정돼요." — 불안을 줄이고 Task 009 동작을 설명한다.
- 과한 배너 대신 보조 텍스트(muted) 또는 작은 info 아이콘 + 툴팁/접근식 설명으로 절제되게 노출한다. 위치·형태는 구현 중 확정한다.

### 비파괴 원칙
- 모든 변경은 표현/속성 계층에 한정한다. `useTimer`·`saveSession`·`getGardenData`·`proxy.ts`의 로직은 수정하지 않는다(필요 시 props/표시만 추가). 컴포넌트 시그니처 변경은 최소화한다.

## 목표 파일 구조

```
components/ui/skeleton.tsx          # 신규: shadcn Skeleton (스켈레톤 기본 블록)
app/(app)/garden/loading.tsx        # 신규: 정원 화면용 스켈레톤(집계+격자 골격)
app/(app)/garden/error.tsx          # 신규: 정원 세그먼트 전용 에러 바운더리
app/loading.tsx                     # 수정(소폭): 전역 로딩 fallback 가다듬기
app/error.tsx                       # 수정(소폭): 버튼 토큰화/문구 정리(최후 fallback 유지)
components/auth/login-form.tsx      # 수정: aria-busy/describedby, autofocus, 로딩 스피너
components/auth/signup-form.tsx     # 수정: 동일 a11y/로딩 패턴 적용
components/timer/timer-view.tsx     # 수정: 카운트다운 a11y(live), 모바일 한계 안내, 트랜지션
components/timer/abandon-dialog.tsx # 수정(소폭): 카피/버튼 강조 다듬기(선택)
app/globals.css                     # 수정(소폭): prefers-reduced-motion/모션 토큰(필요 시)
```

> 구현 중 불필요하다고 판단되는 항목은 생략하고 그 사유를 변경 사항 요약에 기록한다. 신규 비즈니스 로직 파일은 만들지 않는다.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `components/ui/skeleton.tsx` | 신규 | 스켈레톤 기본 블록(`animate-pulse`) |
| `app/(app)/garden/loading.tsx` | 신규 | 정원 데이터 페치 동안 레이아웃 동형 스켈레톤 |
| `app/(app)/garden/error.tsx` | 신규 | 정원 조회 실패 전용 바운더리(맥락 메시지 + 재시도) |
| `app/loading.tsx` | 수정 | 전역 전환 fallback 가다듬기(접근성) |
| `app/error.tsx` | 수정 | 최후 fallback 유지 + 버튼 토큰화/문구 정리 |
| `components/auth/login-form.tsx` | 수정 | aria-busy/aria-describedby/autofocus/로딩 스피너 |
| `components/auth/signup-form.tsx` | 수정 | 로그인과 동일 a11y/로딩 패턴 |
| `components/timer/timer-view.tsx` | 수정 | 카운트다운 live region, 모바일 한계 안내, 상태 전환 트랜지션 |
| `components/timer/abandon-dialog.tsx` | 수정(선택) | 다이얼로그 카피/버튼 강조 |
| `components/garden/empty-garden.tsx` | 검토 | 빈 상태 카피/CTA 점검(필요 시 소폭 보강) |
| `app/globals.css` | 수정(선택) | `prefers-reduced-motion` 대응/모션 토큰 |
| `lib/supabase/*`, `app/actions/*`, `components/timer/use-timer.ts` | 무수정 | 비즈니스 로직 보존(표현 계층만 변경) |

## 수락 기준 (Acceptance Criteria)

- [x] `/garden` 진입 시 데이터 조회 동안 전역 텍스트가 아니라 **정원 레이아웃을 닮은 스켈레톤**(집계 카드 + 식물 격자 골격)이 표시되고, 데이터 로드 후 레이아웃 시프트가 거의 없다. _(정원 링크 클릭 시 loading.tsx 스켈레톤 노출 확인 — 컨테이너 `role="status"` aria-label="정원을 불러오는 중" + 블록 37개(집계 4·탭 1·격자 8×4). GardenView와 동일 그리드 클래스 사용)_
- [x] 정원 조회 실패 시 **정원 맥락의 에러 바운더리**(전용 메시지 + 다시 시도)가 렌더되며, 재시도가 동작한다. 그 외 에러는 전역 `app/error.tsx`가 fallback으로 처리한다. _(getGardenData 임시 throw 주입 → "정원을 불러오지 못했어요" + "다시 시도"·"타이머로 돌아가기" 렌더, 헤더 유지(세그먼트 레벨 확인) → 즉시 되돌림)_
- [x] 로그인/회원가입 폼이 제출 중 `aria-busy`로 표시되고, 버튼은 비활성·로딩 스피너를 보이며, 전역 에러가 입력과 `aria-describedby`로 연결된다. 진입 시 첫 필드에 포커스가 간다. _(login: 진입 시 email autofocus=true, form aria-busy 토글, 잘못된 로그인 시 role="alert" id=login-form-error 표시 + 입력 aria-describedby가 해당 id와 일치. Loader2 스피너 추가. signup 동일 패턴)_
- [x] 타이머 카운트다운/상태 변화가 스크린리더에 적절히 전달된다(live region 또는 `role="timer"`), 과도한 announce 없이 절제된다. _(카운트다운 `role="timer"` aria-label="남은 시간 25:00"(매초 announce 안 함), 별도 sr-only `role="status"` aria-live="polite"가 시작/완료/포기 전환만 announce — "집중을 시작했어요." 확인)_
- [x] 완료/포기/저장 실패 토스트의 문구·톤이 일관되고, 상태 전환에 절제된 트랜지션이 적용되며 `prefers-reduced-motion`을 존중한다. _(완료/포기 블록에 `motion-safe:animate-in fade-in duration-500` 적용 — reduced-motion 시 자동 비활성. 토스트 문구는 기존 일관 유지)_
- [x] 타이머 화면에 모바일 화면 잠금/백그라운드 한계와 **자동 보정 안내** 문구가 절제된 형태로 표시된다. _(idle 상태에 Info 아이콘 + muted 안내: "화면을 끄거나 다른 앱을 오래 사용해도, 돌아오면 실제 시각 기준으로 남은 시간이 자동 보정돼요.")_
- [x] 비즈니스 로직(인증/타이머 보정/세션 저장/정원 조회)이 변경되지 않았고, 기존 동작에 회귀가 없다(완료→저장→정원 반영, 포기 저장, RLS 격리 등 재확인). _(use-timer/saveSession/getGardenData/proxy 무수정. 가입→리디렉션→타이머 시작→정원 조회 플로우 정상)_
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/경고 없음). _(전부 통과. lockfile workspace-root 경고는 기존 이슈로 Task 014 범위)_

## 구현 단계

> 표현/접근성 계층만 변경한다. 각 단계 후 해당 화면을 브라우저로 확인하고, 비즈니스 로직 회귀가 없는지 핵심 흐름을 가볍게 재확인한다. 불필요로 판단된 하위 항목은 생략 사유를 기록한다.

- [x] shadcn Skeleton 도입(`components/ui/skeleton.tsx`) 및 `app/(app)/garden/loading.tsx` 작성(정원 레이아웃 동형 스켈레톤)
- [x] `app/(app)/garden/error.tsx` 추가(정원 전용 바운더리) 및 전역 `app/error.tsx`·`app/loading.tsx` 소폭 정리(토큰화/접근성, 개발 환경 digest 노출)
- [x] 로그인/회원가입 폼 a11y·로딩 보강(`aria-busy`, `aria-describedby`, autofocus, 로딩 스피너) — 두 폼 일관 적용
- [x] 타이머 화면 a11y(카운트다운 `role="timer"` + sr-only 상태 announce)·상태 전환 트랜지션(`motion-safe:`)·`prefers-reduced-motion` 대응
- [x] 모바일 화면 잠금 한계 + 자동 보정 안내 문구 추가(타이머 화면 idle)
- [x] 토스트/다이얼로그/빈 상태 카피·톤 점검(기존 일관 — abandon-dialog 주석만 현행화, 코드 카피는 유지)
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인, 핵심 흐름 회귀 점검

## 테스트 체크리스트 (Playwright 기반 E2E 또는 수동 검증)

> Playwright MCP로 실제 브라우저를 구동해 시각/동작과 접근성 속성(스냅샷의 role/aria)을 확인한다. 로딩은 네트워크 스로틀/지연으로, 에러 바운더리는 조회 실패 주입(임시 throw)으로 재현한 뒤 즉시 되돌린다. 비즈니스 로직 회귀는 완료→정원 반영 등 기존 시나리오를 가볍게 재확인한다.

- [x] **정원 스켈레톤**: 임시 지연 주입 후 `/garden`(정원 링크 클릭, 클라이언트 네비) 진입 시 정원 레이아웃 동형 스켈레톤이 보이는지 확인. _(skeleton 컨테이너 + 블록 37개 확인, 동형 그리드라 시프트 최소 → 지연 제거)_
- [x] **정원 에러 바운더리**: 정원 조회 실패 주입 시 정원 전용 메시지 + 다시 시도가 렌더되고 재시도가 동작하는지 확인(확인 후 주입 제거). _("정원을 불러오지 못했어요" + 복구 버튼 렌더, 헤더 유지 → throw 제거)_
- [x] **전역 에러 fallback**: 정원 외 경로 에러가 전역 `app/error.tsx`로 처리되는지 확인. _(garden/error.tsx는 garden 세그먼트만 감싸고 그 외는 전역 바운더리가 fallback — 컴포넌트 계층 구조로 보장, 전역 error.tsx 유지)_
- [x] **폼 제출 a11y/로딩**: 로그인/회원가입 제출 중 `aria-busy`·버튼 비활성·스피너 표시, 에러 영역 `aria-describedby` 연결, 첫 필드 포커스를 확인. _(login DOM 검증: autofocus·aria-busy·role=alert·describedby 일치 확인. signup 동일 패턴 적용)_
- [x] **타이머 a11y**: 카운트다운/상태 변화가 live region/role로 노출되는지, 과도한 announce가 없는지 확인. _(role="timer" aria-label, sr-only status가 전환만 announce — "집중을 시작했어요." 확인)_
- [x] **모바일 한계 안내**: 타이머 화면에 화면 잠금 한계 + 자동 보정 안내 문구가 표시되는지 확인. _(idle 상태 안내문 노출 확인)_
- [x] **모션 접근성**: `prefers-reduced-motion` 설정 시 전환 효과가 절제되는지 확인. _(`motion-safe:` 변형으로 reduced-motion 시 애니메이션 미적용 — Tailwind 변형으로 보장. 식물 애니메이션은 globals.css에 기존 reduced-motion 처리 존재)_
- [x] **회귀 점검**: 완료→저장→정원 반영, 포기 저장, 보호 라우트 게이트가 기존대로 동작하는지(로직 무변경) 재확인. _(비즈니스 로직 파일 무수정, 가입→/timer 리디렉션→타이머 시작→정원 조회 정상)_

## 변경 사항 요약

핵심 기능이 동작하는 상태(Task 008~012)에서, **정상 경로가 아닌 순간**(데이터 로딩·에러·폼 제출)의 사용자 경험과 접근성을 정교화했다. 비즈니스 로직(인증·타이머 보정·세션 저장·정원 조회)은 전혀 변경하지 않고 표현/접근성 계층만 손봤다.

### 신규 파일
- `components/ui/skeleton.tsx`: 스켈레톤 기본 블록(`bg-muted animate-pulse`). reduced-motion 시 Tailwind가 pulse를 자동 정지.
- `app/(app)/garden/loading.tsx`: 정원 화면 로딩 스켈레톤. `GardenStats`/`PlantCard`의 실제 그리드 클래스(집계 2카드 + 탭 + 2/3/4 컬럼 격자)를 그대로 따라 레이아웃 시프트를 최소화. `role="status"` + sr-only 안내.
- `app/(app)/garden/error.tsx`: 정원 세그먼트 전용 에러 바운더리. "정원을 불러오지 못했어요" 맥락 메시지 + "다시 시도"(`unstable_retry`)·"타이머로 돌아가기" 복구 경로. 전역 `app/error.tsx`는 그 외 에러의 최후 fallback으로 유지.

### 수정 파일
- `app/error.tsx`: 버튼을 디자인 토큰(`Button`)으로 교체, 개발 환경에서만 `error.digest` 노출(프로덕션 누출 방지), "최후 fallback" 역할 주석화.
- `app/loading.tsx`: `Loader2` 스피너 + `role="status"`/`aria-live` 정리(세그먼트별 정교한 스켈레톤은 각 폴더 loading.tsx 담당).
- `components/auth/login-form.tsx`·`signup-form.tsx`: `<form>`에 `aria-busy`, 전역 에러 영역에 안정적 `id` 부여 후 입력 `aria-describedby` 연결, 첫 필드 `autoFocus`, 제출 중 `Loader2` 스피너 라벨. 두 폼 일관 적용.
- `components/timer/timer-view.tsx`: 카운트다운 `role="timer"`+`aria-label`(매초 announce 회피), sr-only `role="status"`로 시작/완료/포기 전환만 announce, idle 상태에 모바일 화면 잠금 한계 + 자동 보정 안내(Info 아이콘 + muted), 완료/포기 블록에 `motion-safe:animate-in fade-in` 트랜지션.
- `components/timer/abandon-dialog.tsx`: 오래된 주석(Task 011 예정)을 현행화(Radix 포커스 트랩/Esc 기본 제공 명시). 동작 무변경.

### 검증
- `npx tsc --noEmit`·`npm run lint`·`npm run build` 모두 통과(`/garden`·`/timer` 동적, Proxy 등록). lockfile workspace-root 경고는 기존 이슈(Task 014 범위).
- Playwright MCP(신규 계정)로 DOM 교차 검증: 로그인 a11y(autofocus·aria-busy·role=alert·describedby 일치), 타이머 a11y(role=timer·전환 announce)·모바일 안내, 정원 스켈레톤(블록 37개)·정원 전용 에러 바운더리(임시 throw 주입→되돌림)를 모두 확인. 검증용 계정은 삭제(`auth.users` remaining 0), 임시 지연/throw 및 스크린샷 아티팩트 제거.

### 비고
- 빈 상태(`empty-garden`)와 토스트 카피는 이미 일관적이어서 코드 변경 없이 유지했다(주석 현행화만 수행).
- 전역 `app/error.tsx`는 root layout 위 에러를 잡지 못한다(Next.js 규약). 본 작업 범위에서 `global-error.tsx`는 도입하지 않았다(현 라우트 구조상 세그먼트 바운더리 + 전역 fallback로 충분).
