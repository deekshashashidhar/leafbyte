# Connecting the signup form

The Join form (`join.html`, `assets/js/join.js`) is finished. Until it is connected, it tells visitors that sign-ups open soon and saves nothing. Connecting it takes about 15 minutes and needs your own Supabase account.

## 1. Store entries (required)

1. Create a free project at [supabase.com](https://supabase.com). Pick a region close to your users.
2. Open **SQL Editor > New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `members` table and a security rule that lets the website add rows but never read them.
3. Open **Project Settings > API** and copy two values:
   - the **Project URL**
   - the **anon / publishable key**
4. Paste them into `assets/js/config.js`:

   ```js
   window.LEAFBYTE_CONFIG = {
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     supabaseAnonKey: "YOUR-ANON-KEY",
   };
   ```

5. Commit and push. Vercel redeploys automatically.

**Is it safe to commit the anon key?** Yes. It is designed to be public, and the row-level security rule in `schema.sql` only allows inserts. **Never** commit the `service_role` key or any other secret.

**Test it:** submit the form with your own email, then check **Table Editor > members** in Supabase. Use **Export to CSV** to give the team the list.

## 2. Send a confirmation email (next step)

The plan asks for a confirmation email with double opt-in. Supabase does not email on table inserts by itself, so pick one of these:

- **Supabase Edge Function plus an email service** (for example Resend or Postmark): a database webhook on `members` inserts calls a function that sends a "Confirm your email" link. The link calls a second function that sets `confirmed = true`. Keep the email service's API key in Supabase secrets, never in this repository.
- **A form service with built-in confirmation** (for example Formspree or Netlify Forms) instead of Supabase, if you prefer no backend code.

Until confirmation is built, treat every entry as unconfirmed and only send one welcome email by hand.

## 3. Spam protection already in place

- A hidden honeypot field. Bots that fill it are sent to the thank-you page, and nothing is stored.
- A one-minute wait between submissions from the same browser.
- Database checks on every field (length, allowed values, consent required) and one signup per email.

If spam gets through, add Cloudflare Turnstile to the form and verify it in an Edge Function before inserting.
