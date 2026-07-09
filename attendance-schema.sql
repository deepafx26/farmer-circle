-- Optional setup untuk fitur Absensi Pembelajaran
-- Jalankan di Supabase SQL Editor jika ingin data absensi tersimpan ke database dan bisa diekspor ke Excel.

create table if not exists public.learning_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  topic text not null,
  session_time timestamptz not null,
  note text,
  proof_url text,
  proof_path text,
  created_at timestamptz not null default now()
);

alter table public.learning_attendance enable row level security;

create policy "member can insert own attendance"
  on public.learning_attendance
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "member can read own attendance"
  on public.learning_attendance
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "mentor admin can read all attendance"
  on public.learning_attendance
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'mentor')
    )
  );

insert into storage.buckets (id, name, public)
values ('attendance-proofs', 'attendance-proofs', true)
on conflict (id) do nothing;

create policy "member can upload own attendance proof"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'attendance-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attendance proof is publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'attendance-proofs');
