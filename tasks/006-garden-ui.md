# Task 006: 정원 페이지 UI 완성

- **Phase**: 2 (UI/UX 완성 — 더미 데이터 활용)
- **상태**: 진행 전
- **우선순위**: 일반
- **유형**: UI (실제 Supabase 쿼리·세션 저장은 제외)

## 개요 (고수준 명세서)

집중의 결과물을 모아 보는 **정원 페이지(`/garden`)**의 정적 UI를 완성한다. 완료한 집중 세션을 식물 카드로 누적 전시하는 **정원 뷰**, 날짜별 집중 이력을 나열하는 **기록 뷰**, 그리고 **총 완료 세션 수 / 총 집중 시간 집계**를 한 화면에서 제공한다. 모든 데이터는 `lib/mock-data.ts`의 **더미 데이터**로 렌더하고, 실제 Supabase 쿼리 교체는 Task 011에 위임한다.

범위와 경계:

- **실제 데이터 쿼리 없음**: `focus_sessions` 조회·집계는 **Task 011**. 본 작업은 `MOCK_GARDEN_PLANTS` / `MOCK_FOCUS_SESSIONS` / `getCompletedSessionCount` / `getTotalFocusMinutes`를 **서버 페이지에서 import**해 props로 내려보낸다(Task 011이 데이터 소스만 교체하도록 경계 분리).
- **빈 정원 상태도 더미로 시연**: `MOCK_EMPTY_SESSIONS`를 활용한 빈 상태 UI는 본 작업에서 구현하되, 신규 사용자 실제 분기는 Task 011.
- **보호 라우트 실제 검증 없음**: `(app)/layout.tsx`의 `getClaims()` 세션 검증은 **Task 008**. 본 작업은 레이아웃을 수정하지 않고 페이지 내용만 채운다.
- **식물 에셋 재제작 없음**: Task 005의 `<Plant plantType stage />` 디스패처를 그대로 재사용한다(정원 카드에는 만개 `bloom` 단계로 표시). 신규 SVG 제작은 없다.
- **세션 클릭 상세/삭제 등 상호작용 없음**: 정원/기록은 조회 전용. 카드·행 클릭 동작, 정렬·필터 UI는 범위 밖.

## 현재 상태 (파악 결과)

- `app/(app)/garden/page.tsx`: "추후 구현됩니다" placeholder 텍스트만 존재. 주석에 "실제 UI는 Task 006, 데이터 연동은 Task 011"로 명시됨 → 본 작업에서 교체.
- `app/(app)/layout.tsx`: `SiteHeader(private)` + `Container`(flex-1) 골격 완성 → 그대로 사용. "타이머로 돌아가기" 동선은 헤더에 이미 존재하나, 페이지 내에도 보조 네비게이션을 둔다.
- `lib/mock-data.ts`: `MOCK_FOCUS_SESSIONS`(완료/포기 혼합, 날짜 내림차순 8건), `MOCK_GARDEN_PLANTS`(완료 세션 투영 6건), `getCompletedSessionCount()`, `getTotalFocusMinutes()`, `MOCK_EMPTY_SESSIONS`(빈 배열) 모두 정의됨 → 전량 재사용.
- `lib/types.ts`: `FocusSession`, `GardenPlant`, `PersistedSessionStatus`("completed" | "abandoned") 정의됨 → props 타입에 활용.
- `lib/constants.ts`: `PLANT_META`(한글 라벨·이모지), `GROWTH_STAGE_META` 정의됨 → 카드 라벨·상태 표기에 활용.
- `lib/time.ts`: `formatMMSS`만 존재. **총 집중 시간(분)→"N시간 M분" 표기 헬퍼는 없음**(본 작업에서 추가). **ISO 8601→날짜/시각 표시 헬퍼도 없음**(본 작업에서 신규 `lib/date.ts` 추가, Task 011 공유).
- `components/plant/plant.tsx`: `<Plant plantType stage withered? size? />` 디스패처. `size`는 `sm`/`md`/`lg` → 정원 카드는 `sm` 사용.
- 공통 컴포넌트: `button`/`card`/`badge`/`separator` 설치 완료 → 카드·집계·상태 배지·구분선에 사용. **탭 전환용 `tabs`는 미설치**(설계 결정 참조).
- `components/container.tsx`: `max-w-5xl` 반응형 컨테이너(레이아웃에서 이미 적용됨).

