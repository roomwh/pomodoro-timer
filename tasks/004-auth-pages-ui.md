# Task 004: 인증 관련 페이지 UI 완성

- **Phase**: 2 (UI/UX 완성 — 더미 데이터 활용)
- **상태**: 완료
- **우선순위**: 일반
- **유형**: UI/폼 (클라이언트 검증까지 포함, 실제 인증 호출은 제외)

## 개요 (고수준 명세서)

비로그인 영역 `(auth)`의 세 화면 — **랜딩(`/`) / 회원가입(`/signup`) / 로그인(`/login`)** — 의 실제 UI를 완성한다. Task 003에서 마련한 디자인 토큰(잎 green 테마)·공통 컴포넌트(`Card`/`Input`/`Field`/`Button`)와 Task 002의 Zod 스키마(`signupSchema`/`loginSchema`)를 결합해, **React Hook Form + Zod 클라이언트 검증이 실제로 동작하는 폼**을 구현한다.

범위와 경계:

- **실제 인증 호출 없음(더미)**: 폼 제출은 더미 비동기(지연 + 로딩 상태)로 처리한다. 실제 Supabase Auth(`signUp`/`signInWithPassword`)·세션 발급·리디렉션은 **Task 008**에서 연결한다. 본 작업은 "검증이 통과하면 submit 핸들러까지 도달한다"까지만 책임진다.
- **식물 SVG 풀세트 제외**: 랜딩의 "식물 성장 미리보기"는 **장식용 정적(static) 인라인 SVG** 한 컷만 둔다. 3종×4단계 + 시들기 등 실제 에셋과 progress 연동은 **Task 005**에서 제작한다.
- **Proxy 리디렉션 제외**: 로그인 사용자를 타이머로 보내는 optimistic 리디렉션은 **Task 008**(`proxy.ts`) 소관. 본 작업에서 `proxy.ts`를 건드리지 않는다.
- **헤더는 Task 003 결과물 재사용**: `(auth)/layout.tsx`는 이미 `<SiteHeader variant="public" />`를 렌더하므로 레이아웃은 수정하지 않는다(페이지 내용만 채운다).

## 현재 상태 (파악 결과)

- `app/(auth)/page.tsx`: 랜딩 골격 존재. 헤드라인 + 본문 + `시작하기`/`로그인` CTA가 **하드코딩 `<Link>` + 인라인 클래스**로 작성됨(공통 `Button` 미사용). 식물 미리보기 없음.
- `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`: "추후 구현됩니다" placeholder 텍스트만 존재.
- `app/(auth)/layout.tsx`: `SiteHeader(public)` + `Container` + `main`(flex-1) 골격 완성 → 그대로 사용.
- `lib/schemas.ts`: `signupSchema`(이메일/8자+/일치), `loginSchema`(이메일/미입력 차단) + `SignupInput`/`LoginInput` 추론 타입 **이미 정의됨** → 재사용.
- 공통 컴포넌트: `components/ui/`에 `card`/`input`/`label`/`field`/`button`/`sonner` 등 설치 완료. **`form`(RHF 래퍼)은 없고 `Field` primitive 패밀리로 대체**됨(Task 003 비고 참조).
- `react-hook-form`·`@hookform/resolvers`·`zod`·`sonner`(+`<Toaster />` 마운트) 모두 준비됨.

## 설계 결정

### 폼 구현 방식: Field primitive + RHF + zodResolver
- shadcn 구 `form` 래퍼(`FormField`/`useFormField`) 대신 **`Field`/`FieldLabel`/`FieldError`/`FieldGroup`/`FieldDescription` primitive** + `react-hook-form`의 `useForm` + `@hookform/resolvers/zod`의 `zodResolver`를 조합한다.
- `register` 기반 배선: 각 입력은 `<Input {...register("email")} aria-invalid={!!errors.email} />`, 에러는 `<FieldError errors={[errors.email]} />`로 표시.
- 검증 트리거: `mode: "onTouched"`(터치 후 onChange 재검증) — 첫 입력 중 과도한 에러 노출을 피하고, blur 후부터 즉시 피드백.
- 폼/입력 컴포넌트는 클라이언트 컴포넌트(`"use client"`). **페이지(`page.tsx`)는 서버 컴포넌트로 유지**하고 폼 클라이언트 컴포넌트를 마운트(서버/클라이언트 경계 최소화).

