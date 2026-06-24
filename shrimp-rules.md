# 개발 가이드라인 (AI Agent 전용)

본 문서는 **Coding Agent AI** 가 `pomodoro-timer` 저장소에서 작업할 때 따라야 하는 프로젝트 고유 규칙이다. 일반 개발 지식은 포함하지 않는다. 명령형으로 작성되었으며, 모든 규칙은 **반드시(MUST)** 준수한다.

## 프로젝트 개요

- **목적**: 포모도로 타이머 웹 애플리케이션
- **기술 스택**: Next.js 16.2.9 (App Router) · React 19.2 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui v4 · radix-ui · lucide-react
- **번들러**: Turbopack (기본)
- **현재 상태**: `create-next-app` 스타터 + shadcn/ui 초기 설정 단계. `app/page.tsx`, `app/layout.tsx` 의 내용은 **스타터 보일러플레이트**이며 포모도로 기능은 아직 미구현이다.

## 🚨 최우선 규칙: 코드 작성 전 문서 확인 (MUST)

이 프로젝트는 LLM 학습 데이터 기준 시점 **이후** 버전을 사용한다. API·규약·파일 구조가 학습 데이터와 다르다.

- **반드시** 코드를 작성하기 **전에** `node_modules/next/dist/docs/` 의 관련 가이드를 먼저 읽는다.
- Next.js / Tailwind / shadcn / Radix 관련 코드를 작성할 때 **기억(학습 데이터)에 의존하지 말 것**.
- deprecation 경고를 발견하면 **반드시** 반영한다.

## 프로젝트 아키텍처

| 경로 | 역할 | 비고 |
|------|------|------|
| `app/` | App Router 라우트·레이아웃 | `page.tsx`, `layout.tsx`, `globals.css` |
| `components/ui/` | shadcn/ui 컴포넌트 | **직접 수정 가능한 소스 파일** |
| `lib/utils.ts` | `cn()` 유틸리티 | clsx + tailwind-merge |
| `public/` | 정적 에셋 | SVG 등 |

- Import alias: `@/*` → 프로젝트 루트 (`@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`)
- 신규 컴포넌트는 `components/` 에, 훅은 `hooks/` 에 배치한다 (`components.json` aliases 기준).

## 버전별 Breaking Changes 규칙 (MUST)

### Next.js 16
- `next build` 는 린터를 **자동 실행하지 않는다**. 빌드 후 **반드시** `npm run lint` 를 별도 실행한다.
- Turbopack 이 기본 번들러다. Webpack 이 필요하면 `next dev --webpack` 를 사용한다.

### Tailwind CSS v4
- `tailwind.config.js` 를 **생성 금지**. CSS-first 방식으로 `app/globals.css` 에서 설정한다.
- `@tailwind` 지시자를 **사용 금지**. `@import "tailwindcss"` 를 사용한다.
- 디자인 토큰은 `:root` / `.dark` 의 CSS 변수로 정의한 뒤 `@theme inline` 블록에서 Tailwind 에 매핑한다.
- 새 색상·반경 토큰 추가 시: ① `:root` 와 `.dark` 양쪽에 CSS 변수 정의 → ② `@theme inline` 에 `--color-*` / `--radius-*` 매핑 추가. **한쪽만 수정 금지**.

### Radix UI (단일 패키지)
- 개별 `@radix-ui/*` 패키지를 **설치 금지**. 통합 `radix-ui` 패키지를 사용한다.
- `import { Slot } from "radix-ui"` 후 `Slot.Root` 로 사용한다. (`components/ui/button.tsx` 참조)

### shadcn/ui v4
- `shadcn` 통합 패키지를 사용한다. `globals.css` 에 `@import "shadcn/tailwind.css"` 가 포함되어 있다 — **제거 금지**.
- 컴포넌트 추가는 CLI 사용을 우선한다. 스타일 프리셋은 `radix-nova` (`components.json` 의 `style`).
- 아이콘은 **lucide-react** 만 사용한다 (`iconLibrary: "lucide"`).

