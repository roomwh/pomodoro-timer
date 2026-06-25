# Task 005: 타이머 페이지 UI 및 식물 SVG 에셋 제작

- **Phase**: 2 (UI/UX 완성 — 더미 데이터 활용)
- **상태**: 완료
- **우선순위**: 일반
- **유형**: UI/에셋 (실제 타이머 로직·애니메이션 엔진은 제외)

## 개요 (고수준 명세서)

앱의 핵심 화면인 **타이머 페이지(`/timer`)**의 정적 UI를 완성하고, 식물 성장 시각화의 토대가 될 **식물 SVG 에셋 컴포넌트**를 제작한다. 3종(튤립/해바라기/선인장) × 4단계(씨앗/새싹/꽃봉오리/만개) + 시들기 표현을 **단계 기반으로 렌더하는 `<Plant>` 컴포넌트**를 만들고, 타이머의 3가지 상태(설정/진행/완료)를 **더미 progress로 시연**하는 화면을 구성한다.

범위와 경계:

- **실제 타이머 로직 없음**: `Date.now()` 기반 절대 시각 계산, `elapsed` 재계산, 백그라운드 보정, 카운트다운 자동 감소는 **Task 009**. 본 작업은 **수동 더미 progress 컨트롤**(슬라이더/버튼)로 상태·단계 전환을 시연한다.
- **progress→CSS 변수 애니메이션 엔진 없음**: `--progress` 바인딩, `@keyframes bloom`, 시들기 grayscale/rotate 트랜지션, 60fps GPU 가속 최적화는 **Task 010**. 본 작업은 **단계별 정적(discrete) SVG 렌더**와 시들기의 **정적 표현**까지만 책임진다(부드러운 보간은 Task 010).
- **세션 저장·식물 랜덤 배정 없음**: 완료/포기는 UI 상태 전환과 로컬 토스트까지만. `focus_sessions` 저장과 `plant_type` 랜덤 배정은 **Task 011**. 데모에서는 식물 종류를 **수동 선택**해 3종 에셋을 미리본다.
- **보호 라우트 실제 검증 없음**: `(app)/layout.tsx`의 `getClaims()` 세션 검증은 **Task 008**. 본 작업은 레이아웃을 수정하지 않고 페이지 내용만 채운다.
- **랜딩 미리보기(`plant-preview.tsx`)는 손대지 않음**: Task 004의 장식용 제네릭 미리보기는 그대로 둔다. 본 작업의 `<Plant>`는 타이머용 **종류별 정식 에셋**이다(추후 랜딩을 `<Plant>`로 리팩터링할 수 있으나 범위 밖).

## 현재 상태 (파악 결과)

- `app/(app)/timer/page.tsx`: "추후 구현됩니다" placeholder 텍스트만 존재. 주석에 "실제 UI는 Task 005, 타이머 로직은 Task 009"로 명시됨.
- `app/(app)/layout.tsx`: `SiteHeader(private)` + `Container`(flex-1) 골격 완성 → 그대로 사용.
- `lib/constants.ts`: `PLANT_TYPES`/`PLANT_META`(한글·이모지), `GROWTH_STAGES`/`GROWTH_STAGE_META`, **`GROWTH_STAGE_RANGES`**(progress 구간), `MIN/MAX/DEFAULT_DURATION_MINUTES` 모두 정의됨 → 재사용. **단, progress→stage 변환 함수는 아직 없음**(본 작업에서 추가, Task 010과 공유).
- `lib/schemas.ts`: `focusSettingsSchema`(1~180 정수) 정의됨 → 설정 입력 검증에 활용.
- 공통 컴포넌트: `button`/`input`/`card`/`dialog`/`field`/`sonner`/`label` 설치 완료 → 포기 다이얼로그·설정 입력·완료 토스트에 사용.
- `components/plant-preview.tsx`: 랜딩용 제네릭 4단계 정적 SVG(장식). 본 작업의 `<Plant>`와 별개.

