# Casa Piazzola — Lovere, Lake Iseo

A direct-booking site for a two-room holiday apartment in the historic centre of
Lovere, on the northern tip of Lake Iseo.

Next.js 15 (App Router) · TypeScript · Tailwind · Prisma · Stripe Checkout ·
Resend. English and Italian. No booking-platform commission.

---

## Running it

```bash
cp .env.example .env      # then fill it in — see below
npm install
npm run setup             # prisma generate + db push + seed
npm run photos:fetch      # pull the Commons photography (skips what you have)
npm run images            # process photography, build the manifest
npm run dev               # http://localhost:3000
```

`npm run setup` seeds a couple of blocked ranges and one confirmed booking so
the calendar and the dashboard have something in them. Delete the seeded rows
before you go live, or just start from a clean database.

The host dashboard is at **`/admin`**.

---

## Read this before you take money

Seven things in this repository are **placeholders that must be replaced**, and
one is a legal obligation. None of them will stop the site running, and all of
them will cause you a problem if they ship as they are.

**1 · Nightly rates** — `src/lib/pricing.ts`
Every figure in `rates` is invented. The Idealista listing is a *sale* listing
(€75,000) and says nothing about nightly prices. Seasons currently run €85 low
to €145 peak with a €10 weekend surcharge, €45 cleaning, 8% off at seven nights
and 20% at twenty-eight. Replace all of it with your own numbers.

**2 · Tourist tax** — `src/lib/pricing.ts`
`touristTaxPerPersonPerNight` is set to €1.50 with a five-night cap. That is a
guess. The imposta di soggiorno is set by the **Comune di Lovere** — confirm the
current rate, the exemptions (usually under-14s) and the taxable-night cap with
the comune before charging anyone.

**3 · Occupancy** — `src/lib/property.ts`
`maxGuests` is 2, derived from the listing's one double bedroom. Raise it only
if you actually add a bed. Everything under `confirmed` in that file comes
verbatim from the listing; everything under `hostConfigurable` is your
commercial decision. Keep that line clear — it is what stops the site claiming
things about the flat that are not true.

**4 · Apartment photography** — `photos/apartment/`
The current interiors are the estate agent's, and they carry a visible
`idealista` watermark. They are fine for building against and unusable on a
live site: the copyright is the agency's, and the watermark undoes the whole
design. Replace them with your own once you have the keys. Same filenames, then
`npm run images` — nothing else changes.

**4b · Two excursion frames** — `scripts/curation.json`
The "Further afield" section has one slot with no photograph and one with a
weak photograph. `beyond-thermal` (Terme di Boario) has nothing — Commons has
no usable image of the spa, and the entry currently renders as a text block,
which looks deliberate but is a gap. `beyond-ski` uses a hazy aerial of
Montecampione: honest, on-subject, and the poorest picture on the site. Both
are worth a photograph of your own or a licensed one. Add the file to
`photos/lovere/`, point the entry at it, run `npm run images`.

**5 · Exact location** — `src/lib/property.ts`
`lat`/`lng` point at the middle of the old town, not at your door. The map is
deliberately schematic and the confirmation email carries the real address.
Refine the coordinates when you want the "Open in Maps" link to be precise.

**6 · Legal pages** — `src/lib/legal.ts`
The privacy, cookie and terms pages are working drafts with `[bracketed]` gaps.
They cover the right ground — GDPR, the 2021 Garante cookie rules, Alloggiati
Web guest reporting, the tourist tax, cancellation — but they are not legal
advice. Have them reviewed. In particular you will need to display your **CIN**
(Codice Identificativo Nazionale) once issued; there is a marked slot for it.

---

## Environment

| Variable | What it does | Needed for |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical base URL, no trailing slash | Correct links after payment |
| `DATABASE_URL` | SQLite file locally, Postgres in production | Everything |
| `STRIPE_SECRET_KEY` | Server-side Stripe key | Taking payment |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures | **Confirming bookings** |
| `RESEND_API_KEY` | Transactional email | Confirmation emails |
| `EMAIL_FROM` | Verified sender | Confirmation emails |
| `HOST_EMAIL` | Where alerts land, and the Reply-To on guest mail | Messages |
| `ADMIN_PASSWORD` | The password at `/admin` | Dashboard |
| `ADMIN_SESSION_SECRET` | Signs the admin cookie (32+ random chars) | Dashboard |

Without `STRIPE_WEBHOOK_SECRET` the site will happily take a payment and then
never confirm the booking. It is the single most important variable here.

---

## How a booking actually works

```
guest picks dates      → POST /api/quote        server prices the stay
guest enters details   → POST /api/checkout     server RE-PRICES, writes a
                                                PENDING booking, creates a
                                                Stripe Checkout session
guest pays on Stripe   → checkout.session.completed
                       → POST /api/stripe/webhook
                                                booking → CONFIRMED
                                                confirmation email to guest
                                                alert email to host
```

Three things worth knowing:

**The client's price is never trusted.** `/api/quote` exists to display a
number. `/api/checkout` recalculates the whole stay server-side and builds the
Stripe session from *its own* figures. Editing anything in the browser changes
nothing about what is charged.

**The webhook confirms, not the redirect.** A guest who closes the tab straight
after paying still gets a confirmed booking and an email. The redirect back to
`/booking/{reference}` is a convenience, not the source of truth.

**Pending bookings hold dates for 30 minutes.** While someone is on the Stripe
page their nights are unavailable to everyone else. If they abandon it, the
nights are released — either by the hold expiring
(`PENDING_HOLD_MINUTES` in `src/lib/constants.ts`) or by Stripe's
`checkout.session.expired` webhook, which deletes the row outright.