### 컴포넌트 구조
- `components/auth/auth-card.tsx`(신규): `Card` 기반 폼 셸. props로 `title`/`description`/하단 링크(`footer`) 슬롯을 받아 로그인/회원가입이 공유. 화면 가운데 정렬 + 모바일 풀폭/데스크톱 고정 폭(`max-w-sm`).
- `components/auth/signup-form.tsx`(신규): `signupSchema` 기반. 이메일/비밀번호/비밀번호 확인 3필드.
- `components/auth/login-form.tsx`(신규): `loginSchema` 기반. 이메일/비밀번호 2필드 + **폼 상단 인라인 에러 영역**(자격 증명 실패 메시지 자리, `role="alert"`).
- 두 폼은 제출 핸들러에서 **더미 비동기**(`await new Promise(r => setTimeout(r, 800))`)로 로딩을 시연하고, 성공 시 `sonner` 토스트로 "데모: 실제 인증은 Task 008에서 연결" 안내.

### 더미 인증 동작 (검증 가능한 형태로)
- **회원가입**: 검증 통과 → 제출 버튼 로딩/비활성화 → 더미 지연 → 성공 토스트. (리디렉션 없음 — Task 008.)
- **로그인**: 검증 통과 → 더미 지연 → 성공 토스트. 추가로 **인라인 에러 영역을 실제로 렌더**해 보이기 위해, 데모 센티넬(예: 비밀번호가 `error`)일 때 상단 에러 영역에 "이메일 또는 비밀번호가 올바르지 않습니다." 표시. 실제 에러 출처는 Task 008에서 교체.
- 더미 제출 상태는 RHF `formState.isSubmitting`을 그대로 사용(별도 state 불필요).

### 랜딩 페이지
- 하드코딩 `<Link>` CTA를 공통 `Button`(`asChild` + `<Link>`)로 교체해 테마/포커스 링 일관성 확보. `시작하기`→`/signup`(primary), `로그인`→`/login`(outline).
- **식물 성장 미리보기**: 씨앗→새싹→꽃봉오리→만개를 한 줄로 보여주는 **정적 인라인 SVG**(또는 단순 도형 조합) 1컷. green 토큰(`currentColor`/`text-primary`) 사용, `aria-hidden`(장식). Task 005 에셋으로 교체 예정임을 주석에 명시.
- 헤드라인/본문은 기존 카피 유지하되 타이포·간격을 토큰 기반으로 정돈.

### 반응형
- 폼 카드: 모바일 좌우 패딩 내 풀폭, `sm` 이상에서 `max-w-sm` 중앙 정렬.
- 랜딩: 모바일 단일 컬럼(미리보기 위/카피 아래 또는 세로 스택), `sm` 이상에서 여백·폰트 스케일 업. CTA는 모바일 세로 스택 → `sm` 가로 배치.

## 목표 파일 구조

```
app/(auth)/
├── page.tsx              # 수정: 랜딩 UI (Button CTA + 정적 식물 미리보기)
├── login/page.tsx        # 수정: <LoginForm /> 마운트 (서버 컴포넌트)
└── signup/page.tsx       # 수정: <SignupForm /> 마운트 (서버 컴포넌트)
components/auth/
├── auth-card.tsx         # 신규: 로그인/회원가입 공유 카드 셸
├── login-form.tsx        # 신규: "use client" — loginSchema + RHF
└── signup-form.tsx       # 신규: "use client" — signupSchema + RHF
components/
└── plant-preview.tsx     # 신규(선택): 랜딩용 정적 식물 성장 미리보기 SVG
```

