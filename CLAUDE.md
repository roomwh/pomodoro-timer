# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 명령어

```bash
npm run dev      # 개발 서버 시작 (Turbopack 기본)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 시작
npm run lint     # ESLint 실행
```

테스트 프레임워크는 설정되어 있지 않습니다.

## 프로젝트 구조

- `app/` — Next.js App Router 라우트 및 레이아웃 (`app/page.tsx`, `app/layout.tsx`)
- `components/ui/` — shadcn/ui 컴포넌트 (직접 수정 가능한 소스 파일)
- `lib/utils.ts` — `cn()` 유틸리티 (clsx + tailwind-merge)
- `app/globals.css` — Tailwind v4 설정 및 CSS 디자인 토큰

Import alias: `@/*` → 프로젝트 루트

## 주요 기술 스택 및 Breaking Changes

이 프로젝트는 학습 데이터 기준 시점 이후의 버전들을 사용하므로, 코드 작성 전에 반드시 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 읽으세요.

### Next.js 16
- `next build`가 더 이상 린터를 자동으로 실행하지 않음 → `npm run lint` 별도 실행 필요
- Turbopack이 기본 번들러 (Webpack 사용 시: `next dev --webpack`)

### Tailwind CSS v4
- `tailwind.config.js` 없음 — CSS-first 방식으로 `app/globals.css`에서 설정
- `@tailwind` 지시자 대신 `@import "tailwindcss"` 사용
- 디자인 토큰은 CSS 변수로 정의 후 `@theme inline` 블록에서 Tailwind에 매핑

### Radix UI (단일 패키지)
- 이전의 개별 `@radix-ui/*` 패키지 대신 통합 `radix-ui` 패키지 사용
- `Slot`의 import 방식이 변경됨: `import { Slot } from "radix-ui"` → `Slot.Root`로 사용

### shadcn/ui v4
- `shadcn` 패키지로 통합 설치
- 기본 스타일: `@import "shadcn/tailwind.css"` (`globals.css`에 포함)

### ESLint 9
- flat config 형식 사용 (`eslint.config.mjs`)
- 기존 `.eslintrc.*` 형식 사용 불가
