# Task 011: 세션 저장 및 정원 데이터 연동

- **Phase**: 3 (핵심 기능 구현)
- **상태**: 완료
- **우선순위**: 높음
- **유형**: 비즈니스 로직 / 데이터 영속화

## 개요 (고수준 명세서)

Task 009(타이머 신뢰성)·Task 010(식물 성장)에서 완성한 클라이언트 타이머를 **실제 데이터 영속화**로 연결한다. 핵심은 세 가지다: (1) 타이머가 **완료/포기로 종결되면 `focus_sessions`에 INSERT**하고, (2) **완료 세션에는 식물 종류를 랜덤 배정**하며, (3) **정원 페이지의 더미 데이터(`lib/mock-data.ts`)를 실제 Supabase 쿼리로 교체**한다. DB·RLS(Task 007)와 인증 세션(Task 008)은 이미 갖춰져 있으므로, 본 작업은 그 위에서 "쓰기(타이머 종결)"와 "읽기(정원 조회)"를 배선하는 것이다.

범위와 경계:

- **세션 저장 (쓰기)**: 타이머가 `completed`/`abandoned`로 전환되는 시점에 Server Action을 호출해 `focus_sessions`에 한 행을 INSERT한다. `user_id`는 서버에서 `getUser()`로 확정(클라이언트가 임의 주입 불가 → RLS `with check (auth.uid() = user_id)` 충족). 컬럼: `duration_minutes`, `status`, `plant_type`, `started_at`, `completed_at`.
- **식물 랜덤 배정**: `start()` 시점에 `PLANT_TYPES`에서 랜덤으로 한 종을 뽑아 **진행 중 자라는 식물과 저장되는 식물을 일치**시킨다(완료 후 "방금 키운 식물"이 그대로 정원에 심긴다). 기존 데모용 수동 식물 선택 UI는 제거한다.
- **정원 조회 (읽기)**: 정원 페이지(서버 컴포넌트)를 async로 만들어 `focus_sessions`를 본인 것만 조회(RLS가 자동 필터)하고, snake_case→camelCase 매핑 후 (a) 정원 식물 격자, (b) 날짜별 기록, (c) 집계(총 완료 수/총 집중 시간)를 모두 실제 데이터로 렌더한다.
- **완료 피드백**: 완료 저장 성공 시 "정원에 심기 완료!" 토스트를 띄우고, 사용자는 "정원으로"/"다시 집중"으로 이동/초기화한다(기존 완료 UI 흐름 유지).
- **빈 정원 상태**: 데이터가 없는 신규 사용자에게는 기존 `EmptyGarden` 안내가 그대로 표시된다(쿼리 결과가 빈 배열이면 자연 동작).
- **범위 밖**: 통합 E2E(전체 여정·엣지 케이스 종합)는 **Task 012**. 로딩/스켈레톤/에러 바운더리 정교화는 **Task 013**. 본 작업은 정상 경로 저장·조회와 그에 필요한 최소 에러 토스트까지만 담당한다.

## 현재 상태 (파악 결과)

