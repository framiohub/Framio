-- Customer Management Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Ensure profiles table has all required columns
alter table public.profiles
  add column if not exists avatar_url     text,
  add column if not exists provider       text default 'email',
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists is_active      boolean default true,
  add column if not exists addresses      jsonb default '[]'::jsonb;

-- 2. Service-role policy for admins to read/update all profiles
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Service role can manage profiles'
  ) then
    create policy "Service role can manage profiles"
      on public.profiles for all
      using (true)
      with check (true);
  end if;
end $$;

-- 3. Update the new-user trigger to work with profiles (not public.users)
--    Handles both email signup and Google OAuth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, full_name, avatar_url, provider, created_at, is_active
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.app_metadata->>'provider', 'email'),
    now(),
    true
  )
  on conflict (id) do update set
    email        = coalesce(excluded.email,     public.profiles.email),
    full_name    = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url   = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    provider     = coalesce(excluded.provider,   public.profiles.provider);
  return new;
end;
$$ language plpgsql security definer;

-- Re-attach trigger (drop + recreate is idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Add Supabase redirect URL note (manual step):
--    Go to Supabase Dashboard → Authentication → URL Configuration
--    Add your Vercel production URL to "Redirect URLs", e.g.:
--      https://your-project.vercel.app/auth/callback
--    This fixes the Google OAuth redirect going to localhost.
