# Task 009: 타이머 신뢰성 로직 구현 (절대 시각 기반)

- **Phase**: 3 (핵심 기능 구현)
- **상태**: 완료
- **우선순위**: 높음
- **유형**: 비즈니스 로직

## 개요 (고수준 명세서)

타이머 페이지의 **더미 progress 슬라이더**를 **절대 시각(wall-clock) 기반 실제 카운트다운**으로 교체한다. 틱 카운팅(매 틱 `progress += step`) 대신 시작 시각을 저장하고 매 갱신마다 `elapsed = Date.now() - startTime`으로 경과 시간을 재계산해, 탭이 백그라운드로 throttle 되어도 정확한 시간을 보장한다.

범위와 경계:

- **절대 시각 기반 재계산**: 시작 시 `startTime = Date.now()`(ms)를 저장. 표시 갱신 인터벌마다 `elapsed = Date.now() - startTime`을 다시 구해 `progress = elapsed / totalMs`, `remaining = totalMs - elapsed`를 도출. 인터벌 카운터를 누적하지 않는다.
- **표시 갱신 주기**: 카운트다운(MM:SS)은 1초 간격으로 표시 갱신(`setInterval`). 표시값은 `Math.ceil(remaining / 1000)`초로 계산해 `formatMMSS`(기존 `lib/time.ts`)로 렌더.
- **백그라운드 복귀 보정**: `document`의 `visibilitychange`와 `window`의 `focus` 이벤트에서 `elapsed`를 즉시 재계산. 인터벌이 throttle 되어 누락된 시간을 복귀 즉시 따라잡는다.
- **종료 확정**: `elapsed >= totalMs`이면 인터벌/리스너를 정리하고 즉시 `completed`로 확정. 백그라운드 동안 종료 시각이 지났다면 복귀 즉시 `completed`로 전환.
- **상태 머신**: `idle → running → (completed | abandoned) → idle(reset)`. 포기 시 진행 중단 + 리스너 정리, 초기화 시 `idle`로 복귀.
- **범위 밖**: progress → CSS 변수 바인딩과 식물 성장 애니메이션은 **Task 010**. 세션 DB 저장(`startedAt`/`completedAt` 영속화) 및 식물 랜덤 배정은 **Task 011**. 이 작업은 클라이언트 타이머 로직과 상태 머신까지만 담당한다.

## 현재 상태 (파악 결과)

- `components/timer/timer-view.tsx`: `"use client"`. `status`(`idle`/`running`/`completed`/`abandoned`) + `progress` + `durationMinutes` 로컬 상태로 상태 머신을 시연한다. **`running` 중 progress는 `<input type="range">` 더미 슬라이더로 수동 조작** — 실제 시간 흐름이 없다. `remainingSeconds`는 `(1 - progress) * durationMinutes * 60`으로 슬라이더 값에서 역산. `getGrowthStage(progress)`로 식물 단계, `handleProgressChange(next)`에서 `next >= 1`이면 `completed` 전환.
- `lib/time.ts`: `formatMMSS(totalSeconds)` 구현 완료 → 카운트다운 표시에 재사용.
- `lib/plant.ts`: `getGrowthStage(progress)` 구현 완료 → `progress`만 실제 값으로 공급하면 그대로 동작(이 작업에서 단계 계산 로직은 수정하지 않음).
- `lib/constants.ts`: `DEFAULT_DURATION_MINUTES`, `MIN/MAX_DURATION_MINUTES` 정의됨. **타이머 틱 주기 상수는 없음** → 추가 필요.
- `components/timer/duration-input.tsx`, `components/timer/abandon-dialog.tsx`: 입력/포기 다이얼로그 완성 → 재사용.
- `components/plant/plant.tsx`: `plantType`/`stage`/`withered` prop으로 식물 렌더 → 재사용.

## 설계 결정

### 절대 시각 소스: `Date.now()` (벽시계)
백그라운드 탭에서 `performance.now()`나 인터벌 누적은 브라우저 throttle로 부정확해진다. `Date.now()`는 벽시계 기준이라 백그라운드 동안에도 실제 경과 시간을 정확히 반영한다. 시작 시각만 저장하고 매 갱신마다 차분(`Date.now() - startTime`)으로 재계산한다.

