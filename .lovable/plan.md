

## Add Login Page with Supabase Auth

### Overview
Create a login/signup page with email & password authentication using Lovable Cloud (Supabase). Includes a profiles table for storing user display names and a protected route system.

### What will be built

1. **Database setup** (migrations):
   - `profiles` table (id, username, avatar_url, created_at) linked to `auth.users` with RLS policies
   - Trigger to auto-create a profile on signup

2. **Auth page** (`/auth`):
   - Clean, minimal card-centered layout matching the existing design
   - Toggle between Login and Sign Up forms
   - Email + password fields with validation
   - Error/success toast messages

3. **Auth protection**:
   - Auth context/hook to track session state via `onAuthStateChange`
   - Redirect unauthenticated users to `/auth`
   - Redirect authenticated users away from `/auth` to `/`

4. **Logout**:
   - Sign out button in the sidebar

### Technical details
- Enable Lovable Cloud for Supabase backend
- Use `supabase-js` client (already available via Lovable Cloud)
- Session managed with React context + `onAuthStateChange` listener set up before `getSession()`
- RLS: users can read/update only their own profile