- `components/timer/timer-view.tsx`: `"use client"`. `useTimer`로 상태 머신을 구동한다. 완료 진입 시 `useEffect`로 **데모 토스트("정원 저장은 추후 연결됩니다")만** 띄운다 — DB 저장 없음. `plantType`은 **수동 선택 버튼(데모용)** 으로 결정되며, 주석에 "실제 랜덤 배정은 Task 011"로 명시. `startedAt`을 보관하지 않는다.
- `components/timer/use-timer.ts`: 절대 시각 기반 훅. `startTimeRef`(시작 ms)를 내부 보관하지만 **외부로 노출하지 않는다**. `status`/`progress`/`remainingSeconds` + `start`/`abandon`/`reset`만 반환. 저장에 필요한 `startedAt`을 얻으려면 노출이 필요하다.
- `app/(app)/garden/page.tsx`: **서버 컴포넌트지만 동기**이며 `lib/mock-data.ts`의 `MOCK_GARDEN_PLANTS`/`MOCK_FOCUS_SESSIONS`와 집계 헬퍼를 그대로 쓴다. 파일 상단 주석에 "Task 011에서 실제 Supabase 쿼리 함수로 교체"라고 명시.
- `lib/mock-data.ts`: 더미 세션/식물/집계 헬퍼. **실제 소스 소비자는 정원 페이지 단 한 곳**(나머지 매칭은 docs·tasks 문서). 따라서 Task 011 완료 후 제거 가능.
- `components/garden/garden-view.tsx`: `plants`/`sessions`/`completedCount`/`totalMinutes` props를 받아 렌더하는 클라이언트 컴포넌트. **데이터 출처와 무관하게 props만 소비** → 시그니처를 유지하면 수정 불필요(더미→실데이터 교체가 page에 국한된다).
- `lib/types.ts`: `FocusSession`(camelCase, `status: PersistedSessionStatus`)·`GardenPlant`·`PersistedSessionStatus`(`'completed'|'abandoned'`) 정의 완료. DB 행(snake_case)↔도메인 타입(camelCase) 매핑 함수만 추가하면 된다.
- `lib/supabase/server.ts`: async `createClient()`(쿠키 기반). 서버 컴포넌트/액션에서 사용. `app/(app)/layout.tsx`가 이미 `getUser()`로 보호 라우트를 검증하므로, 정원/저장 시점에 인증 사용자가 보장된다.
- `app/actions/auth.ts`: `"use server"` + 서버 `createClient()` 패턴의 선례(로그아웃). 세션 저장 액션도 동일 패턴을 따른다.
- **DB(Task 007 적용 완료)**: `public.focus_sessions`(RLS on, 정책 4종, CHECK: duration 1~180 / status∈{completed,abandoned} / plant_type∈{tulip,sunflower,cactus}), 인덱스 `(user_id, created_at desc)`, `garden_plants` View(`security_invoker`, `status='completed'` 투영). 현재 0행.

## 설계 결정

### 저장 경로: Server Action (`app/actions/session.ts`)
타이머 종결 시 호출하는 **`saveSession` Server Action**(`"use server"`)을 신규 작성한다. 클라이언트 직접 INSERT가 아니라 서버 액션을 쓰는 이유:
- `user_id`를 서버에서 `getUser()`로 확정 → 클라이언트가 타인 명의를 주입할 수 없다(RLS `with check`와 이중 방어).
- 쓰기 로직을 서버에 집중하고, 저장 직후 `revalidatePath('/garden')`로 정원 라우터 캐시를 무효화해 다음 방문 시 최신 데이터를 보장한다.
- 기존 `app/actions/auth.ts`와 동일한 서버 액션 패턴으로 일관성 유지.

**시그니처**: `saveSession(input: { durationMinutes: number; plantType: PlantType; status: PersistedSessionStatus; startedAt: string; completedAt: string }): Promise<{ ok: true } | { ok: false; error: string }>`
- 내부: 서버 `createClient()` → `getUser()`(미인증이면 실패 반환) → `insert({ user_id, duration_minutes, status, plant_type, started_at, completed_at })` → 성공 시 `revalidatePath('/garden')`.
- 예외/에러는 throw 대신 `{ ok: false, error }`로 반환해 클라이언트가 토스트로 처리(타이머 화면이 깨지지 않게).

### 식물 랜덤 배정: `start()` 시점 고정
`lib/plant.ts`에 `pickRandomPlantType(): PlantType`(`PLANT_TYPES`에서 균등 랜덤)을 추가한다. `TimerView`는 `start` 시 한 번 뽑아 state에 고정하고, 그 값으로 (a) 진행 중 `GrowingPlant`를 키우고 (b) 종결 시 저장한다 → **본 화면에서 자란 식물과 정원에 심기는 식물이 동일**. 기존 수동 선택 버튼 UI(`PLANT_TYPES.map(...)`)는 제거하고, idle에서는 기본값(`tulip`, progress 0 = 씨앗이라 종류 무관)으로 미리보기만 둔다.

