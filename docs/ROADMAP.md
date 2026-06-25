# 식물이 자라는 뽀모도로 타이머 개발 로드맵

집중하는 동안 화면 속 식물이 실시간으로 자라나는 시각적 리워드로, 단조로운 타이머를 몰입 경험으로 전환합니다.

## 개요

식물이 자라는 뽀모도로 타이머는 식물 키우기를 좋아하고 집중력 향상에 관심 있는 20~40대 1인 개발자, 재택근무자, 학생을 위한 몰입형 집중 도구로 다음 기능을 제공합니다:

- **식물 실시간 성장 타이머**: 커스텀 집중 시간 동안 씨앗에서 만개까지 식물이 자라는 과정을 실시간으로 시각화
- **포기/완료 피드백**: 포기 시 시들기 애니메이션, 완료 시 만개 연출로 집중 동기를 강화
- **온라인 정원 & 집중 기록**: 완료한 식물을 정원에 누적 전시하고 날짜별 집중 이력을 조회

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- `/tasks` 디렉토리에 새 작업 파일 생성
- 명명 형식: `XXX-description.md` (예: `001-setup.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright 기반 E2E 또는 수동 검증 시나리오 작성)
- 예시를 위해 `/tasks` 디렉토리의 마지막 완료된 작업 참조. 예를 들어, 현재 작업이 `012`라면 `011`과 `010`을 예시로 참조.
- 이러한 예시들은 완료된 작업이므로 내용이 완료된 작업의 최종 상태를 반영함 (체크된 박스와 변경 사항 요약). 새 작업의 경우, 문서에는 빈 박스와 변경 사항 요약이 없어야 함. 초기 상태의 샘플로 `000-sample.md` 참조.

3. **작업 구현**

- 작업 파일의 명세서를 따름
- 기능과 기능성 구현
- API 연동 및 비즈니스 로직 구현 시 Playwright 기반 E2E 또는 수동 검증 시나리오로 테스트 수행
- 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
- 구현 완료 후 테스트 시나리오 실행 및 결과 검증
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업의 체크박스를 `[x]`로 체크하여 구현 완료 상태 표시

## 기술 스택 유의사항

이 프로젝트는 학습 데이터 기준 시점 이후의 최신 버전을 사용합니다. 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 반드시 먼저 읽으세요.

- **Next.js 16**: App Router, Turbopack 기본. `middleware.ts`가 아니라 **`proxy.ts`** 사용 (명칭/규약 변경)
- **Tailwind CSS v4**: CSS-first, `tailwind.config.js` 없음. `app/globals.css`에서 `@import "tailwindcss"`
- **shadcn/ui v4**(`shadcn` 단일 패키지), **Radix UI 통합 패키지**(`radix-ui`), **lucide-react**
- **TypeScript**, **React Hook Form + Zod**
- **Supabase**: 인증/PostgreSQL/RLS. App Router에서는 `@supabase/supabase-js` **와** `@supabase/ssr` **둘 다** 필수. 세션 토큰 갱신은 `proxy.ts`, 보호 라우트는 서버 측 `getClaims()` 검증
- **Vercel** 배포

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

- [x] **Task 001: 프로젝트 구조 및 라우팅 설정** - 우선순위
  - See: `/tasks/001-routing-skeleton.md`
  - [x] Route Groups로 인증 보호/비보호 영역 분리 (`(auth)` 비로그인 전용, `(app)` 로그인 필수)
  - [x] 5개 주요 페이지 빈 껍데기 생성: 랜딩(`/`), 회원가입(`/signup`), 로그인(`/login`), 타이머(`/timer`), 정원(`/garden`)
  - [x] 루트 레이아웃 및 그룹별 레이아웃 골격 구현 (헤더 내비게이션 placeholder 포함)
  - [x] `proxy.ts` 빈 골격 생성 (세션 갱신/리디렉션 로직은 Phase 3에서 구현)
  - [x] `not-found.tsx`, `loading.tsx`, `error.tsx` 기본 파일 배치

- [x] **Task 002: 타입 정의 및 데이터 모델 설계**
  - See: `/tasks/002-types-and-schema.md`
  - [x] 도메인 TypeScript 인터페이스 정의 (`FocusSession`, `GardenPlant`, `SessionStatus`, `PlantType`, `GrowthStage`)
  - [x] Supabase 데이터베이스 스키마 설계 문서화 (`focus_sessions` / 선택적 `garden_plants`, 구현은 제외)
  - [x] RLS 정책 설계 명세 (operation별 USING / WITH CHECK 정의)
  - [x] Zod 스키마 정의 (회원가입/로그인 폼, 집중 시간 입력 1~180 범위)
  - [x] 식물 종류(튤립/해바라기/선인장) 및 성장 단계(씨앗/새싹/꽃봉오리/만개/시들기) 상수/타입 정의

### Phase 2: UI/UX 완성 (더미 데이터 활용)

- [x] **Task 003: 공통 컴포넌트 및 디자인 시스템 구축**
  - See: `/tasks/003-component-library.md`
  - [x] shadcn/ui v4 기반 공통 컴포넌트 설치/구성 (Button, Input, Card, Dialog, Sonner, Field 등 — 구 Form은 radix-nova에서 Field로 대체)
  - [x] `app/globals.css` 디자인 토큰 정의 (식물 테마 컬러 팔레트, 타이포그래피)
  - [x] 헤더 내비게이션 컴포넌트 구현 (로그인/비로그인 상태 분기, lucide-react 아이콘)
  - [x] 더미 데이터 생성 유틸리티 작성 (`lib/mock-data.ts` — 더미 세션/정원 식물)
  - [x] 반응형 레이아웃 컨테이너 및 공통 스타일 가이드 확립

- [x] **Task 004: 인증 관련 페이지 UI 완성**
  - See: `/tasks/004-auth-pages-ui.md`
  - [x] 랜딩 페이지 UI (헤드라인, 식물 성장 미리보기 정적 SVG, "시작하기"/"로그인" CTA)
  - [x] 회원가입 페이지 UI (이메일/비밀번호/비밀번호 확인 필드, React Hook Form + Zod 클라이언트 검증)
  - [x] 로그인 페이지 UI (이메일/비밀번호 필드, 인라인 에러 표시 영역)
  - [x] 폼 유효성 검증 동작 확인 (이메일 형식, 최소 8자, 비밀번호 일치) — 실제 인증 호출은 더미 처리
  - [x] 반응형 및 모바일 최적화

- [x] **Task 005: 타이머 페이지 UI 및 식물 SVG 에셋 제작**
  - See: `/tasks/005-timer-ui-and-plant-assets.md`
  - [x] 식물 SVG 에셋 제작: 3종(튤립/해바라기/선인장) × 4단계(씨앗/새싹/꽃봉오리/만개) + 시들기 표현
  - [x] 타이머 페이지 상태별 UI 구현 (설정 상태 / 진행 상태 / 완료 상태)
  - [x] 집중 시간 입력 UI (숫자 입력 + `+/-` 버튼), 카운트다운 표시(MM:SS) 영역
  - [x] 모바일 우선 단일 컬럼 + 데스크톱 좌우 2컬럼 반응형 레이아웃
  - [x] 포기 확인 다이얼로그, 완료 토스트 등 UI 골격 (실제 타이머 로직 없이 더미 progress로 단계 전환 시연)

- [x] **Task 006: 정원 페이지 UI 완성**
  - See: `/tasks/006-garden-ui.md`
  - [x] 정원 뷰: 완성된 식물 카드 격자 배치 (식물 SVG 아이콘 + 날짜 + 집중 시간, 더미 데이터)
  - [x] 빈 정원 상태 안내 UI ("아직 심어진 식물이 없어요. 첫 집중을 시작해보세요!")
  - [x] 기록 뷰: 날짜별 세션 목록 (완료/포기 상태, 집중 시간, 시작 시각)
  - [x] 총 완료 세션 수 / 총 집중 시간 집계 표시 영역
  - [x] "타이머로 돌아가기" 네비게이션 및 반응형 레이아웃

### Phase 3: 핵심 기능 구현

- [x] **Task 007: Supabase 설정 및 데이터 모델/RLS 구축** - 우선순위
  - See: `/tasks/007-supabase-setup.md`
  - [x] Supabase 프로젝트 연동 및 환경 변수 구성 (`@supabase/supabase-js`, `@supabase/ssr` 설치)
  - [x] 브라우저/서버 클라이언트 헬퍼 작성 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
  - [x] `focus_sessions` 테이블 생성 (duration_minutes CHECK 1~180, status enum, plant_type 등)
  - [x] 정원 뷰 전략 결정 및 구현 (단일 테이블 + View 또는 `garden_plants` 별도 테이블)
  - [x] operation별 RLS 정책 적용 (SELECT/UPDATE/DELETE는 USING, INSERT는 WITH CHECK)
  - **테스트 체크리스트** (Playwright 기반 E2E 또는 수동 검증)
    - [x] RLS 검증: 타 사용자 명의 INSERT 차단 확인 (WITH CHECK)
    - [x] 본인 데이터만 SELECT 조회되는지 확인
    - [x] duration_minutes 범위(1~180) CHECK 제약 위반 시 거부 확인

- [ ] **Task 008: 인증 시스템 구현 (Supabase Auth + Next.js 16 Proxy)**
  - See: `/tasks/008-auth-system.md`
  - [ ] 회원가입/로그인/로그아웃 실제 Supabase Auth 연동 (이메일 확인 비활성화 → 가입 즉시 자동 로그인)
  - [ ] `proxy.ts`에서 만료 토큰 세션 갱신 로직 구현
  - [ ] 보호 라우트(타이머/정원)는 서버 컴포넌트/레이아웃에서 `getClaims()`로 서버 측 세션 검증
  - [ ] 비로그인 전용 페이지(랜딩/로그인/회원가입)는 Proxy optimistic check로 로그인 사용자를 타이머로 리디렉션
  - [ ] 헤더에 로그인 사용자 이메일 표시 (F011) 및 로그아웃 연동
  - **테스트 체크리스트** (Playwright 기반 E2E 또는 수동 검증)
    - [ ] 회원가입 → 자동 로그인 → 타이머 페이지 리디렉션 플로우
    - [ ] 잘못된 자격 증명 로그인 시 인라인 에러 표시
    - [ ] 비로그인 상태로 `/timer`, `/garden` 접근 시 로그인 페이지로 리디렉션
    - [ ] 로그인 상태로 `/login`, `/signup` 접근 시 타이머로 리디렉션
    - [ ] 로그아웃 후 세션 무효화 및 보호 라우트 접근 차단

- [ ] **Task 009: 타이머 신뢰성 로직 구현 (절대 시각 기반)**
  - See: `/tasks/009-timer-reliability.md`
  - [ ] 틱 카운팅 금지 — `startTime`(절대 시각) 저장 후 `elapsed = Date.now() - startTime`로 매 틱 재계산
  - [ ] `progress = elapsed / total` 계산 및 카운트다운(MM:SS)은 1초 간격 표시 갱신
  - [ ] `visibilitychange` / `focus` 이벤트에서 elapsed 재계산 및 백그라운드 복귀 보정
  - [ ] `elapsed >= total` 시 즉시 완료 확정 처리
  - [ ] 타이머 상태 머신 구현 (설정 → 진행 → 완료/포기 → 초기화)
  - **테스트 체크리스트** (Playwright 기반 E2E 또는 수동 검증)
    - [ ] 백그라운드 탭 전환 후 복귀 시 경과 시간이 실제 시각 기준으로 정확히 보정되는지 확인
    - [ ] 탭이 백그라운드인 동안 종료 시각 경과 후 복귀 시 즉시 완료 확정되는지 확인
    - [ ] 짧은 시간(예: 1분) 타이머의 완료 시점 정확도 검증
    - [ ] 포기 시 진행 중단 및 초기 상태 복귀 확인

- [ ] **Task 010: 식물 성장 애니메이션 구현 (CSS 변수 바인딩)**
  - See: `/tasks/010-plant-growth-animation.md`
  - [ ] `progress`(0.0~1.0)를 CSS 변수(`--progress`)에 바인딩 — 매초 React 리렌더 회피
  - [ ] progress 구간별 성장 단계 분기 (씨앗 0~0.10 / 새싹 0.10~0.40 / 꽃봉오리 0.40~0.80 / 만개 0.80~1.00)
  - [ ] SVG 속성(height/opacity/transform)을 CSS 변수에 연동, CSS transition으로 부드러운 전환
  - [ ] 만개 시 꽃잎 펼침 keyframe(`@keyframes bloom`), 포기 시 시들기(grayscale + rotate) 트랜지션
  - [ ] GPU 가속(transform/opacity) 활용 60fps 성능 확보 검증
  - **테스트 체크리스트** (Playwright 기반 E2E 또는 수동 검증)
    - [ ] progress 변화에 따라 성장 단계가 정확한 구간에서 전환되는지 확인
    - [ ] 식물 렌더링 중 불필요한 React 리렌더가 발생하지 않는지 확인 (프로파일링)
    - [ ] 시들기/만개 애니메이션 시각 동작 확인
    - [ ] 백그라운드 복귀 시 식물이 보정된 단계로 점프하는지 확인

- [ ] **Task 011: 세션 저장 및 정원 데이터 연동**
  - See: `/tasks/011-session-persistence.md`
  - [ ] 타이머 완료 시 세션 'completed' 저장 + plant_type 랜덤 배정 + 정원 식물 반영
  - [ ] 타이머 포기 시 세션 'abandoned' 저장
  - [ ] 정원 페이지 더미 데이터를 실제 Supabase 쿼리로 교체 (식물 격자, 날짜별 기록, 집계)
  - [ ] 완료 후 "정원에 심기 완료!" 토스트 및 초기 상태 복귀 연동
  - **테스트 체크리스트** (Playwright 기반 E2E 또는 수동 검증)
    - [ ] 타이머 완료 → focus_sessions completed 저장 → 정원에 식물 추가 확인
    - [ ] 타이머 포기 → focus_sessions abandoned 저장 확인
    - [ ] 정원 뷰/기록 뷰가 실제 데이터로 렌더링되는지 확인
    - [ ] 빈 정원 상태 (데이터 없는 신규 사용자) 안내 표시 확인
    - [ ] 총 완료 세션 수/총 집중 시간 집계 정확도 검증

- [ ] **Task 012: 핵심 기능 통합 테스트**
  - See: `/tasks/012-integration-test.md`
  - [ ] 전체 사용자 플로우 E2E 테스트 (랜딩 → 회원가입 → 타이머 → 완료 → 정원)
  - [ ] 인증/타이머/식물 성장/세션 저장 비즈니스 로직 통합 검증
  - [ ] 에러 핸들링 및 엣지 케이스 테스트
  - **테스트 체크리스트** (Playwright 기반 E2E 또는 수동 검증)
    - [ ] 신규 가입자 첫 집중 완료까지 전체 여정 통과
    - [ ] 백그라운드 복귀 보정과 세션 저장이 함께 동작하는 통합 시나리오
    - [ ] 네트워크 실패/세션 만료 시 에러 핸들링
    - [ ] RLS로 타 사용자 데이터 접근 불가 재확인

### Phase 4: 고급 기능 및 최적화

- [ ] **Task 013: 사용자 경험 향상 및 에러 핸들링 강화**
  - See: `/tasks/013-ux-enhancement.md`
  - [ ] 로딩/스켈레톤 상태, 빈 상태, 에러 바운더리 정교화
  - [ ] 폼 제출 중 로딩/비활성화 처리 및 접근성(a11y) 개선
  - [ ] 토스트/다이얼로그 UX 다듬기 및 마이크로 인터랙션 보강
  - [ ] 모바일 화면 잠금 복귀 등 알려진 한계에 대한 사용자 안내 처리

- [ ] **Task 014: 성능 최적화 및 Vercel 배포**
  - See: `/tasks/014-optimization-and-deploy.md`
  - [ ] 식물 애니메이션 성능 최적화 및 SVG 에셋 경량화
  - [ ] 페이지 로드 성능 최적화 (LCP 2.5초 이하 목표, 이미지/폰트 최적화)
  - [ ] Vercel 배포 파이프라인 구성 및 환경 변수 설정
  - [ ] Vercel Analytics 연동 및 성공 지표(완료율/재방문율/LCP) 모니터링 기반 마련
