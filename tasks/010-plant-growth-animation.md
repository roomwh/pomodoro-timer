# Task 010: 식물 성장 애니메이션 구현 (CSS 변수 바인딩)

- **Phase**: 3 (핵심 기능 구현)
- **상태**: 완료
- **우선순위**: 높음
- **유형**: 비즈니스 로직 / UI 인터랙션

## 개요 (고수준 명세서)

Task 009에서 완성한 **실제 `progress`(0.0~1.0)** 를 식물의 **실시간 성장 시각화**로 연결한다. 핵심은 `progress`를 **CSS 변수(`--progress`)** 로 바인딩해 식물 성장(크기/투명도/위치)을 **CSS transition이 60fps로 보간**하도록 만드는 것이다. React는 1초에 한 번만 갱신하고(카운트다운과 동일 주기), 매끄러운 60fps 애니메이션은 GPU 합성(transform/opacity)이 담당한다 → **애니메이션을 위한 초당 다회 리렌더(requestAnimationFrame setState 등)를 회피**한다.

범위와 경계:

- **CSS 변수 바인딩**: 식물 SVG 루트에 `style={{ "--progress": progress }}`로 진행도를 주입. SVG 성장 그룹의 `transform`(scale/translateY)·`opacity`가 `var(--progress)`를 참조하고, `transition`으로 1초 틱 사이를 부드럽게 보간한다.
- **단계 분기(이산)**: `getGrowthStage(progress)`(기존 `lib/plant.ts`)로 씨앗(0~0.10) / 새싹(0.10~0.40) / 꽃봉오리(0.40~0.80) / 만개(0.80~1.00) 파츠 셋을 전환. 단계 경계의 파츠 교체는 전체 스케일이 연속적으로 자라는 위에서 일어나므로 시각적으로 자연스럽게 이어진다.
- **리렌더 최소화**: SVG 파츠(`PARTS_BY_TYPE`)는 `useMemo`로 `plantType`+`stage`에만 의존시켜 같은 단계 동안 **동일 element 참조**를 반환 → React가 해당 서브트리 재조정(reconcile)을 건너뛴다. 매초 바뀌는 것은 루트의 `--progress` 인라인 스타일뿐.
- **만개/시들기 연출**: 만개 진입 시 꽃잎 펼침 `@keyframes bloom`(scale pop), 포기 시 시들기(grayscale + sepia + rotate)를 정적 클래스가 아니라 **transition**으로 부드럽게 적용.
- **백그라운드 복귀 점프**: Task 009의 보정으로 `progress`가 큰 폭으로 갱신되면, CSS transition이 고정 시간(약 0.6~0.9s) 동안 보정된 단계로 자연스럽게 따라간다(무한정 지연 없음).
- **접근성**: `@media (prefers-reduced-motion: reduce)`에서 transition/keyframe을 무력화해 모션 민감 사용자를 보호한다.
- **범위 밖**: 세션 DB 저장·정원 반영·식물 랜덤 배정은 **Task 011**. 타이머 시간 로직(절대 시각 재계산)은 **Task 009에서 완료** — 본 작업은 이미 공급되는 `progress`를 시각화만 한다.

## 현재 상태 (파악 결과)

- `components/timer/timer-view.tsx`: `useTimer`에서 받은 실제 `progress`로 `getGrowthStage(progress)`를 매 렌더 계산해 `<Plant stage=... withered=...>`에 전달한다. `progress`가 1초마다 바뀌면 `TimerView` 전체가 리렌더되고, 그 안의 `Plant`도 매초 재조정된다(현재는 이산 단계 점프 — 부드러운 성장 없음).
- `components/plant/plant.tsx`: `plantType`+`stage`+`withered`로 SVG를 렌더하는 **정적** 디스패처. `withered`는 `[filter:grayscale...] rotate-6 opacity-70` 정적 클래스로 표현(transition 없음). 정원 페이지에서도 사용(정적 렌더 유지 필요) → "use client"가 아니다.
- `components/plant/assets/{tulip,sunflower,cactus}.tsx`: 단계별 이산 파츠. 만개 꽃잎 그룹은 **세 종 모두 `data-part="petal"`** 로 일관 → bloom keyframe 셀렉터 단일화 가능. 성장 그룹으로 묶을 대상은 `data-part="soil"`을 제외한 나머지 파츠다.
- `lib/plant.ts`: `getGrowthStage(progress)` 구현 완료. 주석에 "Task 010도 이 함수를 재사용한다"고 명시 → 그대로 재사용(단계 계산 로직 수정 금지).
- `lib/constants.ts`: `GROWTH_STAGE_RANGES`(0.1/0.4/0.8 경계) 정의됨 → `getGrowthStage`가 사용. 본 작업은 경계값을 수정하지 않는다.
- `app/globals.css`: Tailwind v4 CSS-first. 디자인 토큰만 정의되어 있고 **식물 애니메이션 관련 CSS/keyframe 없음** → 추가 필요.