> 랜덤은 클라이언트에서 수행한다. 식물 종류는 게임성 리워드일 뿐 보안 자원이 아니므로 서버 강제가 불필요하고, 진행 중 자라는 식물과 저장값을 일치시키려면 클라이언트가 시작 시점에 정해야 자연스럽다.

### `startedAt` 노출: `useTimer` 최소 확장
저장에는 `started_at`/`completed_at`가 필요하다. `useTimer`가 이미 보유한 시작 시각을 단일 진실 공급원으로 노출한다: 반환값에 **`startedAt: number | null`**(= `startTimeRef.current`, epoch ms)를 추가한다. `TimerView`는 이를 ISO 문자열로 변환해 저장하고, `completedAt`은 종결 처리 시점의 `new Date().toISOString()`을 사용한다. 포기 시에도 동일(시작~포기 시각 기록). 훅의 기존 로직(인터벌/보정/상태 머신)은 변경하지 않고 반환값만 1개 추가한다.

### 중복 저장 방지: 1회성 가드
완료/포기는 상태 전이이며 `useEffect`/리렌더로 콜백이 여러 번 트리거될 수 있다(특히 React Strict Mode 이중 호출). `TimerView`에 `savedRef`(현재 세션의 저장 완료 플래그)를 두어 **한 세션당 정확히 1회만** `saveSession`을 호출한다. `reset()`(다시 집중) 시 플래그를 초기화한다.

### 정원 데이터 조회: `lib/garden.ts` 서버 함수
정원 페이지에서 직접 쿼리하지 않고, **서버 전용 데이터 함수 `getGardenData()`**(`lib/garden.ts`)로 분리한다.
- 내부: 서버 `createClient()` → `from('focus_sessions').select('*').order('created_at', { ascending: false })`(RLS가 본인 행만 반환). 행을 `mapFocusSession(row)`로 camelCase 매핑.
- 반환: `{ sessions, plants, completedCount, totalMinutes }`. `plants`는 완료 세션을 `GardenPlant`로 투영(기존 `mock-data`의 파생 로직 이식), 집계는 완료 세션 기준 합산.
- **정원 식물은 `focus_sessions` 단일 조회에서 파생**한다(`garden_plants` View 별도 조회 대신). 한 번의 쿼리로 기록·정원·집계를 모두 만들어 왕복을 줄인다. View는 SQL 레벨 대안으로 유지하되 본 화면 경로에선 쓰지 않는다.
- `mapFocusSession(row)`: snake_case DB 행 → `FocusSession`(camelCase). 매핑을 한 곳에 모아 컬럼명 변경에 대응.

### `mock-data.ts` 제거
정원 페이지가 `getGardenData()`로 전환되면 `lib/mock-data.ts`의 유일한 소스 소비자가 사라진다 → 파일을 삭제한다(집계 헬퍼 로직은 `lib/garden.ts`로 이식). 삭제 전 `grep`으로 잔여 import가 없는지 재확인한다.

### 정원 페이지: async 서버 컴포넌트화
`app/(app)/garden/page.tsx`를 `async`로 바꿔 `const { sessions, plants, completedCount, totalMinutes } = await getGardenData();` 후 동일 props로 `GardenView`에 전달한다. `GardenView` 시그니처가 유지되므로 하위 컴포넌트는 무수정.

## 목표 파일 구조