> 폼 컴포넌트는 `Field` primitive(`@/components/ui/field`)와 `Input`/`Button`을 사용하고, 스키마는 `@/lib/schemas`를 그대로 import한다. 새 문자열 스키마를 만들지 않는다(단일 진실 공급원 유지).

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `app/(auth)/page.tsx` | 수정 | 랜딩: `Button`(asChild) CTA, 정적 식물 미리보기, 토큰 기반 타이포 |
| `app/(auth)/login/page.tsx` | 수정 | `<LoginForm />` 마운트(서버 컴포넌트 유지) |
| `app/(auth)/signup/page.tsx` | 수정 | `<SignupForm />` 마운트(서버 컴포넌트 유지) |
| `components/auth/auth-card.tsx` | 신규 | `Card` 기반 공유 폼 셸(title/description/footer 슬롯, 반응형 폭) |
| `components/auth/login-form.tsx` | 신규 | `loginSchema` + RHF + zodResolver, 인라인 에러 영역, 더미 제출 |
| `components/auth/signup-form.tsx` | 신규 | `signupSchema` + RHF + zodResolver, 3필드, 더미 제출 |
| `components/plant-preview.tsx` | 신규(선택) | 랜딩 장식용 정적 식물 성장 SVG(Task 005에서 교체) |
| `lib/schemas.ts` | 재사용 | `signupSchema`/`loginSchema`/`SignupInput`/`LoginInput` |
| `components/ui/field.tsx`, `input.tsx`, `button.tsx`, `card.tsx` | 재사용 | 폼 primitive |

## 수락 기준 (Acceptance Criteria)

- [x] 랜딩(`/`)에 헤드라인 + 본문 + **정적 식물 성장 미리보기** + `시작하기`(→`/signup`)/`로그인`(→`/login`) CTA가 공통 `Button`으로 렌더된다.
- [x] 회원가입(`/signup`)에 이메일/비밀번호/비밀번호 확인 필드가 `signupSchema` 기반 React Hook Form + Zod로 동작한다.
- [x] 로그인(`/login`)에 이메일/비밀번호 필드 + **폼 상단 인라인 에러 표시 영역**(`role="alert"`)이 `loginSchema` 기반으로 동작한다.
- [x] 클라이언트 검증이 실제 동작한다: 잘못된 이메일 형식, 8자 미만 비밀번호, 비밀번호 불일치 시 각 필드에 한글 에러 메시지가 표시되고 제출이 차단된다.
- [x] 제출 중 버튼이 로딩/비활성화되고(`isSubmitting`), 검증 통과 시 더미 핸들러가 토스트로 안내한다(실제 인증 호출 없음).
- [x] 모바일(375px)·데스크톱에서 폼 카드와 랜딩 레이아웃이 깨지지 않고 반응형으로 동작한다.
- [x] 접근성: 각 입력에 `label` 연결, 에러 시 `aria-invalid`, 인라인 에러 영역 `role="alert"`.
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(하이드레이션 경고/콘솔 에러 없음).

## 구현 단계

> 코드 작성 전 Next.js 16 서버/클라이언트 컴포넌트 경계, shadcn `Field` primitive 사용법, RHF + zod v4 `zodResolver` 호환을 재확인할 것. 폼은 `"use client"`, 페이지는 서버 컴포넌트로 유지한다.

- [x] `components/auth/auth-card.tsx` 작성: `Card`(Header/Content/Footer) 기반 공유 셸, 반응형 폭(`w-full max-w-sm`), title/description/footer 슬롯
- [x] `components/auth/signup-form.tsx` 작성: `useForm<SignupInput>({ resolver: zodResolver(signupSchema), mode: "onTouched" })`, 3필드 `Field`+`Input`+`FieldError`, 더미 제출 + 성공 토스트
- [x] `components/auth/login-form.tsx` 작성: `useForm<LoginInput>`, 2필드, 상단 인라인 에러 영역(state), 더미 제출(센티넬 시 에러 표시)
- [x] `app/(auth)/signup/page.tsx`·`login/page.tsx` 수정: placeholder 제거 후 폼 컴포넌트 마운트 + 하단 전환 링크(로그인↔회원가입)
- [x] `components/plant-preview.tsx`(또는 랜딩 인라인) 작성: 정적 식물 성장 미리보기 SVG(green 토큰, `aria-hidden`)
- [x] `app/(auth)/page.tsx` 수정: `Button`(asChild+Link) CTA, 미리보기 삽입, 토큰 기반 타이포/간격
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 검증 시나리오 (수동 / Playwright)

