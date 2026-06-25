-- Task 007: 초기 데이터 모델 — focus_sessions 테이블 + 인덱스 + RLS + garden_plants View
-- 설계 출처: docs/DATA_MODEL.md
-- CHECK 목록은 lib/constants.ts의 as const 집합과 동기화 유지:
--   plant_type ∈ {tulip, sunflower, cactus} / status ∈ {completed, abandoned} / duration 1~180

-- ── 테이블 ────────────────────────────────────────────────
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

-- ── RLS: 소유자 본인만 접근 ────────────────────────────────
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

-- ── 정원 View (전략 A) ─────────────────────────────────────
-- status='completed' 세션의 투영. security_invoker=true로 기반 테이블 RLS를 따른다(별도 정책 불필요).
create view public.garden_plants
  with (security_invoker = true) as
  select
    id,
    user_id,
    plant_type,
    completed_at as planted_at,
    duration_minutes
  from public.focus_sessions
  where status = 'completed';