```
app/actions/session.ts        # 신규: saveSession Server Action (insert + revalidatePath)
lib/garden.ts                 # 신규: getGardenData() 서버 조회 + mapFocusSession 매핑 + 집계
lib/plant.ts                  # 수정: pickRandomPlantType() 추가
components/timer/use-timer.ts # 수정: 반환값에 startedAt(epoch ms) 추가
components/timer/timer-view.tsx # 수정: 랜덤 식물 배정, 종결 시 saveSession 호출(savedRef 가드), 토스트
app/(app)/garden/page.tsx     # 수정: async화, mock-data → getGardenData()
lib/mock-data.ts              # 삭제: 더미 데이터 (소스 소비자 정원 페이지뿐)
```

## 관련 파일

| 파일 | 구분 | 역할 |
|------|------|------|
| `app/actions/session.ts` | 신규 | `saveSession` 서버 액션 — `getUser()`로 user_id 확정, `focus_sessions` INSERT, `revalidatePath('/garden')` |
| `lib/garden.ts` | 신규 | `getGardenData()` 서버 조회 + `mapFocusSession` snake→camel 매핑 + 정원/집계 파생 |
| `lib/plant.ts` | 수정 | `pickRandomPlantType()` 추가 (`getGrowthStage`는 무수정) |
| `components/timer/use-timer.ts` | 수정 | 반환값에 `startedAt`(epoch ms) 노출 (인터벌/상태 머신 로직 무수정) |
| `components/timer/timer-view.tsx` | 수정 | `start` 시 랜덤 식물 고정, 완료/포기 시 `saveSession` 1회 호출(`savedRef`), 성공/실패 토스트, 수동 선택 UI 제거 |
| `app/(app)/garden/page.tsx` | 수정 | async 서버 컴포넌트로 `getGardenData()` 사용 |
| `lib/mock-data.ts` | 삭제 | 더미 데이터 제거 (집계 로직은 `lib/garden.ts`로 이식) |
| `components/garden/garden-view.tsx` | 재사용 | props 시그니처 유지 → 무수정 |
| `lib/supabase/server.ts` | 재사용 | 서버 `createClient()` (액션·조회 공통) |
| `lib/types.ts` | 재사용 | `FocusSession`/`GardenPlant`/`PersistedSessionStatus` (무수정) |
| `lib/constants.ts` | 재사용 | `PLANT_TYPES`(랜덤 풀) (무수정) |

## 수락 기준 (Acceptance Criteria)

- [x] 타이머 완료 시 `focus_sessions`에 `status='completed'` 행이 1건 저장되고, `plant_type`은 진행 중 자란 식물과 동일하다(랜덤 배정값 일치). _(저장 행 plant_type=tulip = 화면 식물 일치 확인)_
- [x] 저장 행의 `user_id`가 로그인 사용자의 id이고(`getUser()` 확정), `started_at`/`completed_at`/`duration_minutes`가 실제 세션 값과 일치한다. _(started 14:40:47 ↔ completed 14:41:47, 정확히 60초 / duration 1)_
- [x] 타이머 포기 시 `focus_sessions`에 `status='abandoned'` 행이 1건 저장된다. _(started_at 보존: 14:42:21 → completed 14:42:31)_
- [x] 한 세션은 정확히 1회만 저장된다(완료/포기 콜백·리렌더·Strict Mode 이중 호출에도 중복 INSERT 없음 — `savedRef` 가드). _(각 status당 cnt=1 확인)_
- [x] 정원 페이지의 정원 격자·날짜별 기록·집계(총 완료 수/총 집중 시간)가 모두 실제 본인 데이터로 렌더된다(더미 미사용). _(완료 1/1분, 정원 튤립 카드, 기록 완료·포기 2건)_
- [x] 본인 세션만 조회된다(RLS) — 타 사용자 데이터가 노출되지 않는다. _(타 사용자 sunflower 주입 후에도 정원 1건 유지)_
- [x] 데이터 없는 신규 사용자에게 빈 정원 안내(`EmptyGarden`)가 표시된다. _(신규 계정 가입 직후 0/0분 + EmptyGarden)_
- [x] 완료 저장 성공 시 "정원에 심기 완료!" 토스트가 표시되고, "정원으로" 이동 시 방금 심은 식물이 보인다(`revalidatePath` 반영). _(완료 직후 정원에 튤립 즉시 반영)_
- [x] `lib/mock-data.ts`가 제거되고 잔여 import가 없다.
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 통과(콘솔 에러/경고 없음).

