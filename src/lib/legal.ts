import { property } from './property';
import type { Locale } from './i18n';

/**
 * WORKING DRAFTS.
 *
 * These are structured starting points covering the obligations a direct-booking
 * short-let site in Italy actually has — GDPR, the cookie rules, and the
 * contractual terms of the stay. They are NOT legal advice and they are not
 * finished. Before launch, have them reviewed against:
 *
 *   · GDPR / Codice Privacy (d.lgs. 196/2003 as amended)
 *   · the Provvedimento del Garante on cookies (10 June 2021)
 *   · Lombardy's locazioni turistiche rules and the CIN/CIR registration regime
 *   · the Comune di Lovere's imposta di soggiorno regulation
 *   · Questura guest-reporting obligations (Alloggiati Web, within 24 hours)
 *
 * Fill in the bracketed fields, delete anything that does not apply, and add
 * your own CIN once you have it.
 */

export type LegalSection = { heading: string; body: string[] };

export function privacyPolicy(locale: Locale): LegalSection[] {
  if (locale === 'it') {
    return [
      {
        heading: 'Titolare del trattamento',
        body: [
          `${property.name}, ${property.address.street}, ${property.address.postalCode} ${property.address.town} (${property.address.province}), Italia.`,
          `Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere a ${property.host.email}.`,
        ],
      },
      {
        heading: 'Quali dati raccogliamo',
        body: [
          'Quando prenoti: nome, cognome, indirizzo email, numero di telefono (facoltativo), paese di residenza, date del soggiorno, numero di ospiti ed eventuali note che ci lasci.',
          'Quando ci scrivi: nome, email, telefono (facoltativo) e il contenuto del messaggio.',
          'Non riceviamo né conserviamo i dati della tua carta di pagamento. Il pagamento è gestito interamente da Stripe sulla propria piattaforma.',
        ],
      },
      {
        heading: 'Perché li trattiamo',
        body: [
          'Per eseguire il contratto di locazione turistica: gestire la prenotazione, incassare il corrispettivo, comunicarti le informazioni di arrivo (art. 6.1.b GDPR).',
          'Per adempiere a obblighi di legge: comunicazione dei dati degli ospiti alla Questura tramite Alloggiati Web entro 24 ore dall’arrivo, versamento e rendicontazione dell’imposta di soggiorno, obblighi fiscali e contabili (art. 6.1.c GDPR).',
          'Per rispondere alle tue richieste quando ci contatti (art. 6.1.b / 6.1.f GDPR).',
        ],
      },
      {
        heading: 'A chi comunichiamo i dati',
        body: [
          'Stripe Payments Europe Ltd., per l’elaborazione dei pagamenti.',
          'Il fornitore di posta transazionale che utilizziamo per inviarti conferme e risposte.',
          'Il fornitore di hosting su cui gira questo sito.',
          'Le autorità di pubblica sicurezza e l’amministrazione comunale, nei casi previsti dalla legge.',
          'Non vendiamo i tuoi dati e non li usiamo per profilazione pubblicitaria.',
        ],
      },
      {
        heading: 'Per quanto tempo li conserviamo',
        body: [
          'I dati di prenotazione e i documenti contabili per 10 anni, come richiesto dalla normativa fiscale italiana.',
          'I messaggi che non danno luogo a una prenotazione per 24 mesi.',
          '[Verifica questi termini con il tuo commercialista prima della pubblicazione.]',
        ],
      },
      {
        heading: 'I tuoi diritti',
        body: [
          'Hai diritto di accedere ai tuoi dati, correggerli, chiederne la cancellazione o la limitazione, opporti al trattamento e richiedere la portabilità, nei limiti previsti dagli articoli 15–22 del GDPR.',
          `Per esercitarli scrivi a ${property.host.email}. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).`,
        ],
      },
    ];
  }

  return [
    {
      heading: 'Who is responsible for your data',
      body: [
        `${property.name}, ${property.address.street}, ${property.address.postalCode} ${property.address.town} (${property.address.province}), Italy.`,
        `Write to ${property.host.email} about anything on this page.`,
      ],
    },
    {
      heading: 'What we collect',
      body: [
        'When you book: your name, email address, phone number (optional), country, the dates of your stay, the number of guests, and anything you tell us in the notes field.',
        'When you write to us: your name, email, phone (optional) and the message itself.',
        'We never receive or store your card details. Payment is handled end to end by Stripe on their own platform.',
      ],
    },
    {
      heading: 'Why we process it',
      body: [
        'To perform the rental contract: managing your booking, taking payment, and sending you arrival information (GDPR Art. 6(1)(b)).',
        'To meet legal obligations: reporting guest details to the Italian State Police through Alloggiati Web within 24 hours of arrival, collecting and remitting the local tourist tax, and keeping tax records (GDPR Art. 6(1)(c)).',
        'To answer you when you get in touch (GDPR Art. 6(1)(b)/(f)).',
      ],
    },
    {
      heading: 'Who else sees it',
      body: [
        'Stripe Payments Europe Ltd., to process payments.',
        'The transactional email provider we use to send confirmations and replies.',
        'The hosting provider this site runs on.',
        'Public security authorities and the local council, where the law requires it.',
        'We do not sell your data and we do not use it for advertising profiles.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'Booking records and accounting documents for 10 years, as Italian tax law requires.',
        'Enquiries that do not become bookings for 24 months.',
        '[Confirm these periods with your accountant before publishing.]',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can ask for a copy of your data, have it corrected, ask us to erase or restrict it, object to processing, and ask for it in a portable form — within the limits of GDPR Articles 15–22.',
        `Write to ${property.host.email}. You can also complain to the Italian data protection authority, the Garante per la protezione dei dati personali (www.garanteprivacy.it).`,
      ],
    },
  ];
}