## 설계 결정

### 데이터 흐름 (서버 → 클라이언트 경계)
- `app/(app)/garden/page.tsx`(**서버 컴포넌트 유지**): `lib/mock-data.ts`에서 세션/식물/집계를 읽어 **`<GardenView>`에 props로 전달**. Task 011은 이 import 한 곳만 실제 Supabase 쿼리로 교체하면 되도록 경계를 좁힌다.
- `components/garden/garden-view.tsx`(`"use client"`): 정원/기록 **탭 전환 상태**만 클라이언트에서 관리. 데이터는 props로 받는다(페치는 서버 책임).

### 정원/기록 뷰 전환
- **shadcn `Tabs` 컴포넌트 설치 후 사용** (`npx shadcn@latest add tabs`, radix-ui 통합 패키지 기반). 탭: **"정원"**(식물 격자) / **"기록"**(세션 목록). 접근성(role/aria, 키보드 탐색)을 무료로 확보.
  - 설치가 여의치 않으면 대안: `Button`(variant 토글) 기반 경량 세그먼트 컨트롤 + 조건부 렌더(기존 타이머의 종류 선택 토글 패턴과 일관). **1차 시도는 Tabs**.
- 집계 영역(`<GardenStats>`)은 탭 위에 **항상 표시**(정원/기록 공통 요약).

### 하위 컴포넌트
- `components/garden/garden-stats.tsx`: 총 완료 세션 수 / 총 집중 시간 2~3개 `Card` 통계 타일. 총 집중 시간은 `formatMinutes`로 "N시간 M분" 표기.
- `components/garden/plant-card.tsx`: 단일 식물 카드 — `<Plant plantType stage="bloom" size="sm" />` + `PLANT_META` 라벨 + 심긴 날짜(`formatDate`) + 집중 시간(`formatMinutes`). `GardenPlant` 1건을 받는다.
- `components/garden/session-row.tsx`: 기록 1행 — 완료/포기 상태 `Badge`(완료 green / 포기 muted·destructive 계열), 식물 라벨·이모지, 집중 시간, 시작 시각(`formatTime`). `FocusSession` 1건을 받는다.
- `components/garden/empty-garden.tsx`: 빈 정원 안내 — "아직 심어진 식물이 없어요. 첫 집중을 시작해보세요!" + "타이머 시작하기"(→`/timer`) CTA.
- 페이지 하단 또는 헤더 영역에 **"타이머로 돌아가기"** 보조 링크(`Link href="/timer"`, lucide 아이콘).

### 기록 뷰 그룹핑
- `MOCK_FOCUS_SESSIONS`(완료+포기 모두 포함)를 **시작 시각 기준 날짜(YYYY-MM-DD)별로 그룹핑**해, 날짜 헤딩 + 해당 날짜 세션 행들을 나열(최신 날짜 우선). 그룹핑은 클라이언트/서버 어디서 해도 무방하나, 표시 로직이므로 `garden-view` 내 헬퍼 또는 `lib/date.ts` 보조 함수로 처리.

### 시간/날짜 포맷 헬퍼
- `lib/date.ts`(신규): `formatDate(iso)` → "2026년 6월 24일"(ko-KR `Intl.DateTimeFormat`), `formatTime(iso)` → "오전 9:00", `getDateKey(iso)` → "2026-06-24"(그룹핑 키). **Task 011이 동일 함수 재사용**(단일 진실 공급원). SSR/CSR 하이드레이션 불일치를 피하기 위해 `timeZone`을 고정(예: "Asia/Seoul")한다.
- `lib/time.ts`에 `formatMinutes(totalMinutes)` 추가 → "1시간 30분" / "25분"(0분 처리 포함). 집계·카드에서 공유.

### 반응형 레이아웃
- **정원 격자**: 모바일 2열(`grid-cols-2`) → `sm` 3열 → `lg` 4열. 카드 종횡 균형 유지.
- **기록 목록**: 단일 컬럼 세로 스택, 행은 `flex`로 좌(식물/날짜) · 우(상태/시간) 정렬.
- **집계 타일**: 모바일 1~2열 → 데스크톱 가로 정렬.