## 설계 결정

### 식물 SVG 에셋 아키텍처
- **단일 디스패처 컴포넌트** `components/plant/plant.tsx`: `<Plant plantType stage withered? size? className? />`.
  - `plantType`(`PlantType`)과 `stage`(`GrowthStage`)에 따라 해당 종류·단계의 인라인 SVG를 렌더.
  - `withered`(boolean): 시들기 **정적 표현**(예: `class` 토글로 칙칙한 색/기울임). 부드러운 트랜지션은 Task 010.
- **종류별 SVG 모듈** `components/plant/assets/{tulip,sunflower,cactus}.tsx`: 각 종류가 4단계(씨앗/새싹/꽃봉오리/만개)를 그리는 SVG. **공통 구조 규약**으로 Task 010이 애니메이션을 입힐 수 있게 한다:
  - 동일 `viewBox`, 공통 베이스(화분/흙), 줄기·잎·봉오리·꽃잎을 **그룹(`<g data-part="stem|leaf|bud|petal">`)**으로 분리.
  - 색상은 `currentColor`·디자인 토큰 기반(잎 green). 종류별 포인트 색(튤립 분홍/해바라기 노랑/선인장 진녹)은 SVG 내부에서 정의하되 토큰과 조화.
- **단계 표현은 discrete**: 씨앗→흙 속 점, 새싹→짧은 줄기+떡잎, 꽃봉오리→줄기+봉오리, 만개→꽃 핀 형태. 단계 간 **부드러운 보간은 하지 않는다**(Task 010).

### progress → 단계 변환 (공유 헬퍼)
- `lib/plant.ts`(신규): `getGrowthStage(progress: number): GrowthStage` — `GROWTH_STAGE_RANGES`로 0~1을 씨앗/새싹/꽃봉오리/만개에 매핑(경계는 constants와 동일, `withered` 제외). **Task 010이 동일 함수를 재사용**(단일 진실 공급원).
- MM:SS 포맷 헬퍼 `lib/time.ts`(신규): `formatMMSS(totalSeconds: number): string`. Task 009 카운트다운이 재사용.

### 타이머 화면 상태 머신 (UI 더미)
- `components/timer/timer-view.tsx`(`"use client"`): 로컬 state로 3상태 시연.
  - **`idle`(설정)**: 집중 시간 입력(`DurationInput`) + "집중 시작" 버튼. 식물은 씨앗.
  - **`running`(진행)**: 카운트다운(MM:SS) 표시 + 성장 중 식물 + "포기" 버튼. **더미 progress 컨트롤**(슬라이더 0~1)로 단계 전환·카운트다운 표시를 수동 시연.
  - **`completed`(완료)**: 만개 식물 + 완료 메시지 + "정원으로"(→`/garden`)·"다시 집중" 버튼 + 완료 토스트(`sonner`).
  - 상태 전환: 시작→running, 포기(다이얼로그 확인)→idle(초기화), progress=1 또는 "완료" 시연 버튼→completed.
- **데모용 식물 종류 선택기**: 3종 에셋을 미리보기 위한 토글(실제 랜덤 배정은 Task 011임을 주석 명시).
- **더미 progress 주의**: `setInterval` 기반 자동 카운트다운은 두지 않는다(Task 009 영역). 수동 슬라이더/버튼으로만 progress를 움직인다.

### 하위 컴포넌트
- `components/timer/duration-input.tsx`: 숫자 입력 + `-`/`+` 버튼(스텝 1·5분 고려), `MIN/MAX_DURATION_MINUTES` 클램프, `focusSettingsSchema`로 검증(범위 밖 입력 방지). lucide `Minus`/`Plus`.
- `components/timer/abandon-dialog.tsx`: shadcn `Dialog` 기반 포기 확인("정말 포기할까요? 자라던 식물이 시들어요."). 확인 시 시들기 표현 후 초기화.
- 카운트다운 표시는 `timer-view` 내 인라인 또는 소형 컴포넌트로 분리.