### 타이머 로직 분리: `useTimer` 커스텀 훅
타이머 상태/효과를 `components/timer/use-timer.ts`(또는 `lib/hooks/use-timer.ts`)의 `useTimer` 훅으로 추출한다. `TimerView`는 훅이 노출하는 값/액션만 소비해 렌더에 집중한다.
- **입력**: `durationMinutes`
- **반환 상태**: `status`, `progress`(0~1), `remainingSeconds`
- **반환 액션**: `start()`, `abandon()`, `reset()`
- **내부**: `startTimeRef`(ms)에 시작 시각 저장. `setInterval`(1초)로 매초 재계산해 `progress`/`remainingSeconds` state 갱신. `visibilitychange`/`focus` 리스너로 복귀 시 즉시 재계산. `elapsed >= totalMs`면 인터벌·리스너 정리 후 `completed` 확정. 언마운트/상태 전환 시 `clearInterval` + `removeEventListener`로 누수 방지.

### 표시 갱신 주기 상수
`lib/constants.ts`에 `TIMER_TICK_INTERVAL_MS = 1000`을 추가한다. 표시는 1초 간격이면 충분하며, 정밀도는 인터벌 빈도가 아니라 `Date.now()` 차분에서 나온다(이미 throttle 보정은 `visibilitychange`/`focus`가 담당).

### 종료·포기 처리
- **종료**: `elapsed >= totalMs` 감지 시 `progress=1`, `remainingSeconds=0`으로 확정하고 `status='completed'`. (완료 토스트는 기존 `TimerView`의 `useEffect`가 처리 — 유지.)
- **포기**: `abandon()`은 인터벌·리스너를 정리하고 `status='abandoned'`로 전환(시각은 동결). 포기 확인 다이얼로그(`AbandonDialog`)는 기존 흐름 유지.
- **초기화**: `reset()`은 `startTimeRef` 클리어, `progress=0`, `status='idle'`.

### `TimerView` 변경
- `running` 블록의 **더미 `<input type="range">` 슬라이더 제거**.
- `useState<progress>` / 수동 `handleProgressChange` 제거 → `useTimer` 훅으로 대체.
- `remainingSeconds`는 훅 반환값을 사용(역산 제거). 식물 `stage`는 기존대로 `getGrowthStage(progress)`에 훅의 실제 `progress`를 전달.

## 목표 파일 구조

```
components/timer/
├── use-timer.ts          # 신규: 절대 시각 기반 타이머 훅 (상태 머신 + 백그라운드 보정)
└── timer-view.tsx        # 수정: 더미 슬라이더 제거 → useTimer 연결
lib/constants.ts          # 수정: TIMER_TICK_INTERVAL_MS 추가
```

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `components/timer/use-timer.ts` | 신규 | `useTimer` 훅 — 절대 시각 재계산, 1초 표시 갱신, 백그라운드 복귀 보정, 상태 머신 |
| `components/timer/timer-view.tsx` | 수정 | 더미 progress 슬라이더 제거, `useTimer` 연결, 카운트다운/식물 단계에 실제 값 공급 |
| `lib/constants.ts` | 수정 | `TIMER_TICK_INTERVAL_MS` 표시 갱신 주기 상수 추가 |
| `lib/time.ts` | 재사용 | `formatMMSS` 카운트다운 표시 |
| `lib/plant.ts` | 재사용 | `getGrowthStage(progress)` 식물 단계 계산 |
| `components/timer/duration-input.tsx` | 재사용 | 집중 시간 입력 |
| `components/timer/abandon-dialog.tsx` | 재사용 | 포기 확인 다이얼로그 |

## 수락 기준 (Acceptance Criteria)

- [x] `idle`에서 집중 시간 설정 후 시작하면 카운트다운(MM:SS)이 1초 간격으로 감소한다.
- [x] 카운트다운은 인터벌 누적이 아니라 `Date.now() - startTime` 차분으로 계산된다(틱 카운팅 금지).
- [x] 백그라운드 탭으로 전환했다가 복귀하면 경과 시간이 실제 벽시계 기준으로 즉시 보정된다.
- [x] 탭이 백그라운드인 동안 종료 시각이 지나면, 복귀 즉시 `completed`로 확정된다.
- [x] `elapsed >= total` 시점에 `progress=1`, 카운트다운 `00:00`, `completed` 상태로 전환되고 완료 토스트가 표시된다.
- [x] 진행 중 포기하면 진행이 중단되고, 초기화하면 `idle`로 복귀한다(인터벌·리스너 누수 없음).
- [x] 식물 성장 단계가 실제 `progress` 값에 따라 구간별로 전환된다(`getGrowthStage`).
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/경고 없음).

## 구현 단계

