-- Tester feedback from the in-app "Feedback" button.
create table public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  email text check (email is null or length(email) <= 320),
  message text not null check (length(message) between 1 and 4000),
  page text check (page is null or length(page) <= 300),
  rating smallint check (rating between 1 and 5),
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);
create index feedback_created_idx on public.feedback (created_at desc);
create index feedback_user_idx on public.feedback (user_id);

alter table public.feedback enable row level security;

-- Anyone can send feedback, as themselves or anonymously; new rows always start unhandled.
create policy "feedback insert" on public.feedback for insert to anon, authenticated
  with check ((user_id is null or user_id = (select auth.uid())) and status = 'new');
create policy "feedback admin read" on public.feedback for select to authenticated using ((select public.is_admin()));
create policy "feedback admin update" on public.feedback for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "feedback admin delete" on public.feedback for delete to authenticated using ((select public.is_admin()));