## 목표 파일 구조

```
app/(app)/garden/
└── page.tsx                      # 수정: 더미 데이터 import + <GardenView ... /> 마운트 (서버 컴포넌트 유지)
components/garden/
├── garden-view.tsx               # 신규 "use client": 집계 + 정원/기록 탭 전환 + 빈 상태 분기
├── garden-stats.tsx              # 신규: 총 완료 세션 수 / 총 집중 시간 통계 타일
├── plant-card.tsx                # 신규: 단일 식물 카드 (Plant bloom + 라벨 + 날짜 + 집중 시간)
├── session-row.tsx               # 신규: 기록 1행 (상태 배지 + 식물 + 집중 시간 + 시작 시각)
└── empty-garden.tsx              # 신규: 빈 정원 안내 + 타이머 CTA
lib/
└── date.ts                       # 신규: formatDate / formatTime / getDateKey (Task 011 공유)
components/ui/
└── tabs.tsx                      # 신규(shadcn add): 정원/기록 탭
lib/time.ts                       # 수정: formatMinutes(totalMinutes) 추가
```

> 페이지는 서버 컴포넌트로 유지하고 탭 상호작용만 `"use client"`로 분리한다. 더미 데이터·상수·타입은 `@/lib/mock-data`·`@/lib/constants`·`@/lib/types`를 재사용한다.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `app/(app)/garden/page.tsx` | 수정 | placeholder 제거 후 더미 데이터 import → `<GardenView>` props 전달 |
| `components/garden/garden-view.tsx` | 신규 | 집계 + 정원/기록 탭 전환 상태 머신, 빈 상태 분기, 날짜 그룹핑 |
| `components/garden/garden-stats.tsx` | 신규 | 총 완료 세션 수 / 총 집중 시간 통계 타일 |
| `components/garden/plant-card.tsx` | 신규 | `<Plant>` bloom + 라벨/날짜/집중 시간 카드 |
| `components/garden/session-row.tsx` | 신규 | 완료/포기 배지 + 식물 + 집중 시간 + 시작 시각 행 |
| `components/garden/empty-garden.tsx` | 신규 | 빈 정원 안내 + "타이머 시작하기" CTA |
| `lib/date.ts` | 신규 | `formatDate`/`formatTime`/`getDateKey` (Task 011 공유, timeZone 고정) |
| `lib/time.ts` | 수정 | `formatMinutes(totalMinutes)` 추가 |
| `components/ui/tabs.tsx` | 신규 | shadcn Tabs (정원/기록 전환) |

## 데이터 표현 명세 (참고)

| 영역 | 데이터 소스 | 표시 항목 |
|------|-------------|-----------|
| 집계 | `getCompletedSessionCount()`, `getTotalFocusMinutes()` | 총 완료 세션 수(개), 총 집중 시간(N시간 M분) |
| 정원 뷰 | `MOCK_GARDEN_PLANTS` | 식물 SVG(bloom) + 한글 라벨 + 심긴 날짜 + 집중 시간 |
| 기록 뷰 | `MOCK_FOCUS_SESSIONS` | 날짜별 그룹 → 상태 배지(완료/포기) + 식물 + 집중 시간 + 시작 시각 |
| 빈 상태 | `MOCK_EMPTY_SESSIONS` | 안내 문구 + 타이머 CTA |

## 수락 기준 (Acceptance Criteria)