## 구현 단계

> 쓰기는 서버 액션이 `getUser()`로 `user_id`를 확정해야 한다(클라이언트 주입 금지 — RLS `with check`와 이중 방어). 저장은 한 세션당 1회로 묶어 중복 INSERT를 막고(`savedRef`), 저장 후 `revalidatePath('/garden')`로 정원 캐시를 무효화한다. 읽기는 RLS가 본인 행만 반환하므로 별도 `user_id` 필터가 불필요하다.

- [x] `lib/plant.ts`에 `pickRandomPlantType()` 추가
- [x] `components/timer/use-timer.ts` 반환값에 `startedAt`(epoch ms) 노출 (기존 로직 무수정 — 단 `abandon` 시 ref만 비우고 `startedAt` state는 보존, `reset`에서 초기화)
- [x] `app/actions/session.ts` 작성 (`"use server"` `saveSession` — `getUser()`, `focus_sessions` INSERT, `revalidatePath('/garden')`, `{ ok, error }` 반환)
- [x] `components/timer/timer-view.tsx` 수정 (`start` 시 `pickRandomPlantType`로 식물 고정·수동 선택 UI 제거, 완료/포기 시 `saveSession` 1회 호출 + `savedRef` 가드, `reset` 시 가드 초기화, 성공 "정원에 심기 완료!"·실패 에러 토스트)
- [x] `lib/garden.ts` 작성 (`getGardenData()` 서버 조회 + `mapFocusSession` 매핑 + 정원 투영/집계, `mock-data` 집계 로직 이식)
- [x] `app/(app)/garden/page.tsx`를 async화하고 `getGardenData()`로 교체
- [x] `lib/mock-data.ts` 삭제 (잔여 import `grep` 재확인 후)
- [x] `npx tsc --noEmit`·`npm run lint`·`npm run build` 실행 및 통과 확인

## 테스트 체크리스트 (Playwright 기반 E2E 또는 수동 검증)

> 실제 로그인 세션으로 짧은 타이머(예: 1분, `page.clock.fastForward`)를 완료/포기시켜 DB 저장과 정원 반영을 검증한다. 저장 결과는 정원 화면(UI)과 함께, 필요 시 MCP `execute_sql`/`list_tables`의 `focus_sessions` 행 수·컬럼값으로 교차 확인한다. 검증용 행은 정리한다.

- [x] **완료 저장 → 정원 반영**: 1분 타이머 완료 → `focus_sessions`에 `completed` 1건 저장 → "정원으로" 이동 시 정원 격자에 식물이 추가되고 종류가 진행 중 자란 식물과 일치하는지 확인. _(실 60초 타이머 완료, plant_type=tulip 일치, 정원에 만개 튤립 카드)_
- [x] **포기 저장**: 진행 중 포기 → `focus_sessions`에 `abandoned` 1건 저장 → 기록 뷰에 포기 항목으로 표시되는지 확인. _(포기 다이얼로그 확정 → abandoned 1건, 기록 "포기 25분" 표시)_
- [x] **중복 저장 방지**: 완료/포기 1회당 정확히 1행만 저장되는지 확인(행 수 검증 — Strict Mode·리렌더에도 중복 없음). _(group by status: completed cnt=1, abandoned cnt=1)_
- [x] **정원/기록 실데이터 렌더**: 정원 격자·날짜별 기록·집계(총 완료 수/총 집중 시간)가 실제 데이터와 일치하는지 확인. _(완료 1/총 1분, 기록 날짜그룹에 완료·포기 created_at 내림차순)_
- [x] **빈 정원 상태**: 데이터 없는 신규 사용자 계정에서 `EmptyGarden` 안내가 표시되는지 확인. _(가입 직후 0건 + "아직 심어진 식물이 없어요")_
- [x] **사용자 격리(RLS)**: 다른 사용자의 식물/기록이 보이지 않는지 확인(본인 데이터만 조회). _(타 사용자 sunflower 완료행 주입 후 재조회에도 정원 1건 유지 — 미노출)_
- [x] **완료 토스트/캐시 무효화**: 완료 시 "정원에 심기 완료!" 토스트 표시 및 `revalidatePath`로 정원 즉시 갱신 확인. _(완료 직후 /garden 이동 시 식물 즉시 반영)_