## 설계 결정

### `progress` → CSS 변수 바인딩 (초당 다회 리렌더 회피)
부드러운 성장의 원천은 React가 아니라 **CSS transition**이다. `progress`는 Task 009의 1초 인터벌로만 state 갱신되고, 식물 루트의 `--progress` 인라인 스타일로 전달된다. SVG 성장 그룹의 `transform`/`opacity`가 `var(--progress)`를 참조하고 `transition: ... 0.9s linear`를 가지므로, 1초 간격의 이산 갱신 사이를 CSS가 60fps로 보간한다. 즉 **애니메이션 프레임마다 setState 하지 않는다.**

### 리렌더 격리: 신규 `GrowingPlant` 클라이언트 컴포넌트
정원에서 쓰는 기존 `Plant`는 정적(서버 렌더 친화)이므로 그대로 두고, 타이머 전용 애니메이션 래퍼 `components/plant/growing-plant.tsx`("use client")를 신규로 만든다.
- **props**: `plantType`, `progress`(0~1), `withered?`
- **내부**: `stage = getGrowthStage(progress)` 도출. 파츠는 `useMemo(() => PARTS_BY_TYPE[plantType](effectiveStage), [plantType, effectiveStage])`로 메모이즈 → 같은 단계 동안 동일 참조 반환, React가 SVG 파츠 서브트리 재조정을 생략. 루트 `<svg>`에 `--progress` 인라인 변수와 성장/만개/시들기 클래스를 부여.
- `PARTS_BY_TYPE` 매핑은 `plant.tsx`에서 `export`해 `GrowingPlant`와 공유(중복 정의 금지).

### 성장 모델: HTML 래퍼 + 인라인 transform/opacity (⚠ CSS var() 제약 발견)
당초 흙 제외 파츠를 `<g class="plant-growth">`로 감싸 `transform: scale(calc(var(--progress)…))` 식의 **순수 CSS 변수 바인딩**을 쓰려 했으나, **브라우저 검증 중 두 가지 제약을 확인**했다:
1. SVG `<g>`의 CSS `transform`/`opacity`에 `var()`를 쓰면 custom property 변경이 재계산을 트리거하지 않는다(일반 HTML 요소에서는 정상).
2. HTML 요소라도 **스타일시트 규칙의 `transform: …calc(var(--progress))…`** 는 변수 변경 시 재치환되지 않는다(미등록 custom property가 로드 시점에 미등록으로 파싱·캐시되어, 사후 `@property` 등록도 기존 규칙에 적용되지 않음). 동기 측정에서 `--progress`를 0→1로 바꿔도 렌더 크기가 불변임을 확인.

따라서 **식물 SVG를 감싸는 HTML `<div class="plant-growth">`** 를 쓰되, **scale/opacity 값 자체는 `GrowingPlant`가 `progress`로부터 계산해 인라인 style로 주입**한다(인라인 숫자 값은 항상 반영). `--progress` 변수도 함께 바인딩해 진행도를 요소에 노출한다.
- 인라인: `transform: scale(0.72 + progress * 0.28)`, `opacity: 0.45 + progress * 0.55` (React가 1초에 1회 갱신)
- CSS 클래스(정적): `transform-origin: 50% 100%`(화분 밑동 기준), `transition: transform/opacity 0.9s linear`, `will-change`
React는 1초에 한 번만 인라인 값을 바꾸고 **CSS transition이 틱 사이를 60fps로 보간**한다(GPU 합성 transform/opacity). 이산 단계 파츠 교체가 연속 스케일 위에서 일어나 "씨앗→만개"가 끊김 없이 이어진다. 화분(soil)도 함께 스케일되지만 밑동 기준이라 자연스럽다. 만개 keyframe·시들기 filter는 SVG에서 정상 동작하므로 SVG 내부에 유지한다.