export function cookiePolicy(locale: Locale): LegalSection[] {
  if (locale === 'it') {
    return [
      {
        heading: 'In breve',
        body: [
          'Questo sito non usa cookie di profilazione, né strumenti pubblicitari o di tracciamento di terze parti. Per questo non trovi un banner di consenso: non c’è nulla su cui consentire.',
        ],
      },
      {
        heading: 'Cookie tecnici che usiamo',
        body: [
          'cp_locale — ricorda la lingua che hai scelto. Durata: 12 mesi.',
          'cp_admin — presente solo per il proprietario, dopo l’accesso all’area riservata. Durata: 12 ore.',
          'Entrambi sono cookie tecnici ai sensi dell’art. 122 del Codice Privacy e non richiedono consenso preventivo.',
        ],
      },
      {
        heading: 'Durante il pagamento',
        body: [
          'Il pagamento avviene sul dominio di Stripe. Stripe imposta cookie propri, necessari alla sicurezza della transazione e alla prevenzione delle frodi, secondo la propria informativa.',
        ],
      },
      {
        heading: 'Come disattivarli',
        body: [
          'Puoi cancellare o bloccare i cookie dalle impostazioni del tuo browser. Bloccando cp_locale il sito continuerà a funzionare, ma tornerà alla lingua predefinita a ogni visita.',
        ],
      },
    ];
  }

  return [
    {
      heading: 'The short version',
      body: [
        'This site sets no advertising, profiling or third-party tracking cookies. That is why there is no consent banner: there is nothing to consent to.',
      ],
    },
    {
      heading: 'The cookies we do set',
      body: [
        'cp_locale — remembers the language you chose. Lasts 12 months.',
        'cp_admin — only ever present for the owner, after signing in to the host area. Lasts 12 hours.',
        'Both are strictly necessary technical cookies and do not require prior consent.',
      ],
    },
    {
      heading: 'During payment',
      body: [
        'Payment happens on Stripe’s own domain. Stripe sets its own cookies there for transaction security and fraud prevention, under its own policy.',
      ],
    },
    {
      heading: 'Turning them off',
      body: [
        'You can clear or block cookies in your browser settings. Blocking cp_locale will not break the site; it will just open in the default language each time.',
      ],
    },
  ];
}