- [ ] 정원 뷰가 `MOCK_GARDEN_PLANTS`를 식물 카드 격자로 렌더하며, 각 카드에 식물 SVG(bloom) + 한글 라벨 + 심긴 날짜 + 집중 시간이 표시된다.
- [ ] 기록 뷰가 `MOCK_FOCUS_SESSIONS`를 날짜별로 그룹핑해 나열하며, 완료/포기 상태가 배지로 구분되고 집중 시간·시작 시각이 표시된다.
- [ ] 총 완료 세션 수 / 총 집중 시간 집계가 `getCompletedSessionCount`·`getTotalFocusMinutes` 기반으로 정확히 표시된다(총 집중 시간은 "N시간 M분" 표기).
- [ ] 정원/기록 전환이 탭으로 동작하고, 집계 영역은 두 뷰 공통으로 항상 표시된다.
- [ ] 빈 정원 상태에서 "아직 심어진 식물이 없어요…" 안내와 타이머 CTA가 표시된다(`MOCK_EMPTY_SESSIONS`로 시연).
- [ ] "타이머로 돌아가기" 보조 네비게이션이 제공된다(`/timer` 링크).
- [ ] 정원 격자는 모바일 2열 → 데스크톱 4열, 기록은 단일 컬럼으로 반응형 동작한다.
- [ ] 페이지는 서버 컴포넌트로 유지되고, 더미 데이터를 props로 주입해 Task 011이 데이터 소스만 교체할 수 있는 경계가 확보된다.
- [ ] `lib/date.ts`·`formatMinutes`가 추가되고, 실제 Supabase 쿼리·세션 저장은 포함하지 않는다(Task 011 위임).
- [ ] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/하이드레이션 경고 없음).

## 구현 단계

> 코드 작성 전 Next.js 16 서버/클라이언트 경계, shadcn `Tabs` API(radix-ui 통합), Tailwind v4 토큰 사용을 재확인할 것. 날짜 포맷은 `timeZone`을 고정해 SSR/CSR 하이드레이션 불일치를 방지한다. 실제 데이터 페치는 본 작업에서 도입하지 않는다.

- [ ] `lib/date.ts`(`formatDate`/`formatTime`/`getDateKey`, timeZone 고정)·`lib/time.ts`(`formatMinutes`) 작성 + 간단한 출력 검증
- [ ] `npx shadcn@latest add tabs`로 `components/ui/tabs.tsx` 설치(실패 시 Button 세그먼트 토글 대안)
- [ ] `components/garden/garden-stats.tsx` 작성(집계 통계 타일)
- [ ] `components/garden/plant-card.tsx` 작성(`<Plant>` bloom + 라벨/날짜/집중 시간)
- [ ] `components/garden/session-row.tsx` 작성(상태 배지 + 식물 + 집중 시간 + 시작 시각)
- [ ] `components/garden/empty-garden.tsx` 작성(빈 정원 안내 + 타이머 CTA)
- [ ] `components/garden/garden-view.tsx` 작성(집계 + 정원/기록 탭 + 날짜 그룹핑 + 빈 상태 분기 + "타이머로 돌아가기")
- [ ] `app/(app)/garden/page.tsx` 수정(더미 데이터 import → `<GardenView>` props 전달)
- [ ] 반응형(정원 2→4열 / 기록 단일 컬럼 / 집계 타일) 정리
- [ ] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 검증 시나리오 (수동 / Playwright)

> UI 작업이며 실제 쿼리는 없으나, 탭 전환·날짜 그룹핑·빈 상태 분기는 동작 로직이므로 `npm run dev` 후 확인한다. 가능하면 Playwright로 각 뷰를 스냅샷/스크린샷으로 검증한다.

- [ ] **정원 뷰**: 식물 카드 격자가 6건(`MOCK_GARDEN_PLANTS`) 렌더되고, 식물 SVG·라벨·날짜·집중 시간이 올바른지 확인(스크린샷)
- [ ] **기록 뷰**: 날짜별 그룹과 완료/포기 배지, 집중 시간·시작 시각이 올바르게 표기되는지 확인
- [ ] **집계**: 총 완료 세션 수(6) / 총 집중 시간(완료 세션 합)이 정확히 표시되는지 확인
- [ ] **탭 전환**: 정원 ↔ 기록 전환 시 집계는 유지되고 본문만 바뀌는지, 키보드 탐색이 동작하는지 확인
- [ ] **빈 상태**: 빈 데이터로 전환 시(`MOCK_EMPTY_SESSIONS`) 안내 문구·CTA가 표시되는지 확인
- [ ] **네비게이션**: "타이머로 돌아가기"가 `/timer`로 이동하는지 확인
- [ ] **반응형**: 375px 정원 2열 / 데스크톱 4열, 기록 단일 컬럼 레이아웃 확인
- [ ] **하이드레이션**: 날짜/시각 표기가 SSR/CSR 간 일치(경고 없음)하는지 확인
- [ ] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과, 콘솔 에러/하이드레이션 경고 없음

## 변경 사항 요약

(구현 완료 후 작성)
