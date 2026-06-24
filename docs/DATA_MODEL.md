# 데이터 모델 설계 (Supabase)

> **상태**: 설계 문서. 실제 테이블 생성·RLS 적용·정원 전략 최종 결정은 **Task 007**에서 수행한다.
> 이 문서는 도메인 타입(`lib/types.ts`)과 짝을 이루는 DB 측 스펙을 정의한다.

## 개요

집중 세션 1건은 `focus_sessions` 테이블의 한 행으로 영속된다. 진행 중(`in_progress`) 세션은 저장하지 않고, 사용자가 **완료(completed)** 하거나 **포기(abandoned)** 한 시점에만 1행이 기록된다. 정원(garden) 화면은 그중 `status='completed'`인 행들을 식물로 전시한다.

타임스탬프는 모두 `timestamptz`(UTC)로 저장하고, 표시 시 클라이언트에서 로컬 변환한다.

## `focus_sessions` 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, `default gen_random_uuid()` | 세션 ID |
| `user_id` | `uuid` | `not null`, `references auth.users(id) on delete cascade` | 소유자 |
| `duration_minutes` | `int` | `not null`, `check (duration_minutes between 1 and 180)` | 집중 시간(분) |
| `status` | `text` | `not null`, `check (status in ('completed','abandoned'))` | 영속 상태 |
| `plant_type` | `text` | `not null`, `check (plant_type in ('tulip','sunflower','cactus'))` | 배정된 식물 |
| `started_at` | `timestamptz` | `not null` | 시작 절대 시각 |
| `completed_at` | `timestamptz` | nullable | 완료/포기 확정 시각 |
| `created_at` | `timestamptz` | `not null`, `default now()` | 레코드 생성 시각 |

### DDL 초안 (Task 007에서 적용)

```sql
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_minutes int not null check (duration_minutes between 1 and 180),
  status text not null check (status in ('completed', 'abandoned')),
  plant_type text not null check (plant_type in ('tulip', 'sunflower', 'cactus')),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 본인 데이터 조회 및 날짜별 정렬 최적화
create index focus_sessions_user_created_idx
  on public.focus_sessions (user_id, created_at desc);
```

> **enum vs text + CHECK**: Postgres `enum`은 값 추가/변경이 번거롭다. 식물·상태 집합이 작고 안정적이므로 `text + CHECK`로 두어 마이그레이션 유연성을 확보한다. `lib/constants.ts`의 `as const` 집합과 CHECK 목록을 동기화 상태로 유지한다.

## RLS 정책

모든 행은 **소유자 본인만** 접근한다. 조회/수정/삭제 대상 행 필터링은 `USING`, 삽입/수정될 행의 적법성 검증은 `WITH CHECK`로 분리한다.

```sql
alter table public.focus_sessions enable row level security;

-- SELECT: 본인 세션만 조회
create policy "focus_sessions_select_own"
  on public.focus_sessions for select
  using (auth.uid() = user_id);

-- INSERT: 타 사용자 명의 삽입 차단
create policy "focus_sessions_insert_own"
  on public.focus_sessions for insert
  with check (auth.uid() = user_id);

-- UPDATE: 본인 행만, 본인 명의 유지 조건
create policy "focus_sessions_update_own"
  on public.focus_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: 본인 행만 삭제
create policy "focus_sessions_delete_own"
  on public.focus_sessions for delete
  using (auth.uid() = user_id);
```

| Operation | USING | WITH CHECK | 목적 |
|-----------|-------|------------|------|
| SELECT | `auth.uid() = user_id` | — | 본인 데이터만 조회 |
| INSERT | — | `auth.uid() = user_id` | 타인 명의 삽입 차단 |
| UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` | 본인 행만, 소유자 변조 방지 |
| DELETE | `auth.uid() = user_id` | — | 본인 행만 삭제 |

## 정원(garden) 데이터 전략

정원에 전시되는 식물(`GardenPlant`)은 `status='completed'`인 `focus_sessions`의 투영이다. 구현 방식은 Task 007에서 아래 두 안 중 결정한다.

### A안 — View (권장 후보)

```sql
create view public.garden_plants as
  select id, user_id, plant_type,
         completed_at as planted_at,
         duration_minutes
  from public.focus_sessions
  where status = 'completed';
```

- **장점**: 데이터 중복 없음, 완료 세션과 항상 일관, 별도 동기화 로직 불필요.
- **단점**: 정원 전용 메타데이터(예: 정원 내 배치 좌표) 확장 시 한계.
- **RLS 비고**: 뷰는 기반 테이블(`focus_sessions`)의 RLS를 따른다(`security_invoker`). 별도 정책 불필요.

### B안 — 별도 `garden_plants` 테이블

- **장점**: 정원 전용 컬럼(배치 위치, 별명 등) 자유 확장.
- **단점**: 세션 완료 시 동기화(트리거/애플리케이션 로직) 필요, 정합성 관리 비용.

> 현재 요구사항(식물 아이콘 + 날짜 + 집중 시간 전시)에는 **A안(View)** 으로 충분하다. 확장 요구가 생기면 B안으로 전환한다.

## `lib/` 타입과의 매핑

| DB 컬럼 (snake_case) | `lib/types.ts` 필드 (camelCase) |
|----------------------|----------------------------------|
| `focus_sessions.user_id` | `FocusSession.userId` |
| `focus_sessions.duration_minutes` | `FocusSession.durationMinutes` |
| `focus_sessions.plant_type` | `FocusSession.plantType` |
| `focus_sessions.started_at` | `FocusSession.startedAt` |
| `focus_sessions.completed_at` | `FocusSession.completedAt` |
| `garden_plants.planted_at` (= `completed_at`) | `GardenPlant.plantedAt` |

> snake_case ↔ camelCase 변환은 데이터 접근 계층(Task 011)에서 매핑 함수로 처리한다.
