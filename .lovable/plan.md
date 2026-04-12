

## Plan: Client-Side Leaked Password Check via HIBP API

### What it does
Before allowing signup or password reset, hash the password with SHA-1, send only the first 5 characters to the Have I Been Pwned Passwords API, and check if the full hash appears in the response. If it does, warn the user and block submission.

### Changes

**1. Create `src/lib/checkLeakedPassword.ts`**
- SHA-1 hash the password using the Web Crypto API
- Send first 5 hex chars to `https://api.pwnedpasswords.com/range/{prefix}`
- Check if the suffix appears in the returned list
- Return `true` if leaked, `false` if safe

**2. Update `src/pages/Auth.tsx`**
- Import and call `checkLeakedPassword` during signup, after existing validation but before `supabase.auth.signUp`
- If leaked, show a toast: "This password has appeared in a data breach. Please choose a different one." and block submission

**3. Update `src/pages/ResetPassword.tsx`**
- Same check before `supabase.auth.updateUser({ password })`
- Block with a similar warning if leaked

### Technical notes
- The HIBP API is free, no key needed, and the k-anonymity model means the full password never leaves the browser
- Web Crypto API (`crypto.subtle.digest`) is available in all modern browsers
- No new dependencies required

