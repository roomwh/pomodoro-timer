# Task 003: 공통 컴포넌트 및 디자인 시스템 구축

- **Phase**: 2 (UI/UX 완성 — 더미 데이터 활용)
- **상태**: 완료
- **우선순위**: 일반
- **유형**: UI/디자인 시스템 (런타임 비즈니스 로직 아님)

## 개요 (고수준 명세서)

Phase 2의 모든 화면(Task 004~006)이 공유할 **디자인 시스템 토대**를 세운다. shadcn/ui v4 공통 컴포넌트를 설치하고, `app/globals.css`에 **식물 테마 디자인 토큰**을 정의하며, 레이아웃마다 하드코딩돼 있는 헤더를 **재사용 컴포넌트로 추출**한다. 또한 화면 개발에 쓸 **더미 데이터 유틸리티**를 작성한다.

범위와 경계:

- **실제 인증/세션 분기 없음**: 헤더는 `variant`(비로그인/로그인) prop으로 분기하는 더미 상태로 구현한다. 실제 세션 기반 분기·이메일 표시·로그아웃 동작은 **Task 008**에서 연결한다.
- **식물별 SVG 색상·성장 단계 색상은 제외**: 이번엔 브랜드(잎 green) 중심 팔레트와 의미 색상만 정의한다. 식물 종류별 색(튤립/해바라기/선인장)은 SVG 에셋과 함께 **Task 005**, 시들기/만개 상태 색은 **Task 010**에서 다룬다.
- **다크 모드 토글 UI 제외**: `globals.css`의 `.dark` 토큰은 유지하되, 토글 버튼/테마 전환 UX는 본 작업 범위 밖이다(라이트 모드 우선).
- **폼 검증 로직 연결 제외**: shadcn `form` 컴포넌트는 설치만 한다. React Hook Form + Zod 실제 연동은 **Task 004**.

## 현재 상태 (파악 결과)

- `components/ui/`에는 `button.tsx`만 존재. Input/Card/Dialog/Form/Sonner 등 미설치.
- `components.json`: `style: radix-nova`, `baseColor: neutral`, `iconLibrary: lucide`, `cssVariables: true`.
- `app/globals.css`: shadcn 기본 **무채색(neutral)** oklch 팔레트. 식물 테마 색 없음.
- **폰트 변수 단절 버그**: `app/layout.tsx`는 `--font-geist-sans`/`--font-geist-mono`를 생성하나, `globals.css @theme inline`은 `--font-sans: var(--font-sans)`로 **자기참조**하여 본문 폰트가 실제로 적용되지 않는다 → 이번 작업에서 바로잡는다.
- 헤더 마크업이 `app/(auth)/layout.tsx`·`app/(app)/layout.tsx`에 **중복 하드코딩**되어 있고 주석에 "Task 003에서 컴포넌트화"로 명시됨.
- `components/container.tsx`(반응형 컨테이너), `lib/types.ts`·`lib/constants.ts`(도메인 타입/상수)는 이미 존재 → 재사용한다.

## 설계 결정

### shadcn 컴포넌트 선정
- 설치 대상: `input`, `label`, `card`, `dialog`, `sonner`, `form`, `dropdown-menu`, `separator`, `badge`.
  - `sonner`: shadcn v4에서 구 `toast`는 deprecated → **Sonner**를 토스트로 채택(완료/포기 피드백, Task 005/011).
  - `form`: Task 004 폼의 기반. 설치 시 `react-hook-form`·`@hookform/resolvers`가 함께 설치됨(zod는 Task 002에서 설치 완료).
  - `dropdown-menu`: 헤더의 사용자 메뉴/모바일 내비용.
  - `badge`: 세션 상태(완료/포기) 표시(Task 006)용.
- 설치 명령은 단일 패키지 `shadcn`(v4) 사용: `npx shadcn@latest add ...`.

### 디자인 토큰 (식물 테마)
- **브랜드 컬러 = 잎 green**: `--primary`를 무채색 → green 계열 oklch로 교체(예: `oklch(0.62 0.14 150)` 근방), `--ring`도 같은 색상(hue)로 맞춘다. 라이트 배경은 약한 green 틴트의 off-white로 따뜻하게.
- **의미 색상 유지**: `--destructive`(포기/에러), `--muted`/`--secondary`/`--accent`는 green 틴트로 재조정. 최종 oklch 값은 구현 단계에서 대비(접근성) 확인 후 확정한다.
- **명명 규칙**: shadcn 토큰 체계(`--primary`, `--accent` 등)를 유지하여 컴포넌트와 호환. 식물 종류별/상태별 전용 변수(`--plant-*`)는 도입하지 않는다(Task 005/010 위임).
- **폰트 변수 정리**: `@theme inline`의 `--font-sans`를 `var(--font-geist-sans)`에 연결하고, 한글 가독성을 위해 시스템 한글 폰트를 fallback 스택에 포함. `--font-heading`은 sans 재사용.