### 반응형 레이아웃
- **모바일 우선 단일 컬럼**: 식물(상단) → 카운트다운/컨트롤(하단) 세로 스택.
- **데스크톱 2컬럼**(`lg` 이상): 좌측 식물 시각 영역 / 우측 설정·컨트롤. `Card`로 컨트롤 영역을 감싼다.

## 목표 파일 구조

```
app/(app)/timer/
└── page.tsx                      # 수정: <TimerView /> 마운트 (서버 컴포넌트 유지)
components/timer/
├── timer-view.tsx                # 신규 "use client": 상태 머신 + 더미 progress 시연
├── duration-input.tsx            # 신규 "use client": 숫자 + -/+ 버튼 (1~180 클램프)
└── abandon-dialog.tsx            # 신규 "use client": 포기 확인 다이얼로그
components/plant/
├── plant.tsx                     # 신규: <Plant plantType stage withered? /> 디스패처
└── assets/
    ├── tulip.tsx                 # 신규: 튤립 4단계 SVG
    ├── sunflower.tsx             # 신규: 해바라기 4단계 SVG
    └── cactus.tsx                # 신규: 선인장 4단계 SVG
lib/
├── plant.ts                      # 신규: getGrowthStage(progress) (Task 010과 공유)
└── time.ts                       # 신규: formatMMSS(totalSeconds) (Task 009와 공유)
```

> 페이지는 서버 컴포넌트로 유지하고 상호작용 UI만 `"use client"`로 분리한다. 상수/스키마는 `@/lib/constants`·`@/lib/schemas`를 재사용한다.

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `app/(app)/timer/page.tsx` | 수정 | placeholder 제거 후 `<TimerView />` 마운트 |
| `components/timer/timer-view.tsx` | 신규 | idle/running/completed 상태 머신 + 더미 progress 슬라이더 + 식물/카운트다운/컨트롤 조립 |
| `components/timer/duration-input.tsx` | 신규 | 집중 시간 숫자 입력 + `-`/`+` 버튼, 1~180 클램프, `focusSettingsSchema` 검증 |
| `components/timer/abandon-dialog.tsx` | 신규 | 포기 확인 `Dialog`, 확인 시 시들기→초기화 |
| `components/plant/plant.tsx` | 신규 | `plantType`+`stage`+`withered`로 SVG 디스패치, `size` 지원 |
| `components/plant/assets/tulip.tsx` | 신규 | 튤립 씨앗/새싹/꽃봉오리/만개 SVG (그룹 구조) |
| `components/plant/assets/sunflower.tsx` | 신규 | 해바라기 4단계 SVG |
| `components/plant/assets/cactus.tsx` | 신규 | 선인장 4단계 SVG |
| `lib/plant.ts` | 신규 | `getGrowthStage(progress)` (Task 010 공유) |
| `lib/time.ts` | 신규 | `formatMMSS(totalSeconds)` (Task 009 공유) |

## 식물 단계 표현 명세 (참고)

| 단계 | progress | 공통 시각 표현 |
|------|----------|----------------|
| `seed` | 0~0.10 | 화분/흙 + 흙 속 씨앗(점) |
| `sprout` | 0.10~0.40 | 짧은 줄기 + 떡잎 1~2장 |
| `bud` | 0.40~0.80 | 자란 줄기 + 닫힌 꽃봉오리(선인장은 가시/돌기) |
| `bloom` | 0.80~1.00 | 꽃 핀 형태(종류별 포인트 색) |
| `withered` | (포기 시 특수 상태) | 마지막 단계 형태에 칙칙한 색/기울임 — **정적 표현만**, 트랜지션은 Task 010 |

## 수락 기준 (Acceptance Criteria)