## 변경 사항 요약

클라이언트 전용이던 타이머(Task 009/010)를 실제 데이터 영속화로 연결했다. 타이머가 완료/포기로 종결되면 `focus_sessions`에 세션을 저장하고, 완료 세션에는 식물을 랜덤 배정하며, 정원 페이지의 더미 데이터를 실제 Supabase 쿼리로 교체했다. 쓰기는 서버 액션이 `getUser()`로 `user_id`를 확정해 RLS와 이중 방어하고, 읽기는 RLS가 본인 행만 반환한다.

### 신규 파일
- `app/actions/session.ts`: `saveSession` Server Action(`"use server"`). 서버 `createClient()` + `getUser()`로 `user_id`를 확정해 `focus_sessions`에 INSERT하고, 성공 시 `revalidatePath('/garden')`로 정원 라우터 캐시를 무효화한다. 예외는 throw 대신 `{ ok, error }`로 반환해 타이머 화면이 토스트로 처리하게 한다.
- `lib/garden.ts`: `getGardenData()` 서버 조회. `focus_sessions`를 한 번 조회(RLS가 본인 행만 반환, `created_at` 내림차순)해 `mapFocusSession`(snake_case→camelCase)으로 매핑하고, 기록·정원 식물 투영·집계(완료 수/총 분)를 한 번에 파생한다.

### 수정 파일
- `lib/plant.ts`: `pickRandomPlantType()` 추가(`PLANT_TYPES` 균등 랜덤).
- `components/timer/use-timer.ts`: 반환값에 `startedAt`(epoch ms) 노출. `abandon` 시 sync용 `startTimeRef`는 비우되 저장용 `startedAt` state는 보존하고(포기도 시작 시각 기록), `reset`에서 초기화.
- `components/timer/timer-view.tsx`: `start` 시 `pickRandomPlantType`로 식물을 고정(진행 중 자란 식물 = 저장 식물)하고 수동 선택 UI를 제거. 완료/포기 종결 시 `savedRef` 가드로 `saveSession`을 정확히 1회 호출, 완료 성공 시 "정원에 심기 완료!" 토스트·실패 시 에러 토스트. `reset` 시 가드 초기화.
- `app/(app)/garden/page.tsx`: async 서버 컴포넌트로 전환해 `getGardenData()` 결과를 `GardenView`에 전달(시그니처 유지 → 하위 컴포넌트 무수정).

### 삭제 파일
- `lib/mock-data.ts`: 정원 페이지가 실제 쿼리로 전환되며 유일한 소스 소비자가 사라져 제거(집계 로직은 `lib/garden.ts`로 이식).

### 검증
- `npx tsc --noEmit`·`npm run lint`·`npm run build` 모두 통과(`/garden`·`/timer`가 동적 라우트로 분류).
- Playwright E2E(신규 계정, 실 60초 타이머): 빈 정원 → 완료 저장(plant_type 일치, 60초 정확) → 정원 즉시 반영 → 포기 저장(started_at 보존) → 중복 없음(상태당 1건) → 기록 뷰 완료·포기 렌더 → 타 사용자 행 주입에도 RLS 격리 유지까지 전부 확인. 검증용 데이터는 정리 완료.
