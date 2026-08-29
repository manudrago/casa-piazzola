import { Resend } from 'resend';
import { property } from './property';
import { getDictionary, fill, href } from './i18n';
import { formatMoney } from './pricing';
import { formatLongDate, toUTCDate } from './dates';
import { SITE_URL } from './constants';

/**
 * Transactional email via Resend.
 *
 * Every send is best-effort: if the mail provider is down or unconfigured we
 * log and carry on. A booking must never fail because an email did — the
 * guest has already paid, and the confirmation page shows the same detail.
 */

let cached: Resend | null = null;
function client(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

const FROM = process.env.EMAIL_FROM ?? 'Casa Piazzola <hello@casapiazzola.com>';
const HOST_EMAIL = process.env.HOST_EMAIL ?? property.host.email;

type SendArgs = { to: string | string[]; subject: string; html: string; replyTo?: string };

async function send({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const resend = client();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error('[email] send failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send threw', err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Templates — inline styles only, which is the one thing email clients
/* agree on. Same palette and type hierarchy as the site.               */
/* ------------------------------------------------------------------ */

const IVORY = '#FBF9F5';
const CHARCOAL = '#1E1C19';
const INK = '#3A3630';
const MUTED = '#6E675C';
const STONE = '#E4DDD1';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

function shell(inner: string, preheader: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Casa Piazzola</title></head>
<body style="margin:0;padding:0;background:${IVORY};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${STONE};">
<tr><td style="padding:38px 40px 0 40px;">
  <div style="font:400 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:${MUTED};">Casa Piazzola</div>
  <div style="font:400 11px/1.6 Helvetica,Arial,sans-serif;letter-spacing:.08em;color:${MUTED};margin-top:6px;">Lovere · Lago d'Iseo</div>
</td></tr>
${inner}
<tr><td style="padding:28px 40px 36px 40px;border-top:1px solid ${STONE};">
  <div style="font:400 11px/1.7 Helvetica,Arial,sans-serif;color:${MUTED};">
    ${esc(property.name)} · ${esc(property.address.street)} · ${property.address.postalCode} ${esc(property.address.town)} (${property.address.province}) · Italy
  </div>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function h1(text: string): string {
  return `<tr><td style="padding:26px 40px 0 40px;">
    <h1 style="margin:0;font:300 30px/1.15 Georgia,'Times New Roman',serif;color:${CHARCOAL};letter-spacing:-.01em;">${esc(text)}</h1>
  </td></tr>`;
}

function para(text: string): string {
  return `<tr><td style="padding:18px 40px 0 40px;">
    <p style="margin:0;font:300 15px/1.7 Helvetica,Arial,sans-serif;color:${INK};">${esc(text)}</p>
  </td></tr>`;
}

function rows(items: { label: string; value: string }[]): string {
  const body = items
    .map(
      (i) => `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${STONE};font:400 10px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${MUTED};width:44%;vertical-align:top;">${esc(i.label)}</td>
      <td style="padding:11px 0;border-bottom:1px solid ${STONE};font:300 15px/1.5 Helvetica,Arial,sans-serif;color:${CHARCOAL};text-align:right;">${esc(i.value)}</td>
    </tr>`,
    )
    .join('');
  return `<tr><td style="padding:28px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
  </td></tr>`;
}

function button(label: string, url: string): string {
  return `<tr><td style="padding:30px 40px 0 40px;">
    <a href="${esc(url)}" style="display:inline-block;background:${CHARCOAL};color:${IVORY};text-decoration:none;padding:15px 30px;font:400 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;">${esc(label)}</a>
  </td></tr>`;
}

function note(title: string, body: string): string {
  return `<tr><td style="padding:30px 40px 0 40px;">
    <div style="background:${IVORY};border:1px solid ${STONE};padding:22px 24px;">
      <div style="font:400 10px/1 Helvetica,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:${MUTED};">${esc(title)}</div>
      <p style="margin:12px 0 0 0;font:300 14px/1.7 Helvetica,Arial,sans-serif;color:${INK};">${esc(body)}</p>
    </div>
  </td></tr>`;
}

function spacer(px = 8): string {
  return `<tr><td style="height:${px}px;"></td></tr>`;
}

/* ------------------------------------------------------------------ */
/* Public senders                                                       */
/* ------------------------------------------------------------------ */

export type BookingEmailData = {
  reference: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  locale: string;
};

export async function sendBookingConfirmation(b: BookingEmailData): Promise<boolean> {
  const d = getDictionary(b.locale);
  const h = property.hostConfigurable;
  const url = `${SITE_URL}${href(b.locale, `booking/${b.reference}`)}`;

  const inner = [
    h1(d.email.confirmationHeading),
    para(d.email.confirmationIntro),
    rows([
      { label: d.confirmation.reference, value: b.reference },
      { label: d.confirmation.guest, value: b.guestName },
      { label: d.confirmation.checkIn, value: `${formatLongDate(toUTCDate(b.checkIn), b.locale)} · ${h.checkInFrom}` },
      { label: d.confirmation.checkOut, value: `${formatLongDate(toUTCDate(b.checkOut), b.locale)} · ${h.checkOutBy}` },
      { label: d.confirmation.guests, value: String(b.guests) },
      { label: d.confirmation.nights, value: String(b.nights) },
      { label: d.confirmation.totalPaid, value: formatMoney(b.total, b.locale) },
    ]),
    note(d.confirmation.address, d.confirmation.addressBody),
    note(d.email.hostNoteHeading, d.email.hostNote),
    button(d.email.viewBooking, url),
    spacer(34),
  ].join('');

  return send({
    to: b.guestEmail,
    subject: fill(d.email.confirmationSubject, { ref: b.reference }),
    html: shell(inner, d.email.confirmationIntro),
    replyTo: HOST_EMAIL,
  });
}

export async function sendHostBookingAlert(b: BookingEmailData): Promise<boolean> {
  const d = getDictionary('en');
  const inner = [
    h1(`New booking — ${b.reference}`),
    rows([
      { label: 'Guest', value: b.guestName },
      { label: 'Email', value: b.guestEmail },
      { label: 'Check-in', value: formatLongDate(toUTCDate(b.checkIn)) },
      { label: 'Check-out', value: formatLongDate(toUTCDate(b.checkOut)) },
      { label: 'Nights', value: String(b.nights) },
      { label: 'Guests', value: String(b.guests) },
      { label: 'Total paid', value: formatMoney(b.total) },
    ]),
    button('Open the dashboard', `${SITE_URL}/admin`),
    spacer(34),
  ].join('');

  return send({
    to: HOST_EMAIL,
    subject: fill(d.email.hostAlertSubject, { kind: `booking · ${b.reference}` }),
    html: shell(inner, `${b.guestName}, ${b.nights} nights`),
    replyTo: b.guestEmail,
  });
}

export type MessageEmailData = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  body: string;
  reference?: string | null;
  locale: string;
};

export async function sendGuestMessageReceipt(m: MessageEmailData): Promise<boolean> {
  const d = getDictionary(m.locale);
  const inner = [
    h1(d.email.guestMessageHeading),
    para(d.email.guestMessageIntro),
    note(d.contact.message, m.body),
    spacer(34),
  ].join('');
  return send({
    to: m.email,
    subject: d.email.guestMessageSubject,
    html: shell(inner, d.email.guestMessageIntro),
    replyTo: HOST_EMAIL,
  });
}

export async function sendHostMessageAlert(m: MessageEmailData): Promise<boolean> {
  const d = getDictionary('en');
  const inner = [
    h1('New message'),
    rows(
      [
        { label: 'From', value: m.name },
        { label: 'Email', value: m.email },
        ...(m.phone ? [{ label: 'Phone', value: m.phone }] : []),
        ...(m.subject ? [{ label: 'Subject', value: m.subject }] : []),
        ...(m.reference ? [{ label: 'Booking', value: m.reference }] : []),
      ],
    ),
    note('Message', m.body),
    button('Reply in the dashboard', `${SITE_URL}/admin?tab=messages`),
    spacer(34),
  ].join('');
  return send({
    to: HOST_EMAIL,
    subject: fill(d.email.hostAlertSubject, { kind: `message from ${m.name}` }),
    html: shell(inner, m.body.slice(0, 120)),
    replyTo: m.email,
  });
}

/** Host → guest reply, sent from the admin dashboard. */
export async function sendHostReply(
  to: string,
  body: string,
  locale = 'en',
): Promise<boolean> {
  const d = getDictionary(locale);
  const inner = [h1('Casa Piazzola'), para(body), spacer(34)].join('');
  return send({
    to,
    subject: d.email.hostReplySubject,
    html: shell(inner, body.slice(0, 120)),
    replyTo: HOST_EMAIL,
  });
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
