# Going live

Roughly fifteen minutes of clicking, in this order. Nothing here needs me — it
all needs accounts that are yours.

## Before you start

Two things should be true before the site is publicly reachable, and neither is
technical:

1. **The interior photographs are the agency's, and watermarked.** Publishing
   them on a public site is someone else's copyright. Replace them with your own
   first — same filenames in `photos/apartment/`, then `npm run images`.
2. **You do not own the flat yet.** A live booking form takes real money for
   nights you cannot yet guarantee. Until the sale completes, deploy with
   payment disabled (see *Soft launch* below) or keep it behind a password.

Everything else is switches.

---

## 1 · Database

SQLite will not survive on Vercel — the filesystem is wiped between
invocations. Use Postgres. [Neon](https://neon.tech) has a free tier and takes
two minutes.

```bash
npm run db:postgres      # flips the provider in prisma/schema.prisma
```

Copy the connection string Neon gives you. You will paste it as `DATABASE_URL`.

## 2 · Push to a repository

```bash
git init
git add -A
git commit -m "Casa Piazzola"
gh repo create casa-piazzola --private --source=. --push
```

The `.gitignore` already excludes `.env`, `node_modules` and the SQLite file.
Check `git status` before pushing anyway — that is a five-second habit worth
having.

## 3 · Vercel

Import the repository at [vercel.com/new](https://vercel.com/new). It detects
Next.js on its own; do not change the build settings. Before the first deploy,
add the environment variables from `.env.example` — all of them, including:

```
DATABASE_URL          the Neon string from step 1
NEXT_PUBLIC_SITE_URL  https://your-domain.com     ← no trailing slash
```

`NEXT_PUBLIC_SITE_URL` is the one people get wrong. Stripe redirects and the
links in confirmation emails are built from it; if it is still `localhost`,
guests get sent nowhere after paying.

Then, once:

```bash
npx prisma db push       # against the production DATABASE_URL
```

## 4 · Stripe

In the Stripe dashboard:

- **Developers → API keys** → copy the secret key into `STRIPE_SECRET_KEY`.
- **Developers → Webhooks → Add endpoint**
  - URL: `https://your-domain.com/api/stripe/webhook`
  - Events: `checkout.session.completed`, `checkout.session.expired`,
    `charge.refunded`
  - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Without that webhook secret the site will take a payment and never confirm the
booking. Test the whole flow in test mode with `4242 4242 4242 4242` before you
switch the keys to live.

## 5 · Email

Verify your sending domain in [Resend](https://resend.com), then set
`RESEND_API_KEY`, `EMAIL_FROM` (an address on the verified domain) and
`HOST_EMAIL` (where booking alerts and guest messages land).

Send yourself a test booking and read the email on a phone before trusting it.

## 6 · Domain

Add it in Vercel → Settings → Domains, point the DNS as instructed, then update
`NEXT_PUBLIC_SITE_URL` and redeploy. Update the Stripe webhook URL too.

## 7 · Before you announce it

- [ ] Your own photographs are in, watermark-free
- [ ] Real nightly rates in `src/lib/pricing.ts`
- [ ] Tourist tax confirmed with the Comune di Lovere
- [ ] CIN added to the terms page
- [ ] Legal pages reviewed by someone qualified
- [ ] Seeded demo rows deleted (`LOV-SEED01` and the blocked ranges)
- [ ] `ADMIN_PASSWORD` changed from anything you have typed in a chat window
- [ ] A test booking made, paid, refunded, and the emails checked

---

## Soft launch

To put the site up before you can take bookings, deploy without
`STRIPE_SECRET_KEY`. The checkout endpoint returns an error and logs it; nothing
else on the site changes. Better still, point the booking CTA at the contact
form for now — one line in `src/lib/dictionaries/*.ts` changes the label, and
`href(locale, 'book')` → `href(locale, 'contact')` in `Hero.tsx`,
`BookingInvite.tsx` and `Header.tsx` changes where it goes.

Vercel also offers password protection on a whole deployment
(Settings → Deployment Protection), which is the simplest way to show the site
to a few people without putting it in front of Google.