export function terms(locale: Locale): LegalSection[] {
  const h = property.hostConfigurable;

  if (locale === 'it') {
    return [
      {
        heading: 'Oggetto',
        body: [
          `Queste condizioni regolano la locazione turistica di ${property.name}, ${property.address.street}, ${property.address.postalCode} ${property.address.town} (${property.address.province}).`,
          '[Inserisci qui il Codice Identificativo Nazionale (CIN) e il codice regionale una volta ottenuti — l’esposizione è obbligatoria negli annunci.]',
        ],
      },
      {
        heading: 'Prenotazione e pagamento',
        body: [
          'La prenotazione si perfeziona con il pagamento integrale dell’importo indicato al momento della conferma. Il pagamento è gestito da Stripe.',
          `Soggiorno minimo ${h.minNights} notti. Capienza massima ${h.maxGuests} ospiti; non è consentito ospitare persone ulteriori.`,
          'L’imposta di soggiorno è riscossa per conto del Comune di Lovere secondo le tariffe vigenti.',
        ],
      },
      {
        heading: 'Arrivo e partenza',
        body: [
          `Check-in dalle ${h.checkInFrom}. Check-out entro le ${h.checkOutBy}.`,
          `${h.accessNote}`,
          'Per obbligo di legge dovrai fornire un documento d’identità valido per ciascun ospite al momento dell’arrivo.',
        ],
      },
      {
        heading: 'Cancellazione',
        body: [
          '[Definisci qui la tua politica di cancellazione, ad esempio: rimborso integrale fino a 14 giorni prima dell’arrivo; 50% fino a 7 giorni; nessun rimborso oltre tale termine.]',
          'Le cancellazioni si richiedono per iscritto all’indirizzo email del proprietario. I rimborsi sono elaborati tramite Stripe sullo stesso metodo di pagamento.',
        ],
      },
      {
        heading: 'Regole della casa',
        body: [
          'Non è consentito fumare all’interno dell’appartamento.',
          'Ti chiediamo di rispettare la quiete dei vicini, in particolare fra le 22:00 e le 08:00.',
          '[Aggiungi qui le tue regole su animali, feste, raccolta differenziata e altro.]',
        ],
      },
      {
        heading: 'Responsabilità',
        body: [
          'L’ospite risponde dei danni causati all’immobile e agli arredi durante il soggiorno.',
          'Il proprietario non risponde di beni personali lasciati incustoditi.',
        ],
      },
      {
        heading: 'Legge applicabile',
        body: ['Il contratto è regolato dalla legge italiana. Foro competente: Bergamo.'],
      },
    ];
  }

  return [
    {
      heading: 'What these terms cover',
      body: [
        `These conditions govern the short-term holiday rental of ${property.name}, ${property.address.street}, ${property.address.postalCode} ${property.address.town} (${property.address.province}), Italy.`,
        '[Add your Italian national identification code (CIN) and regional code here once issued — displaying it in listings is a legal requirement.]',
      ],
    },
    {
      heading: 'Booking and payment',
      body: [
        'A booking is made when the full amount shown at confirmation has been paid. Payment is handled by Stripe.',
        `Minimum stay ${h.minNights} nights. Maximum occupancy ${h.maxGuests} guests; additional people may not stay in the apartment.`,
        'The tourist tax is collected on behalf of the Comune di Lovere at the rate in force.',
      ],
    },
    {
      heading: 'Arrival and departure',
      body: [
        `Check-in from ${h.checkInFrom}. Check-out by ${h.checkOutBy}.`,
        `${h.accessNote}`,
        'Italian law requires us to see valid identification for every guest on arrival.',
      ],
    },
    {
      heading: 'Cancellation',
      body: [
        '[Set your cancellation policy here — for example: full refund up to 14 days before arrival; 50% up to 7 days; no refund after that.]',
        'Cancellations should be requested in writing by email. Refunds are processed through Stripe back to the original payment method.',
      ],
    },
    {
      heading: 'House rules',
      body: [
        'No smoking inside the apartment.',
        'Please respect the neighbours, particularly between 22:00 and 08:00.',
        '[Add your rules on pets, parties, recycling and anything else here.]',
      ],
    },
    {
      heading: 'Liability',
      body: [
        'Guests are responsible for damage caused to the apartment or its contents during the stay.',
        'The host is not responsible for personal belongings left unattended.',
      ],
    },
    {
      heading: 'Governing law',
      body: ['Italian law applies. The competent court is Bergamo.'],
    },
  ];
}