### 만개 keyframe / 시들기 transition
- **만개**: `stage === "bloom"`일 때 루트에 `data-stage="bloom"` 부여. CSS에서 `[data-stage="bloom"] [data-part="petal"] { animation: bloom 0.6s ease-out both; }`. `@keyframes bloom`은 꽃잎을 `scale(0.6)` opacity 0 → `scale(1.08)` → `scale(1)`로 펼친다(transform-box: fill-box로 각 꽃잎 중심 기준).
- **시들기**: `withered`를 `.plant-withered` 클래스로 표현하되 정적이 아니라 `transition: filter 0.7s, transform 0.7s, opacity 0.7s`로 부드럽게 grayscale+sepia+rotate 적용. 기존 `Plant`의 정적 시들기 표현과 시각 결과는 동일하게 맞춘다.

### 접근성 — reduced motion
`@media (prefers-reduced-motion: reduce)`에서 `.plant-growth`/`.plant-withered`/bloom의 `transition`·`animation`을 `none`으로 두어, 최종 상태는 유지하되 모션만 제거한다.

### `TimerView` 변경
`<Plant ...>` → `<GrowingPlant plantType={plantType} progress={progress} withered={isAbandoned} />`로 교체. 완료 시 `progress`는 이미 1(→ `getGrowthStage`가 bloom), 포기 시 `withered`로 시들기. idle은 `progress` 0(→ 씨앗, 작게). `getGrowthStage` 호출과 `plantStage` 분기 로직은 `GrowingPlant` 내부로 이동해 `TimerView`를 단순화.

## 목표 파일 구조

```
components/plant/
├── plant.tsx            # 수정: PARTS_BY_TYPE export (정적 Plant는 정원용으로 유지)
└── growing-plant.tsx    # 신규: progress→CSS 변수 바인딩, useMemo 파츠, 만개/시들기 클래스
components/timer/
└── timer-view.tsx       # 수정: Plant → GrowingPlant 교체, getGrowthStage 분기 제거
app/globals.css          # 수정: .plant-growth/.plant-withered, @keyframes bloom, reduced-motion
```

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `components/plant/growing-plant.tsx` | 신규 | `progress` CSS 변수 바인딩 + 단계 메모이즈 + 만개/시들기 연출 (타이머 전용 애니메이션 식물) |
| `components/plant/plant.tsx` | 수정 | `PARTS_BY_TYPE` export로 파츠 매핑 공유. 정적 정원 렌더는 그대로 유지 |
| `components/timer/timer-view.tsx` | 수정 | `Plant` → `GrowingPlant` 교체, `getGrowthStage`/`plantStage` 분기 제거 |
| `app/globals.css` | 수정 | `.plant-growth` 성장 변환, `@keyframes bloom`, `.plant-withered` transition, reduced-motion 가드 |
| `lib/plant.ts` | 재사용 | `getGrowthStage(progress)` 단계 분기 (수정 없음) |
| `lib/constants.ts` | 재사용 | `GROWTH_STAGE_RANGES` 경계값 (수정 없음) |
| `components/plant/assets/*.tsx` | 재사용 | 단계별 파츠 (`data-part="petal"` 만개 셀렉터 대상, 수정 없음) |

## 수락 기준 (Acceptance Criteria)