Card details never touch this application, this server, or this database.
Payment happens on Stripe's own domain; we store a session id, a payment intent
id and a status.

### Testing it locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# paste the printed whsec_… into STRIPE_WEBHOOK_SECRET, restart
```

Then book with card `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Availability

One function decides what is bookable — `unavailableDates()` in
`src/lib/availability.ts`. A night is unavailable if it sits inside a confirmed
booking, inside a pending booking that is still holding, or in `BlockedDate`.
The calendar UI and the server-side validation both read it, so they cannot
disagree.

Dates are handled as **UTC calendar days** throughout, never as instants, so a
guest in Sydney and a host in Lovere always agree on which nights are taken.
Check-in is inclusive, check-out exclusive — a departure day is immediately
re-bookable as an arrival.

To close dates by hand (your own stay, maintenance, a booking taken on Airbnb),
use the Calendar tab in the dashboard.

---

## Photography

```
photos/apartment/*.jpg     your interiors
photos/lovere/*.jpg        destination photography
scripts/curation.json      which file fills which slot, plus alt text
        ↓  npm run images
public/images/**           resized, graded, optimised
src/lib/image-manifest.json
```

Two commands:

```bash
npm run photos:fetch   # pull any missing Commons photograph named in curation.json
npm run images         # resize, grade and rebuild the manifest
```

`photos:fetch` only downloads what is missing, so it is safe to re-run. Commons
rate-limits hard per IP: if it stops with 429s, wait a few minutes and run it
again — it picks up where it left off. Files you supply yourself are never
touched.

`scripts/curation.json` is the only file you edit. Each entry names a source
file, the slot it fills, and real alt text in both languages. A slot whose
source is missing is reported and renders as a designed placeholder rather than
a broken layout — which is what lets you launch section by section as
photographs arrive.

The pipeline applies one restrained grade to everything: a little desaturation,
highlights warmed towards ivory, shadows lifted off pure black. The destination
photographs come from twenty different photographers, several of whom process
heavily for HDR; without the grade they fight each other and they fight the
palette. Interiors get roughly half the strength.

### Credits and licences

All Lovere and Lake Iseo photography comes from Wikimedia Commons under CC BY,
CC BY-SA or public domain. Attribution is carried in
`photos/lovere/_commons-info.json`, flows into the manifest automatically, and
is published at `/credits`, which the footer links from every page. **Do not
remove that page** — the share-alike licences require the credit.

---

## Structure

```
src/
  app/[locale]/          every public page, both languages
  app/[locale]/admin/    host dashboard
  app/api/               availability, quote, checkout, webhook, messages, admin
  components/            page sections and UI
    BeyondLovere.tsx     the excursions: the Bögn, Valle Camonica, skiing
  lib/
    property.ts          ← the apartment, facts only
    pricing.ts           ← rates and fees
    availability.ts      ← what is bookable, and what a stay costs
    dictionaries/en.ts   ← every string on the site
    dictionaries/it.ts
    legal.ts             ← privacy / cookies / terms drafts
prisma/schema.prisma
scripts/curation.json    ← which photograph goes where
```

### Adding a language

Copy `src/lib/dictionaries/en.ts`, translate the values, add the code to
`locales` in `src/lib/i18n.ts`. The English dictionary is the type contract, so
a missing key fails the build rather than shipping a blank string. Routes,
`hreflang` alternates and the sitemap all follow automatically.

---

## Deploying

**`DEPLOY.md` is the click-by-click version.** In short: **Vercel** is the path
of least resistance: push, import, set the environment
variables, done. Then:

1. Switch `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`
   and point `DATABASE_URL` at Neon, Supabase or Vercel Postgres. SQLite will
   not survive on serverless — the filesystem is ephemeral.
2. Run `npx prisma db push` against the production database.
3. In Stripe, add a webhook endpoint at
   `https://yourdomain.com/api/stripe/webhook` subscribed to
   `checkout.session.completed`, `checkout.session.expired` and
   `charge.refunded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Verify your sending domain in Resend.
5. Set `NEXT_PUBLIC_SITE_URL` to the real domain — Stripe redirects and email
   links are built from it.

Anywhere that runs Node works equally well; only step 1 changes.

---

## SEO

Titles and descriptions are per-page and per-language in
`dictionaries/*.seo`, targeting the searches this property actually competes
for: *holiday apartment Lovere*, *apartment for rent Lovere Lake Iseo*, *where
to stay in Lovere*, *Lake Iseo apartment*.

Also in place: `hreflang` alternates on every page, `Apartment` +
`LodgingBusiness` JSON-LD (listing only amenities the property actually has —
an invented one in structured data is penalised harder than in prose), a
generated sitemap, a 1200×630 Open Graph card, and real alt text on every
photograph in both languages. Confirmation pages and the dashboard are
`noindex`.

---

## Things deliberately left out

**No cookie banner.** The site sets two cookies: the language you chose, and
the admin session. Both are strictly necessary and neither requires consent.
Adding analytics changes that — add the banner then, not before.

**No embedded map.** A Google Maps iframe would dominate the page, drag in
third-party cookies and break the palette. `LocationMap.tsx` draws a schematic
instead: the lake, the shoreline, the old town rising behind it. It shows how
close things are to each other, not exact metres, and links out to a real map.

**No guest accounts.** A booking reference is the only credential a guest
needs. For a one-apartment site, a login is ceremony without benefit.