> 폼 클라이언트 검증은 동작 로직이므로 `npm run dev` 후 아래를 확인한다. 가능하면 Playwright로 입력/제출/에러 노출을 자동 검증한다(실제 인증 호출은 더미이므로 네트워크 단언은 제외).

- [x] **랜딩**: `/`에서 헤드라인·식물 미리보기·두 CTA 렌더, `시작하기`→`/signup`, `로그인`→`/login` 이동 확인
- [x] **회원가입 검증**: 잘못된 이메일 → 이메일 에러, 비밀번호 7자 → 길이 에러, 확인 불일치 → 불일치 에러가 표시되고 제출 차단
- [x] **회원가입 성공 경로**: 유효 입력 제출 → 버튼 로딩/비활성화 → 더미 지연 후 성공 토스트(리디렉션 없음)
- [x] **로그인 검증**: 미입력 제출 시 이메일/비밀번호 에러 표시, 잘못된 이메일 형식 차단
- [x] **로그인 인라인 에러**: 데모 센티넬(비밀번호 `error`) 제출 시 상단 `role="alert"` 영역에 자격 증명 에러 표시
- [x] **반응형**: 375px에서 폼 카드/랜딩이 풀폭으로 정상 배치, 데스크톱에서 카드 중앙·`max-w-sm` 확인
- [x] **접근성/콘솔**: label-input 연결, `aria-invalid` 토글, 하이드레이션 경고·콘솔 에러 없음
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과

## 변경 사항 요약

- **공유 카드 셸**(`components/auth/auth-card.tsx`, 신규): `Card` 기반 폼 셸. `title`/`description`/`footer` 슬롯, 화면 가운데 정렬 + 모바일 풀폭/`sm` 이상 `max-w-sm` 반응형. 로그인/회원가입이 공유. 상호작용이 없어 서버 컴포넌트로 유지.
- **회원가입 폼**(`components/auth/signup-form.tsx`, 신규, `"use client"`): `useForm<SignupInput>` + `zodResolver(signupSchema)`, `mode: "onTouched"`. 이메일/비밀번호/비밀번호 확인 3필드를 `Field`+`Input`+`FieldError`로 배선(`aria-invalid` 연동). 더미 제출(800ms 지연 + 성공 토스트, 리디렉션 없음 — Task 008에서 Supabase `signUp`으로 교체).
- **로그인 폼**(`components/auth/login-form.tsx`, 신규, `"use client"`): `useForm<LoginInput>` + `zodResolver(loginSchema)`. 이메일/비밀번호 2필드 + **폼 상단 인라인 에러 영역**(`role="alert"`, `formError` state). 더미 제출 시 데모 센티넬(비밀번호 `error`)이면 인라인 에러 표시, 아니면 성공 토스트. 실제 인증 결과는 Task 008에서 연결.
- **페이지 마운트**(`app/(auth)/login/page.tsx`·`signup/page.tsx`, 수정): placeholder 텍스트 제거 후 각 폼 클라이언트 컴포넌트를 **서버 컴포넌트에서 마운트**(서버/클라이언트 경계 최소화).
- **랜딩**(`app/(auth)/page.tsx`, 수정): 하드코딩 `<Link>` CTA를 공통 `Button`(`asChild`+`<Link>`)로 교체(`시작하기`→`/signup` primary, `로그인`→`/login` outline). 정적 식물 미리보기 삽입, CTA 모바일 세로 스택→`sm` 가로 배치.
- **식물 미리보기**(`components/plant-preview.tsx`, 신규): 씨앗→새싹→꽃봉오리→만개 4단계 **정적 인라인 SVG**(green `currentColor`, `aria-hidden`). 3종×4단계 실제 에셋·progress 연동은 Task 005에서 교체.
- **검증**: `tsc --noEmit`·`lint`·`build`(8/8 정적 생성) 통과. Playwright로 ▲랜딩 렌더/CTA ▲회원가입 3필드 검증(이메일 형식·8자 미만·불일치 에러 표시 + 제출 차단) ▲로그인 인라인 에러(센티넬) ▲정상 제출 성공 토스트 ▲375px 모바일 폼 풀폭 배치를 시각·구조 확인. 콘솔 에러/하이드레이션 경고 없음.