- [x] 진행 중 식물이 1초 단위 점프가 아니라 **연속적으로 자라는 것처럼** 부드럽게 커진다(CSS transition 보간). _(렌더 width 단조 증가: 161.3→168.2→200.7→224.0)_
- [x] `progress` 구간에 따라 씨앗(0~0.10)/새싹(0.10~0.40)/꽃봉오리(0.40~0.80)/만개(0.80~1.00) 파츠가 정확한 경계에서 전환된다(`getGrowthStage`). _(0.117 sprout / 0.767 bud → 0.833 bloom 경계 확인)_
- [x] 성장 변환은 `transform`/`opacity`(GPU 합성)만 사용한다. `--progress`를 요소에 바인딩하되, 값 자체는 progress로부터 계산해 인라인 적용한다(스타일시트 `calc(var())` 미반영 이슈 회피).
- [x] 만개 진입 시 꽃잎 펼침(`@keyframes bloom`)이 1회 재생된다(세 식물 모두 `data-part="petal"`). _(animation-name "bloom" 0.6s, transform-box fill-box, @keyframes 존재 확인)_
- [x] 포기 시 시들기(grayscale+sepia+rotate)가 transition으로 부드럽게 적용된다. _(filter grayscale(0.6) sepia(0.35) + rotate 6° + opacity 0.7 확인)_
- [x] 매초 갱신 시 SVG 파츠 서브트리가 재조정되지 않는다(같은 단계 동안 `useMemo` 동일 참조). _(틱 전후 파츠 노드 참조 동일성 `===` true, 래퍼 인라인만 갱신)_
- [x] 백그라운드 복귀로 `progress`가 점프하면 보정된 단계로 자연스럽게 따라간다. _(식물은 progress의 순수 함수 — Task 009에서 검증한 progress 보정을 그대로 따름)_
- [x] `prefers-reduced-motion: reduce` 환경에서 모션이 제거되고 최종 상태는 유지된다. _(@media 규칙으로 transition/animation none 확인)_
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/경고 없음).

## 구현 단계

> 부드러움의 원천은 CSS transition이다. 애니메이션을 위해 `requestAnimationFrame`+`setState`로 초당 다회 리렌더하지 말 것. React는 1초에 한 번(Task 009 인터벌)만 `--progress`를 갱신하고 나머지는 CSS가 보간한다. 파츠는 반드시 `useMemo`로 단계에만 의존시켜 동일 참조를 유지해야 서브트리 재조정이 생략된다.

- [x] `components/plant/plant.tsx`에서 `PARTS_BY_TYPE` export (정적 `Plant`는 정원용으로 그대로 유지)
- [x] `app/globals.css`에 `.plant-growth`(transform-origin + transition + will-change), `@keyframes bloom`, `.plant-withered`(transition), `@media (prefers-reduced-motion: reduce)` 가드 추가
- [x] `components/plant/growing-plant.tsx` 작성 (`"use client"`, props: `plantType`/`progress`/`withered`, `getGrowthStage`로 stage 도출, `useMemo` 파츠, SVG를 `<div class="plant-growth">`로 래핑하고 `--progress` + 계산된 `transform`/`opacity`를 인라인 주입, `data-stage`/시들기 클래스)
- [x] `components/timer/timer-view.tsx` 수정 (`Plant` → `GrowingPlant` 교체, `getGrowthStage`/`plantStage` 분기 제거, idle=0·완료=1·포기=withered 전달)
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 테스트 체크리스트 (Playwright 기반 E2E 또는 수동 검증)

> 실제 1분 타이머를 구동해 React가 갱신하는 진행도를 그대로 관찰했다(수동 style poke는 React가 style을 소유해 무효 → 실 타이머 관찰이 유일한 유효 검증). 단계 전환은 래퍼 `data-stage`/SVG `aria-label`로, 성장은 렌더 width/인라인 transform 추이로, 리렌더 회피는 파츠 DOM 노드 참조 동일성으로, 만개/시들기는 스크린샷·computed style로 확인했다.