> 절대 시각 재계산이 핵심이다. 인터벌 콜백 안에서 카운터를 누적하지 말고, 매 호출마다 `Date.now() - startTimeRef.current`로 `elapsed`를 새로 구한다. `useEffect` 정리 함수에서 `clearInterval` + `removeEventListener`를 반드시 수행해 누수와 좀비 타이머를 막는다.

- [x] `lib/constants.ts`에 `TIMER_TICK_INTERVAL_MS = 1000` 추가
- [x] `components/timer/use-timer.ts` 작성 (`useTimer(durationMinutes)` — `startTimeRef`, 1초 인터벌 재계산, `visibilitychange`/`focus` 보정, `elapsed >= totalMs` 완료 확정, `start`/`abandon`/`reset` 액션, 정리 함수)
- [x] `components/timer/timer-view.tsx` 수정 (더미 `<input type="range">`·수동 progress 제거, `useTimer` 연결, `remainingSeconds`/`progress` 훅 값 사용)
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 테스트 체크리스트 (Playwright 기반 E2E 또는 수동 검증)

> Playwright의 `page.clock` API(`clock.install` + `clock.fastForward`)로 가상 시간을 빨리감아 짧은 시간 안에 카운트다운/완료/백그라운드 보정을 검증할 수 있다. 수동 검증 시 개발자 도구로 탭을 백그라운드 처리한 뒤 복귀해 보정을 확인한다.

- [x] **백그라운드 복귀 보정**: 진행 중 다른 탭으로 전환 후 일정 시간 뒤 복귀 → 경과 시간이 실제 시각 기준으로 정확히 보정되는지 확인 _(Playwright `setSystemTime` +40초 후 `visibilitychange` → `00:20` 보정 확인)_
- [x] **백그라운드 중 종료**: 탭이 백그라운드인 동안 종료 시각 경과 후 복귀 → 즉시 `completed` 확정되는지 확인 _(인터벌 없이 70초 점프 후 복귀 → 즉시 완료 화면)_
- [x] **짧은 시간 완료 정확도**: 1분 타이머의 완료 시점이 실제 60초에 맞는지 확인 _(`page.clock.fastForward` 65초 → 완료)_
- [x] **포기 흐름**: 진행 중 포기 → 진행 중단 및 초기 상태 복귀, 좀비 인터벌이 남지 않는지 확인 _(포기 후 120초 점프에도 완료 미전이 확인)_
- [x] **카운트다운 표시**: MM:SS가 1초 간격으로 감소하고 `00:00`에서 멈추는지 확인 _(`01:00` → `00:30` 확인)_

## 변경 사항 요약

타이머 페이지의 더미 progress 슬라이더를 절대 시각(`Date.now()`) 기반 실제 카운트다운으로 교체했다. 시작 시각만 저장하고 매 갱신마다 차분으로 경과 시간을 재계산해 백그라운드 throttle 상황에서도 정확도를 보장한다.

### 신규 파일
- `components/timer/use-timer.ts`: `useTimer(durationMinutes)` 훅. `startTimeRef`(절대 시각) + `totalMsRef` 보관, 1초 인터벌마다 `elapsed = Date.now() - startTime` 재계산(`sync`), `elapsed >= totalMs` 시 `completed` 확정. `visibilitychange`/`focus` 리스너로 복귀 시 즉시 재동기화. `start`/`abandon`/`reset` 액션과 정리 함수(`clearInterval` + `removeEventListener`)로 좀비 타이머·리스너 누수 방지.

### 수정 파일
- `lib/constants.ts`: `TIMER_TICK_INTERVAL_MS = 1000` 추가(표시 갱신 주기; 정밀도는 인터벌이 아니라 `Date.now()` 차분에서 나옴).
- `components/timer/timer-view.tsx`: 더미 `<input type="range">` 슬라이더와 수동 `progress`/`handleProgressChange` 제거. `useTimer` 훅 연결로 `status`/`progress`/`remainingSeconds`와 `start`/`abandon`/`reset` 소비. running 영역은 진행률(%) 표시로 교체, 카운트다운·식물 단계(`getGrowthStage`)는 훅의 실제 `progress` 사용.

### 검증
- `npx tsc --noEmit`·`npm run lint`·`npm run build` 모두 통과.
- Playwright `page.clock`(가상 시간) E2E: 카운트다운(`01:00`→`00:30`), 65초 완료 확정, 백그라운드 40초 보정(`00:20`), 백그라운드 중 종료 후 복귀 즉시 완료, 포기 흐름 + 좀비 타이머 부재(포기 후 120초 점프에도 미전이) 전부 통과.
