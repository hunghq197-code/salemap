# Google / Gmail Login Setup

Status: source code support is implemented. Dashboard configuration is still required in Supabase and Google Cloud before the button can work on production.

## Source Flow

- Login and open registration use `supabase.auth.signInWithOAuth({ provider: "google" })`.
- OAuth returns to `/auth/callback?provider=google`.
- The callback exchanges the PKCE code for a Supabase session.
- The callback creates `user_profiles` from Google metadata when the profile does not exist.
- If `NEXT_PUBLIC_BETA_INVITE_ONLY=true`, Google OAuth cannot create a brand-new beta user without an existing profile. The user is signed out and returned to login/register with an invite-required message.

## Supabase Dashboard

1. Open Supabase project.
2. Go to Authentication > Providers > Google.
3. Enable Google provider.
4. Copy the Google callback URL shown by Supabase. It usually has this shape:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

5. Paste the Google OAuth Client ID and Client Secret from Google Cloud.
6. Go to Authentication > URL Configuration.
7. Set Site URL:

```text
https://salemap.io.vn
```

8. Add Redirect URLs:

```text
https://salemap.io.vn/auth/callback
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

Add the actual local port if you test with a different dev server port.

## Google Cloud

1. Open Google Cloud Console > Google Auth Platform / APIs & Services.
2. Configure OAuth consent screen for the SaleMap app.
3. Create OAuth Client ID with application type `Web application`.
4. Add Authorized JavaScript origins:

```text
https://salemap.io.vn
http://localhost:3000
http://127.0.0.1:3000
```

5. Add Authorized redirect URI copied from Supabase:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

6. Save the Client ID and Client Secret into Supabase's Google provider page. Do not commit them into source code.

## Verification

1. Deploy the latest source.
2. Open `https://salemap.io.vn/login`.
3. Click `Tiếp tục với Google`.
4. Choose a Google account.
5. Existing users should reach `/app/dashboard` or `/onboarding`.
6. In invite-only mode, a Google account without an existing SaleMap profile should be rejected with an invite-required message.

Official references:

- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Google OAuth web server apps: https://developers.google.com/identity/protocols/oauth2/web-server