### 헤더 컴포넌트
- `components/site-header.tsx` 신규: `variant: "public" | "private"` prop으로 내비 항목을 분기.
  - `public`(비로그인): 로고 → `/`, 우측 "로그인"/"회원가입".
  - `private`(로그인): 로고 → `/timer`, "타이머"/"정원" + 사용자 영역(이메일/로그아웃) **placeholder**(Task 008에서 실제 연결).
- 모바일에서는 `dropdown-menu`(또는 간단한 토글)로 내비를 접는다. lucide 아이콘(`Leaf`/`Sprout`, `Menu`, `LogOut`) 사용.
- `app/(auth)/layout.tsx`·`app/(app)/layout.tsx`의 하드코딩 헤더를 `<SiteHeader variant=...>`로 교체.

### 더미 데이터
- `lib/mock-data.ts` 신규: `lib/types.ts`의 `FocusSession`/`GardenPlant`를 사용한 더미 배열과 집계 헬퍼(총 완료 수/총 집중 시간). Task 005/006 화면이 import하여 사용.

## 목표 파일 구조

```
components/
├── ui/                   # shadcn add 결과물 (input/label/card/dialog/sonner/form/dropdown-menu/separator/badge)
├── site-header.tsx       # 신규: 헤더 내비 컴포넌트 (variant 분기)
└── container.tsx         # 유지
app/
├── globals.css           # 수정: 식물 테마 토큰 + 폰트 변수 연결 수정
├── layout.tsx            # 수정: <Toaster /> 마운트, 폰트 변수 정리
├── (auth)/layout.tsx     # 수정: <SiteHeader variant="public" />
└── (app)/layout.tsx      # 수정: <SiteHeader variant="private" />
lib/
└── mock-data.ts          # 신규: 더미 세션/정원 데이터 + 집계 헬퍼
```

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `components/ui/*` | 신규(shadcn add) | `input`/`label`/`card`/`dialog`/`sonner`/`form`/`dropdown-menu`/`separator`/`badge` |
| `app/globals.css` | 수정 | 식물 테마 oklch 팔레트, `--font-sans` 연결 수정, 한글 fallback |
| `app/layout.tsx` | 수정 | Sonner `<Toaster />` 마운트, 폰트 변수 정리 |
| `components/site-header.tsx` | 신규 | `variant`별 헤더 내비(로고/링크/사용자 영역 placeholder), 모바일 대응 |
| `app/(auth)/layout.tsx` | 수정 | 하드코딩 헤더 → `<SiteHeader variant="public" />` |
| `app/(app)/layout.tsx` | 수정 | 하드코딩 헤더 → `<SiteHeader variant="private" />` |
| `lib/mock-data.ts` | 신규 | 더미 `FocusSession[]`/`GardenPlant[]` + 집계 헬퍼 |
| `package.json` | 수정 | shadcn add로 추가되는 의존성(`react-hook-form`, `@hookform/resolvers`, `sonner` 등) |

## 수락 기준 (Acceptance Criteria)

- [x] shadcn/ui v4 공통 컴포넌트(`input`/`label`/`card`/`dialog`/`sonner`/`field`/`dropdown-menu`/`separator`/`badge`)가 `components/ui/`에 설치된다. (※ 구 `form` 래퍼는 radix-nova에서 `field`로 대체됨 — 아래 비고 참조)
- [x] `app/globals.css`에 식물 테마(잎 green 브랜드) 디자인 토큰이 정의되고, 무채색 기본 팔레트가 교체된다.
- [x] 폰트 변수 단절 버그가 수정되어 본문/헤딩 폰트가 실제 적용되고, 한글 fallback이 포함된다.
- [x] Sonner `<Toaster />`가 루트 레이아웃에 마운트되어 토스트 호출 기반이 마련된다.
- [x] `components/site-header.tsx`가 `variant`("public"/"private")로 내비를 분기하고, 두 그룹 레이아웃이 하드코딩 헤더 대신 이 컴포넌트를 사용한다.
- [x] 헤더가 모바일/데스크톱에서 반응형으로 동작한다(모바일 내비 접힘 처리).
- [x] `lib/mock-data.ts`가 `lib/types.ts` 타입을 사용한 더미 세션/정원 데이터와 집계 헬퍼를 export한다.
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과.

> **비고 — `form` → `field` 대체**: 현재 shadcn 스타일(`radix-nova`)에서 구 `form` 컴포넌트(react-hook-form 래퍼: `FormField`/`FormItem`/`useFormField`)는 레지스트리에 파일이 없는 스텁이며, 후속 **`Field` primitive 패밀리**(`Field`/`FieldLabel`/`FieldError`/`FieldGroup` 등, 프레임워크 비종속)로 대체되었다. 이에 `field`를 설치하고, Task 004 폼 연동을 위해 `react-hook-form`·`@hookform/resolvers`는 별도로 설치했다. Task 004는 `Field` primitive + RHF `useForm` + zodResolver로 구성한다.

## 구현 단계

