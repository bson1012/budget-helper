-- budget-helper 테이블 및 보안 규칙
-- Supabase 대시보드 > SQL Editor에 붙여 넣고 Run 하세요.

-- 1. 계정(예산 계정) 테이블
create table if not exists public.accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  code         text,
  dept_code    text,
  job_code     text,
  budget_includes_vat boolean not null default false,
  budget_limit bigint not null default 0,
  created_at   timestamptz not null default now()
);

-- 이미 accounts 테이블을 만든 적이 있다면 아래 문장만 따로 실행하세요.
-- alter table public.accounts add column if not exists dept_code text, add column if not exists job_code text, add column if not exists budget_includes_vat boolean not null default false;

-- 2. 지출 내역 테이블
create table if not exists public.expenses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id        uuid references public.accounts(id) on delete set null,
  card_name         text,
  approve_date      date,
  approve_no        text,
  vat_type          text,
  total_amount      bigint not null default 0,
  supply_value      bigint not null default 0,
  vat_amount        bigint not null default 0,
  deduct_amount     bigint not null default 0,
  merchant_name     text,
  merchant_biz_no   text,
  memo              text,
  budget_reflected  boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists accounts_user_idx on public.accounts(user_id);
create index if not exists expenses_user_idx on public.expenses(user_id);
create index if not exists expenses_account_idx on public.expenses(account_id);

-- 3. 행 단위 보안(RLS): 로그인한 본인 데이터만 읽고 쓰기 가능
alter table public.accounts enable row level security;
alter table public.expenses enable row level security;

-- 비로그인(anon) 사용자는 아무 것도 못 하도록 권한 회수
revoke all on public.accounts from anon;
revoke all on public.expenses from anon;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

drop policy if exists "accounts_own_rows" on public.accounts;
create policy "accounts_own_rows" on public.accounts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "expenses_own_rows" on public.expenses;
create policy "expenses_own_rows" on public.expenses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