- [x] `<Plant plantType stage />`가 3종 × 4단계(총 12조합)를 올바른 SVG로 렌더하고, `withered` 표현이 정적으로 동작한다.
- [x] 식물 SVG는 잎 green 디자인 토큰 기반이며, 종류별 포인트 색이 구분된다. 그룹(`data-part`) 구조로 분리되어 Task 010 애니메이션 연동이 가능하다.
- [x] 타이머 페이지가 설정/진행/완료 3상태를 모두 렌더하고, 상태 전환(시작/포기/완료/초기화)이 더미로 동작한다.
- [x] 집중 시간 입력이 숫자 입력 + `-`/`+` 버튼으로 동작하고, 1~180 범위로 클램프되며 범위 밖 입력이 차단된다.
- [x] 진행 상태에서 카운트다운(MM:SS)이 표시되고, 더미 progress(슬라이더) 변화에 따라 식물 단계가 `GROWTH_STAGE_RANGES` 경계대로 전환된다.
- [x] 포기 시 확인 다이얼로그가 뜨고, 확인하면 시들기 표현 후 초기 상태로 복귀한다.
- [x] 완료 상태에서 만개 식물 + 완료 토스트 + "정원으로"/"다시 집중" 동선이 제공된다.
- [x] 모바일 단일 컬럼 / 데스크톱(`lg`) 2컬럼 반응형이 정상 동작한다.
- [x] `lib/plant.ts`·`lib/time.ts` 헬퍼가 추가되고, 실제 타이머 로직(자동 카운트다운/절대 시각)·CSS 변수 애니메이션 엔진은 포함하지 않는다(Task 009/010 위임).
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과.

## 구현 단계

> 코드 작성 전 Next.js 16 서버/클라이언트 경계, shadcn `Dialog` API, Tailwind v4 토큰 사용을 재확인할 것. 자동 타이밍(`setInterval`/`Date.now`)과 progress→CSS 변수 바인딩은 본 작업에서 도입하지 않는다.

- [x] `lib/plant.ts`(`getGrowthStage`)·`lib/time.ts`(`formatMMSS`) 작성 + 간단한 단위 검증
- [x] `components/plant/assets/{tulip,sunflower,cactus}.tsx` 4단계 SVG 작성(공통 viewBox·`data-part` 그룹 구조)
- [x] `components/plant/plant.tsx` 디스패처 작성(`plantType`+`stage`+`withered`+`size`)
- [x] `components/timer/duration-input.tsx` 작성(숫자 + `-`/`+`, 1~180 클램프, 검증)
- [x] `components/timer/abandon-dialog.tsx` 작성(포기 확인 Dialog)
- [x] `components/timer/timer-view.tsx` 작성(상태 머신 + 더미 progress 슬라이더 + 식물 종류 선택 + 카운트다운/컨트롤 조립 + 완료 토스트)
- [x] `app/(app)/timer/page.tsx` 수정(`<TimerView />` 마운트)
- [x] 반응형(모바일 단일 컬럼 / `lg` 2컬럼) 정리
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 검증 시나리오 (수동 / Playwright)

> UI/에셋 작업이며 실제 타이머 로직은 없으나, 상태 전환·단계 분기·입력 클램프는 동작 로직이므로 `npm run dev` 후 확인한다. 가능하면 Playwright로 상태 전환과 식물 단계 변화를 스냅샷/스크린샷으로 검증한다.

- [x] **식물 에셋**: 데모 종류 선택기로 튤립/해바라기/선인장을 전환하며 4단계 SVG가 모두 올바르게 렌더되는지 확인(스크린샷)
- [x] **시들기 표현**: 포기 확인 시 식물이 시든 정적 표현으로 바뀌는지 확인
- [x] **설정 상태**: 집중 시간 입력에서 `-`/`+` 동작, 0/181 등 범위 밖 입력이 1~180으로 클램프/차단되는지 확인
- [x] **진행 상태**: 더미 progress 슬라이더를 0→1로 움직이면 씨앗→새싹→꽃봉오리→만개가 `GROWTH_STAGE_RANGES` 경계(0.10/0.40/0.80)에서 전환되는지 확인
- [x] **카운트다운 표시**: progress/설정 시간에 따른 MM:SS 표기가 `formatMMSS`로 올바른지 확인(자동 감소는 Task 009)
- [x] **포기 플로우**: "포기" → 다이얼로그 → 확인 시 초기 상태 복귀, 취소 시 진행 유지
- [x] **완료 플로우**: progress=1 또는 완료 시연 → 만개 + 완료 토스트 + "정원으로"/"다시 집중" 동선 확인
- [x] **반응형**: 375px 단일 컬럼 / 데스크톱 2컬럼 레이아웃 확인
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과, 콘솔 에러/하이드레이션 경고 없음