- [x] **단계 경계 전환**: `progress`가 0.10/0.40/0.80을 지날 때 씨앗→새싹→꽃봉오리→만개로 정확히 전환되는지 확인 _(샘플: 0.117=sprout, 0.767=bud → 0.833=bloom, aria-label/data-stage 일치)_
- [x] **부드러운 성장**: 같은 단계 내에서 인라인 transform(scale)이 1초 틱 사이에 CSS transition으로 보간되는지 확인 _(width 161.3→168.2→200.7→213.3→224.0 단조 증가, transition 0.9s linear 적용)_
- [x] **리렌더 회피**: 매초 갱신 동안 SVG 파츠 서브트리가 재조정되지 않는지 확인 _(같은 단계 틱 전후 파츠 노드 `===` 동일, 래퍼 인라인 transform만 갱신)_
- [x] **만개 연출**: 완료(progress=1) 시 꽃잎 펼침 keyframe이 재생되는지 확인 _(만개 튤립 스크린샷 + petal에 animation "bloom" 0.6s 배선 확인)_
- [x] **시들기 연출**: 포기 시 grayscale+sepia+rotate가 transition으로 적용되는지 확인 _(시든 튤립 스크린샷 + filter/rotate/opacity computed 확인)_
- [x] **백그라운드 복귀 점프**: 식물은 progress의 순수 함수이므로, Task 009에서 검증한 백그라운드 progress 보정을 그대로 따라 보정된 단계로 점프한다(별도 회귀 불필요)
- [x] **reduced motion**: `prefers-reduced-motion: reduce` 미디어 규칙으로 `.plant-growth`/`.plant-withered` transition과 만개 animation이 none 처리됨을 확인(최종 상태 유지)

## 변경 사항 요약

타이머의 실제 `progress`(Task 009)를 식물 실시간 성장 시각화로 연결했다. 진행도가 씨앗→새싹→꽃봉오리→만개로 단계 전환되며 동시에 식물이 연속적으로 커지고(scale 0.72→1.0) 또렷해진다(opacity 0.45→1.0). React는 1초에 한 번만 값을 갱신하고 CSS transition이 틱 사이를 60fps로 보간한다.

### 신규 파일
- `components/plant/growing-plant.tsx`: 타이머 전용 애니메이션 식물(`"use client"`). `getGrowthStage(progress)`로 단계를 도출하고, 파츠를 `useMemo(plantType, effectiveStage)`로 메모이즈해 같은 단계 동안 동일 참조를 유지(→ SVG 파츠 서브트리 재조정 생략). SVG를 `<div class="plant-growth">`로 감싸 `--progress`와 progress로부터 계산한 `transform: scale(...)`/`opacity`를 인라인 주입하고, `data-stage`로 만개 keyframe을, `plant-withered` 클래스로 시들기를 제어.

### 수정 파일
- `components/plant/plant.tsx`: `PARTS_BY_TYPE`를 export해 `GrowingPlant`와 파츠 매핑 공유(정적 `Plant`는 정원용으로 유지).
- `components/timer/timer-view.tsx`: `Plant` → `GrowingPlant` 교체, `getGrowthStage`/`plantStage` 분기 제거(단계 도출을 `GrowingPlant` 내부로 이동). idle=progress 0, 완료=progress 1, 포기=`withered` 전달.
- `app/globals.css`: `.plant-growth`(transform-origin 50% 100% + transition 0.9s linear + will-change), `@keyframes bloom`(꽃잎 펼침), `.plant-withered`(grayscale+sepia+rotate transition), `@media (prefers-reduced-motion: reduce)` 가드 추가.

### 설계 변경 (검증 중 발견)
- ROADMAP의 "CSS 변수(`--progress`) 바인딩"을 시도했으나, **이 렌더링 엔진에서 스타일시트 규칙의 `transform: …calc(var(--progress))…`는 변수 변경 시 재계산되지 않음**(SVG `<g>`·HTML 요소 공통, 사후 `@property` 등록도 무효)을 동기 측정으로 확인. `--progress`는 요소에 그대로 바인딩하되, **scale/opacity 값은 progress로부터 계산해 인라인 적용**하는 방식으로 전환(인라인 숫자 값은 항상 반영, transition은 동일하게 동작). 60fps 보간·리렌더 회피라는 본래 목표는 그대로 달성.

### 검증
- `npx tsc --noEmit`·`npm run lint`·`npm run build` 모두 통과.
- Playwright 실 타이머(1분) E2E: 단계 경계 전환(0.767 bud→0.833 bloom), 성장 보간(width 161.3→224.0 단조 증가), 완료 만개·포기 시들기 스크린샷, 만개 keyframe/시들기 filter computed 배선, 리렌더 회피(파츠 노드 참조 동일), reduced-motion 규칙까지 전부 확인.