> shadcn v4 / Tailwind v4 / Radix 통합 패키지 규약은 코드 작성 전 재확인할 것. shadcn 컴포넌트는 `radix-ui` 통합 패키지·`@theme inline` 토큰과 호환되어야 한다.

- [x] `npx shadcn@latest add input label card dialog sonner dropdown-menu separator badge` + `field` 설치, `react-hook-form`·`@hookform/resolvers` 설치 확인 (`form`은 스텁이라 `field`로 대체)
- [x] `app/globals.css`: `:root`(및 `.dark`) 식물 테마 oklch 토큰 정의 — `--primary`/`--ring` green, 보조 색 재조정(대비 확인)
- [x] `app/globals.css` + `app/layout.tsx`: `--font-sans` → `--font-geist-sans` 연결 수정, 한글 fallback 스택 추가
- [x] `app/layout.tsx`: Sonner `<Toaster richColors position="top-center" />` 마운트(`body` 하단)
- [x] `components/site-header.tsx`: `variant` 분기 헤더 구현(로고/내비/사용자 placeholder, lucide 아이콘, 모바일 드롭다운 대응)
- [x] `app/(auth)/layout.tsx`·`app/(app)/layout.tsx`: 하드코딩 헤더를 `<SiteHeader variant=... />`로 교체
- [x] `lib/mock-data.ts`: 더미 `FocusSession[]`/`GardenPlant[]` + 총 완료 수/총 집중 시간 집계 헬퍼 작성
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 검증 시나리오 (수동)

> 본 작업은 UI/디자인 시스템이며 비즈니스 로직이 아니므로 Playwright E2E는 필수가 아니다. `npm run dev`로 개발 서버를 띄운 뒤 아래를 수동 확인한다.

- [x] `/`, `/login`, `/signup`에서 `public` 헤더(로그인/회원가입 링크)가 렌더된다. (Playwright 스크린샷으로 랜딩 확인)
- [x] `/timer`, `/garden`에서 `private` 헤더(타이머/정원 + 사용자 placeholder)가 렌더된다. (`/timer` 스크린샷 확인)
- [x] 브라우저 폭을 모바일 크기로 줄였을 때(375px) 헤더 내비가 드롭다운으로 접히고 정상 동작한다. (햄버거 클릭 → 타이머/정원/사용자 메뉴 펼침 확인)
- [x] 식물 테마 색(green 계열 primary)이 버튼/링크/로고에 반영되고, 본문 폰트가 적용된다(폰트 단절 해소).
- [x] Sonner `<Toaster />`가 루트에 마운트되어 렌더 에러 없이 동작(빌드/페이지 로드 정상). 실제 토스트 호출은 Task 005/011에서 사용.
- [x] `lib/mock-data.ts`가 `tsc`/`build`에서 타입 오류 없이 컴파일됨.
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과. 콘솔 에러/하이드레이션 경고 없음.

## 변경 사항 요약

- **shadcn 컴포넌트 설치**: `input`/`label`/`card`/`dialog`/`sonner`/`dropdown-menu`/`separator`/`badge` + `field`. 구 `form`(react-hook-form 래퍼)이 radix-nova에서 **`Field` primitive 패밀리로 대체**되어 `field`로 설치하고, 폼 연동용 `react-hook-form`·`@hookform/resolvers`를 별도 설치(`sonner`/`next-themes`는 sonner add가 함께 설치).
- **디자인 토큰**(`app/globals.css`): 무채색 → **식물 테마(잎 green, hue 145~150)** oklch 팔레트로 `:root`·`.dark` 교체(`--primary`/`--ring` green, 보조 색 green 틴트, `--destructive`는 적색 유지).
- **폰트 단절 버그 수정**: `@theme inline`의 `--font-sans` 자기참조를 `var(--font-geist-sans)` + 한글/시스템 fallback 스택으로 교체. 본문/헤딩 폰트 실제 적용.
- **Sonner 마운트**: `app/layout.tsx` `body` 하단에 `<Toaster richColors position="top-center" />` 추가(provider 없이 system 테마 기본).
- **헤더 컴포넌트화**(`components/site-header.tsx`): `variant`("public"/"private")로 내비 분기, 데스크톱 내비 + 모바일 드롭다운(lucide `Sprout`/`Menu`/`User`/`LogOut`), 활성 링크 강조(`usePathname`). 사용자 이메일/로그아웃은 placeholder(Task 008). `(auth)`/`(app)` 레이아웃의 하드코딩 헤더를 이 컴포넌트로 교체.
- **더미 데이터**(`lib/mock-data.ts`): 결정적 `MOCK_FOCUS_SESSIONS`(완료/포기 혼합), `MOCK_GARDEN_PLANTS`(완료 세션 투영), `MOCK_EMPTY_SESSIONS`(빈 정원), `getCompletedSessionCount`/`getTotalFocusMinutes` 집계 헬퍼.
- **검증**: `tsc --noEmit`·`lint`·`build`(8/8 정적 생성) 통과, Playwright로 public/private 헤더·모바일 반응형·green 테마·폰트 시각 확인, 콘솔 에러 없음.