## 변경 사항 요약

- **공유 헬퍼**(`lib/plant.ts`·`lib/time.ts`, 신규): `getGrowthStage(progress)`는 `GROWTH_STAGE_RANGES` 경계로 0~1을 씨앗/새싹/꽃봉오리/만개에 매핑(클램프 포함, `withered` 제외) — Task 010과 공유. `formatMMSS(totalSeconds)`는 `MM:SS` 포맷 — Task 009 카운트다운과 공유.
- **식물 SVG 에셋**(`components/plant/assets/{tulip,sunflower,cactus}.tsx`, 신규): 종류별 4단계(씨앗/새싹/꽃봉오리/만개) 파츠 함수. 공통 `viewBox(0 0 120 140)`·줄기 베이스 (60,118), 녹색은 테마 토큰(`fill-primary`/`stroke-primary`), 포인트 색(튤립 분홍·해바라기 노랑+갈색 중심·선인장 분홍 꽃)은 명시. `<g data-part="stem|leaf|bud|petal">` 그룹 구조로 Task 010 애니메이션 연동 대비.
- **식물 디스패처**(`components/plant/plant.tsx`, 신규): `<Plant plantType stage withered? size? />` — 공통 흙 베이스 + 종류별 파츠 렌더, `withered` 시 정적 시들기 표현(`grayscale`+`sepia`+`rotate-6`+`opacity-70`). `role="img"`/`aria-label` 포함.
- **타이머 하위 컴포넌트**(신규, `"use client"`): `duration-input.tsx`(숫자 입력 + `-`/`+`, 1~180 클램프, 기본 스텝 5분, `분` 접미사), `abandon-dialog.tsx`(shadcn `Dialog` 포기 확인, "계속 집중하기"/"포기하기").
- **타이머 상태 머신**(`components/timer/timer-view.tsx`, 신규, `"use client"`): `idle`/`running`/`completed`/`abandoned` 4상태. 설정(종류 선택 + 집중 시간 + 시작), 진행(식물 성장 + 카운트다운 MM:SS + **수동 데모 progress 슬라이더** + 포기), 완료(만개 + 완료 토스트 + "정원으로"/"다시 집중"), 포기(시들기 + "새로 시작"). 자동 타이밍(`setInterval`/`Date.now`)·progress→CSS 변수 바인딩은 도입하지 않음(Task 009/010 위임).
- **페이지 마운트**(`app/(app)/timer/page.tsx`, 수정): placeholder 제거 후 `<TimerView />`를 **서버 컴포넌트에서 마운트**.
- **레이아웃**: 모바일 단일 컬럼(식물 상단 → 컨트롤 하단) / `lg` 2컬럼(식물 좌 · 컨트롤 카드 우).
- **검증**: `tsc --noEmit`·`lint`·`build`(8/8 정적 생성) 통과. Playwright로 ▲3종 만개 에셋(튤립/해바라기/선인장) ▲설정(씨앗) ▲진행(60%→꽃봉오리, 카운트다운 10:00 정확) ▲완료(만개+토스트) ▲포기(다이얼로그→시들기→복귀) ▲999분→180 클램프(+버튼 비활성) ▲375px 단일 컬럼을 시각·구조 확인. 콘솔 에러/하이드레이션 경고 없음.