### ESLint 9
- flat config (`eslint.config.mjs`) 만 사용한다. `.eslintrc.*` 형식 파일을 **생성 금지**.

## 코드 작성 표준

- 컴포넌트는 `function Component() {}` 선언 함수 형태로 작성한다 (화살표 함수 할당 지양). `components/ui/button.tsx` 패턴을 따른다.
- 다중 클래스명 조합·조건부 클래스는 **반드시** `@/lib/utils` 의 `cn()` 을 사용한다.
- variant 기반 스타일은 `class-variance-authority(cva)` 로 정의하고, 컴포넌트는 `data-slot` / `data-variant` / `data-size` 속성을 부여한다 (`button.tsx` 패턴).
- 색상은 하드코딩 대신 토큰(`bg-primary`, `text-foreground` 등)을 사용한다. 보일러플레이트(`app/page.tsx`)의 `bg-zinc-50`, `#383838` 같은 하드코딩 값을 **새 코드의 기준으로 삼지 말 것**.
- 변수명·함수명은 영어, 주석·문서·커밋 메시지는 한국어로 작성한다.
- TypeScript `strict` 모드다. `any` 회피, props 타입은 `React.ComponentProps<...>` 패턴을 활용한다.

## 핵심 파일 동시 수정 규칙

- **디자인 토큰 변경**: `app/globals.css` 의 `:root`, `.dark`, `@theme inline` 세 곳의 정합성을 함께 맞춘다.
- **의존성 추가/변경**: `package.json` 수정 후 `npm install` 로 `package-lock.json` 을 동기화한다.
- **alias 변경**: `components.json` 의 `aliases` 와 `tsconfig.json` 의 `paths` 를 함께 수정한다.
- **메타데이터**: 포모도로 앱으로 전환 시 `app/layout.tsx` 의 `metadata` (현재 "Create Next App") 와 `lang="en"` 을 적절히 갱신한다.

## 워크플로우 표준

1. 관련 `node_modules/next/dist/docs/` 문서 확인 →
2. 코드 작성/수정 →
3. `npm run lint` 실행 (Next.js 16 은 빌드 시 자동 린트 안 함) →
4. 필요 시 `npm run build` 로 검증.

## AI 의사결정 기준

- "버튼/입력 등 UI 기본 요소가 필요" → 먼저 `components/ui/` 에 해당 컴포넌트가 있는지 확인 → 없으면 shadcn CLI 로 추가, 직접 작성하지 않는다.
- "스타일링이 필요" → 기존 디자인 토큰 우선 → 없으면 `globals.css` 에 토큰 추가(양쪽 동기화).
- "라우트/레이아웃/API 추가" → App Router 규약 확인 후 `app/` 하위에 작성. 모호하면 `nextjs-app-router-dev` 에이전트 활용을 고려.
- 버전 관련 API 가 불확실 → **추측 금지**, `node_modules/next/dist/docs/` 확인.

## 금지 사항 (PROHIBITED)

- ❌ Next.js/Tailwind/shadcn/Radix API 를 학습 데이터 기억만으로 작성 (문서 미확인)
- ❌ `tailwind.config.js` 생성, `@tailwind` 지시자 사용
- ❌ 개별 `@radix-ui/*` 패키지 설치
- ❌ `.eslintrc.*` 형식 파일 생성
- ❌ lucide 외 아이콘 라이브러리 도입 (사용자 명시 요청 없이)
- ❌ `globals.css` 의 `@import "shadcn/tailwind.css"` 제거
- ❌ `components/ui/` 컴포넌트를 무시하고 동일 기능의 기본 UI 를 새로 구현
- ❌ 디자인 토큰을 `:root` / `.dark` / `@theme inline` 중 일부만 수정
- ❌ `node_modules/`, `.next/` 등 생성·외부 디렉터리 직접 편집
