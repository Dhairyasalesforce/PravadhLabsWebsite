/* EMIE — Pravadh Labs website assistant.
 *
 * One drop-in script. Add before </body> on any page:
 *   <script src="assets/js/emie.js?v=1" defer></script>
 *
 * What it does
 *   - Pops a small Early Access Program (EAP) invite above a launcher in the bottom-right corner.
 *   - Answers basic questions about Pravadh Labs and its products from the knowledge base below
 *     (no AI model or API key in the browser; everything runs on the page).
 *   - When a visitor wants early access, or asks something EMIE can't answer, it collects
 *     name / email / company in the chat, asks a simple sum, and sends it through this site's own
 *     Netlify form ("emie"). Netlify emails it to the address set under Forms → Form notifications
 *     (partners@pravadhlabs.com). The email includes the pages they viewed this visit, what they
 *     asked, and the lead source from attribution.js.
 *   - Nothing is sent until the visitor types their details and confirms.
 *
 * Edit answers in KB below. Edit the popup text in TEASER.
 */
(function () {
  'use strict';
  if (window.__emieLoaded) return;
  window.__emieLoaded = true;

  // ---- Config -----------------------------------------------------------------
  var CONFIG = {
    // Messages go to this Netlify site's own form handler (form name "emie", declared in index.html).
    // Netlify emails each one to the address set in Netlify → Forms → Form notifications.
    netlifyForm: 'emie',
    inboxEmail: 'inquire@pravadhlabs.com', // shown to visitors as the fallback address
    eapUrl: 'eap.html',
    teaserDelayMs: 6000,        // popup appears after this long on the page…
    teaserScrollRatio: 0.35,    // …or once the visitor scrolls this far, whichever comes first
    snoozeDays: 3,              // after closing the popup, don't pop it again for this long
    hidePaths: [/partnersportal/i]
  };

  var path = location.pathname.toLowerCase();
  if (CONFIG.hidePaths.some(function (re) { return re.test(path); })) return;
  var ON_EAP = /eap(\.html)?\/?$/.test(path);

  // ---- Storage helpers (all optional; private windows may block them) ----------
  var SS = 'emie-session-v1', LS = 'emie-v1';
  function load(store, key) { try { return JSON.parse(store.getItem(key) || 'null'); } catch (e) { return null; } }
  function save(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ } }
  var ss = (function () { try { return window.sessionStorage; } catch (e) { return null; } })();
  var ls = (function () { try { return window.localStorage; } catch (e) { return null; } })();

  var session = (ss && load(ss, SS)) || { pages: [], msgs: [], asked: [], open: false, teaserShown: false, flow: null };
  var prefs = (ls && load(ls, LS)) || {};
  function persist() {
    if (session.msgs.length > 60) session.msgs = session.msgs.slice(-60);
    if (ss) save(ss, SS, session);
  }
  function persistPrefs() { if (ls) save(ls, LS, prefs); }

  // Pages viewed this visit (sent only if the visitor submits their details).
  (function trackPage() {
    var title = (document.title || '').replace(/\s*[—|-]\s*Pravadh Labs\s*$/i, '').trim();
    var last = session.pages[session.pages.length - 1];
    if (!last || last.path !== location.pathname) {
      session.pages.push({ path: location.pathname, title: title, at: new Date().toISOString() });
      if (session.pages.length > 30) session.pages = session.pages.slice(-30);
      persist();
    }
  })();

  // ---- Knowledge base ------------------------------------------------------------
  // keys: words/phrases that point to this answer. Longer, more specific phrases score higher.
  var LINK = {
    eap: '[Early Access Program](eap.html)',
    products: '[Products](products.html)',
    security: '[Security](security.html)',
    compare: '[Compare](compare.html)',
    contact: '[Contact](contact.html)',
    partners: '[Partners](partners.html)'
  };
  var CHIPS_MAIN = ['Early Access Program', 'What do you build?', 'Pricing', 'Talk to the team'];
  var CHIPS_PRODUCTS = ['PravadhIQ', 'GovernX', 'Pravadh PM', 'Pravadh SI', 'Pravadh IX', 'DocSign', 'Caliber'];

  var KB = [
    { id: 'greet', keys: ['hi', 'hello', 'hey', 'hii', 'good morning', 'good evening', 'namaste', 'yo'],
      a: 'Hi! I\'m EMIE, the Pravadh Labs assistant. Ask me about our products, the Early Access Program, pricing or security.',
      chips: CHIPS_MAIN },
    { id: 'thanks', keys: ['thanks', 'thank you', 'thx', 'great', 'awesome', 'cool', 'ok thanks'],
      a: 'Happy to help. Anything else you\'d like to know?', chips: CHIPS_MAIN },
    { id: 'who', keys: ['who are you', 'what are you', 'emie', 'bot', 'human', 'real person'],
      a: 'I\'m EMIE, a simple assistant that answers common questions about Pravadh Labs. EMIE is also the name of the AI co-pilot inside our products. For anything I can\'t answer, leave your email and a person from the team will reply.',
      chips: ['Talk to the team', 'What do you build?'] },

    { id: 'eap', keys: ['early access', 'eap', 'beta', 'pilot', 'free access', 'six months', '6 months', 'program', 'programme', 'try it free', 'free trial', 'trial', 'join', 'sign up', 'signup', 'qualify'],
      a: '**The Early Access Program** gives selected businesses **six months of free access** to eligible Pravadh products, before general availability.\n\nSelected teams get:\n• Six months free on the products they\'re approved for\n• Early access to new releases\n• Regular feedback sessions with the people building the product\n• Priority onboarding with hands-on setup help\n\nIt\'s for teams with a real business problem to solve. Every application is reviewed individually, and places depend on fit and availability.',
      chips: ['Check if I qualify', 'Who is it for?', 'Which products?'] },
    { id: 'eap-who', keys: ['who is it for', 'eligible', 'eligibility', 'criteria', 'requirements', 'who can apply', 'selected', 'selection', 'review'],
      a: 'The program is built for **businesses with a real requirement**, not just curiosity. A strong application tells us:\n• Which Pravadh products you want to use\n• The business challenge you want them to solve\n• Who on your team would use them, and when you\'d start\n\nYou\'ll need a company email. Our team reads every application and replies from a pravadhlabs.com address.',
      chips: ['Check if I qualify', 'Which products?'] },
    { id: 'eap-products', keys: ['which products', 'what products are included', 'included in eap', 'eap products'],
      a: 'You can apply for early access to **PravadhIQ, GovernX, Pravadh PM, Pravadh SI, Caliber and Pravadh IX**, or pick "Not sure yet" and we\'ll help you find the right fit. Pravadh DocSign is already free on AppExchange, so it isn\'t part of the program.',
      chips: ['Check if I qualify', 'What do you build?'] },
    { id: 'eap-cost', keys: ['eap cost', 'is eap free', 'catch', 'after six months', 'after 6 months', 'credit card'],
      a: 'Selected applicants use the products they\'re approved for **at no cost for six months**. What happens after that is agreed with you directly, and the team will walk you through it during onboarding.',
      chips: ['Check if I qualify', 'Pricing'] },

    { id: 'company', keys: ['what do you build', 'what do you do', 'pravadh labs', 'about', 'company', 'who is pravadh', 'what is pravadh', 'overview', 'products', 'product', 'offer', 'solutions', 'services'],
      a: 'Pravadh Labs builds **AI-native products for Salesforce teams**. Seven products, one rail:\n• **PravadhIQ**: Salesforce DevOps and data migration, proven on an audit chain\n• **GovernX**: connect, clean and govern data across CRM, ERP and finance\n• **Pravadh PM**: tracker, service desk and docs with an AI delivery crew\n• **Pravadh SI**: AI sales prospecting; nothing sends until you approve\n• **Pravadh DocSign**: documents and eSignature inside Salesforce, free\n• **Caliber**: AI first-round voice interviews\n• **Pravadh IX**: multi-country invoicing with GST, VAT and sales tax\n\nAI does the heavy lifting, a person approves what matters. See ' + LINK.products + '.',
      chips: CHIPS_PRODUCTS },

    { id: 'iq', keys: ['pravadhiq', 'pravadh iq', ' iq', 'devops', 'ci/cd', 'cicd', 'deployment', 'deploy', 'release', 'rollback', 'migration', 'migrate', 'copado', 'gearset', 'github', 'foundation', 'data readiness'],
      a: '**PravadhIQ**: Ship it. Prove it.\nGitHub-native Salesforce DevOps and data migration on one platform:\n• AI risk analysis on every release, with generated rollback plans\n• Data migration with AI field mapping and a check before anything is written\n• A SHA-256 audit chain behind every change, plus signed compliance packs\n• **Foundation** (Preview) readies data for AI from any listed source to any destination\n\nThere\'s a free plan to start. [Visit PravadhIQ](https://pravadhiq.pravadhlabs.com)',
      chips: ['PravadhIQ early access', 'Security', 'Pricing'] },
    { id: 'gx', keys: ['governx', 'govern x', 'gx', 'governance', 'data quality', 'dedupe', 'duplicate', 'zoho', 'oracle', 'netsuite', 'erp', 'clean data', 'policy'],
      a: '**Pravadh GovernX**: Connect. Clean. Govern.\n• Connects Salesforce, Zoho CRM/Books, Oracle Fusion, NetSuite and EBS into one governed layer\n• Cross-platform duplicate detection, validation and ongoing cleansing\n• Policy enforced everywhere, limit forecasting, one risk score\n• EMIE co-pilot runs on the model you connect (Anthropic, OpenAI, Azure, Groq…) and you approve every fix\n\nWhite-label it or self-host from signed images. [Visit GovernX](https://pravadhgx.pravadhlabs.com)',
      chips: ['GovernX early access', 'Security'] },
    { id: 'pm', keys: ['pravadh pm', 'pm', 'project management', 'jira', 'tracker', 'service desk', 'ticket', 'sprint', 'agile', 'agents', 'delivery', 'confluence'],
      a: '**Pravadh PM**: Don\'t track it. Ship it.\nTracker, service desk, docs and dashboards in one workspace on Jira-style keys, plus four AI agents (BA, Architect, Dev, QA) that take each story to a tested pull request on its own branch.\n• Agents work only in sandboxes or staging, never production\n• A person approves every design and merge\n• Moving from Jira? Your keys come with you\n\n[Visit Pravadh PM](https://pravadhpm.pravadhlabs.com)',
      chips: ['Pravadh PM early access', 'Pricing'] },
    { id: 'si', keys: ['pravadh si', 'si', 'sales', 'prospecting', 'outreach', 'leads', 'lead gen', 'cold email', 'apollo', 'hunter', 'sequenc', 'revops', 'icp', 'linkedin'],
      a: '**Pravadh SI**: Right buyer. Right moment.\nAI sales prospecting and outreach for teams that already have a CRM:\n• Plain-English discovery across companies and people\n• Every lead scored, every score explained (who, why, why now)\n• Email, SMS, WhatsApp and voice sequences with mailbox protection\n• **Nothing reaches a real person until you approve.** We never scrape LinkedIn.\n• Writes back to Salesforce, HubSpot or Zoho\n\n[Visit Pravadh SI](https://pravadhsi.pravadhlabs.com)',
      chips: ['Pravadh SI early access', 'Pricing'] },
    { id: 'docsign', keys: ['docsign', 'doc sign', 'esign', 'e-sign', 'signature', 'docusign', 'conga', 's-docs', 'sdocs', 'nintex', 'document generation', 'appexchange', 'open source'],
      a: '**Pravadh DocSign** is document generation and eSignature inside Salesforce, and it\'s **free and open source** (Apache 2.0).\n• Any standard or custom object, templates in PDF and Word\n• Unlimited users, documents, recipients and signatures; signers need no licence\n• Signed file saved to Salesforce Files on the record, with a SHA-256 chain\n• Flow actions to generate, send, check status, cancel and resend\n\n[Visit DocSign](https://pravadhdocsign.pravadhlabs.com) · [Source on GitHub](https://github.com/Dhairyasalesforce/Pravadh-DocSign)',
      chips: ['Help installing DocSign', 'What do you build?'] },
    { id: 'caliber', keys: ['caliber', 'interview', 'hiring', 'recruit', 'candidate', 'hr', 'talent', 'proctor'],
      a: '**Caliber**: Every candidate, heard.\nAn AI interviewer for first-round hiring. EMIE runs live voice interviews on camera, follows up when an answer is thin, and scores every answer against your rubric.\n• Quiet integrity flags (pasted text, second display, another person on camera…)\n• Every report sealed with a SHA-256 fingerprint\n• Recordings stay in your Google Drive, OneDrive, S3 or server\n\nPlans from **₹5,000 / $59 a month**. [Visit Caliber](https://caliberai.pravadhlabs.com)',
      chips: ['Caliber early access', 'Pricing'] },
    { id: 'ix', keys: ['pravadh ix', 'pravadhix', ' ix ', 'invoice', 'invoicing', 'gst', 'vat', 'sales tax', 'tax', 'billing', 'accounting', 'ledger', 'books', 'quickbooks', 'xero', 'tally', 'freshbooks', 'credit note', 'receivable', 'payable', 'multi-country', 'multi currency', 'multi-currency', 'expenses'],
      a: '**Pravadh IX**: One login. Every company.\nMulti-country invoicing and AR/AP for teams with entities in more than one country:\n• GST, VAT and sales tax for 200 countries, picked from seller and buyer location\n• A profile per company, with its own currency, tax ID and bank accounts locked to its country\n• Quotes with versions, bills, expenses, ledgers and returns (GSTR-1, GSTR-3B, VAT100)\n• An 18-month AI revenue forecast with a confidence range\n• Move in from Zoho Books, Xero, QuickBooks, Tally or FreshBooks\n\n**$25 per user a month**, plus $10 for each extra company. [Visit Pravadh IX](https://pravadhix.pravadhlabs.com)',
      chips: ['Pravadh IX early access', 'Pricing'] },

    { id: 'pricing', keys: ['price', 'pricing', 'cost', 'how much', 'plans', 'plan', 'quote', 'license', 'licence', 'subscription', 'budget', 'expensive', 'cheap', 'free'],
      a: 'Pricing depends on the product:\n• **PravadhIQ**: free plan to start; Data, Unified and Enterprise plans above it\n• **Pravadh SI**: pay as you go, a base platform plus the modules you switch on\n• **Pravadh PM**: a fixed monthly fee per AI agent per project\n• **Caliber**: from ₹5,000 / $59 a month\n• **Pravadh IX**: $25 per user a month, plus $10 for each extra company\n• **DocSign**: free\n\nOr apply to the ' + LINK.eap + ' for six months free if you\'re selected. For a quote, leave your details and the team will reply.',
      chips: ['Check if I qualify', 'Get a quote'] },
    { id: 'security', keys: ['security', 'secure', 'compliance', 'gdpr', 'soc', 'iso', 'encryption', 'privacy', 'data residency', 'audit', 'pii', 'safe'],
      a: 'Three things are true on every product:\n• **Logged**: every deploy, migration and governance action is attributable and reversible\n• **In your org**: CRM records stay in your org; we don\'t become a second system of record\n• **You approve**: nothing moves without a person, and you choose what a model prompt may include\n\nExamples include AES-256 encryption at rest, TLS in transit, a SHA-256 audit chain and PII redaction on ingest. Details per product on ' + LINK.security + '.',
      chips: ['Self-hosting', 'Talk to the team'] },
    { id: 'selfhost', keys: ['self host', 'self-host', 'on prem', 'on-prem', 'on premise', 'own server', 'private cloud', 'white label', 'white-label', 'whitelabel', 'my brand', 'own model', 'byo', 'bring your own', 'llm', 'openai', 'anthropic', 'model'],
      a: 'Yes on all three:\n• **White-label**: your brand and domain on PravadhIQ, GovernX, PM and SI\n• **Bring your own model**: EMIE runs on the LLM you connect, with your key encrypted at rest\n• **Your servers**: self-host on Enterprise (GovernX from signed images; PM as a private package in your network)',
      chips: ['Talk to the team', 'Security'] },
    { id: 'salesforce', keys: ['salesforce', 'isv', 'agentforce', 'sfdc', 'crm', 'hubspot', 'integration', 'integrate', 'connect'],
      a: 'Pravadh Labs is a **Salesforce ISV Partner**. Salesforce is where most of our customers live, so that\'s where we start, but the products also connect to ERP, finance, Git, other CRMs (HubSpot, Zoho) and the tools your team already trusts.',
      chips: CHIPS_PRODUCTS },
    { id: 'compare', keys: ['compare', 'comparison', 'vs', 'versus', 'difference', 'alternative', 'competitor', 'better than'],
      a: 'The ' + LINK.compare + ' page shows how each product sits against the usual tools, plus what\'s shared across the platform: one connector fabric, one audit trail, one EMIE brain, white-label and bring-your-own-model.',
      chips: CHIPS_PRODUCTS },
    { id: 'partners', keys: ['partner program', 'partner', 'reseller', 'referral', 'commission', 'affiliate', 'resell'],
      a: 'Our reseller program pays **20% of collected revenue** from customers you bring, for as long as they keep paying, plus **5%** on their referrals (one level). Apply with a company email on the ' + LINK.partners + ' page.',
      chips: ['Talk to the team'] },
    { id: 'location', keys: ['where are you', 'location', 'office', 'based', 'india', 'ahmedabad', 'bengaluru', 'bangalore', 'jaipur', 'team size', 'founder', 'ceo', 'dhairya'],
      a: 'Pravadh Labs is a small, founder-led team with offices in **Ahmedabad, Bengaluru and Jaipur**. Our founder & CEO, **Dhairya Shah**, is a Salesforce architect with 11+ years of experience and 15 Salesforce certifications. More on the [About](about.html) page.',
      chips: ['What do you build?', 'Talk to the team'] },
    { id: 'contact', keys: ['contact', 'talk to', 'speak', 'call', 'demo', 'meeting', 'sales team', 'email you', 'reach', 'get in touch', 'phone', 'quote', 'help'],
      a: 'Happy to connect you with the team. Leave your details here and someone will reply from a pravadhlabs.com address, or email ' + CONFIG.inboxEmail + '.',
      chips: ['Talk to the team', 'Check if I qualify'] },
    { id: 'careers', keys: ['job', 'career', 'hiring at', 'vacancy', 'internship', 'work at', 'work with you', 'opening'],
      a: 'I don\'t have current openings to share. Send your details and a short note with "Careers" in it, or email ' + CONFIG.inboxEmail + ', and the team will get back to you.',
      chips: ['Talk to the team'] }
  ];

  // Chips that start an action rather than a lookup.
  var PRODUCT_CHOICES = [
    { label: 'PravadhIQ', value: 'pravadhiq' },
    { label: 'GovernX', value: 'governx' },
    { label: 'Pravadh PM', value: 'pravadh-pm' },
    { label: 'Pravadh SI', value: 'pravadh-si' },
    { label: 'Caliber', value: 'caliber' },
    { label: 'Pravadh IX', value: 'pravadh-ix' },
    { label: 'Not sure yet', value: 'not-sure' }
  ];
  var TIMELINE_CHOICES = [
    { label: 'Immediately', value: 'immediately' },
    { label: 'Within a month', value: 'within-1-month' },
    { label: 'In 1–3 months', value: '1-3-months' },
    { label: 'Just exploring', value: 'exploring' }
  ];

  var TEASER = ON_EAP
    ? { tag: 'Early Access', title: 'Questions before you apply?', body: 'I can tell you what selected teams get, who the program is for, and which products are included.', primary: 'Ask EMIE', primaryAction: 'open' }
    : { tag: 'Early Access · Now open', title: 'Use Pravadh free for 6 months.', body: 'We\'re picking a small group of teams to get our AI products before launch, with hands-on setup and a direct line to the people building them.', primary: 'See if I qualify', primaryAction: 'eap', secondary: 'Ask a question' };

  // ---- Styles ------------------------------------------------------------------
  var css = [
    '.emie, .emie *{box-sizing:border-box}',
    '.emie{--e-bg:var(--ink,#071430);--e-soft:var(--ink-soft,#0d1f45);--e-fg:var(--paper,#EAF3FF);--e-line:var(--line-dark,#232F52);--e-muted:var(--muted,#868A95);--e-accent:var(--teal,#2563eb);--e-link:var(--teal-text,#60a5fa);--e-amber:var(--amber,#FD9E01);--e-grad:var(--btn-grad,linear-gradient(135deg,#2563eb 0%,#0ea5e9 100%));',
    'position:fixed;right:24px;bottom:24px;z-index:160;font-family:var(--font-body,Inter,system-ui,sans-serif);color:var(--e-fg);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}',
    '.emie-launch{position:relative;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:var(--e-grad);color:#fff;display:grid;place-items:center;box-shadow:0 10px 30px rgba(37,99,235,.38),0 2px 6px rgba(7,20,48,.2);transition:transform .2s ease,box-shadow .2s ease}',
    '.emie-launch:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 14px 36px rgba(37,99,235,.48)}',
    '.emie-launch:focus-visible,.emie button:focus-visible,.emie a:focus-visible,.emie input:focus-visible{outline:2px solid var(--e-link);outline-offset:2px}',
    '.emie-launch .emie-x{width:28px;height:28px}',
    '.emie-launch .emie-face{position:absolute;inset:0;width:100%;height:100%}',
    '.emie-face .emie-eyes{transform-box:view-box;transform-origin:32px 29px;animation:emieBlink 5.5s infinite}',
    '@keyframes emieBlink{0%,91%,97%,100%{transform:scaleY(1)}94%{transform:scaleY(.12)}}',
    '.emie-face .emie-bulb{animation:emieGlow 2.8s ease-in-out infinite}',
    '@keyframes emieGlow{0%,100%{opacity:1}50%{opacity:.55}}',
    '.emie.has-dot .emie-launch .emie-face{transform-origin:50% 90%;animation:emieNod 1.6s ease-in-out 2}',
    '@keyframes emieNod{0%,100%{transform:rotate(0)}20%{transform:rotate(-10deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-5deg)}80%{transform:rotate(2deg)}}',
    '.emie.is-typing .emie-head .emie-eyes{animation:emieLook 1.2s ease-in-out infinite}',
    '@keyframes emieLook{0%,100%{transform:translateX(0)}30%{transform:translateX(-2px)}70%{transform:translateX(2px)}}',
    '.emie-launch .emie-x{display:none}',
    '.emie.is-open .emie-launch .emie-x{display:block}.emie.is-open .emie-launch .emie-spark{display:none}',
    '.emie-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:var(--e-amber);border:2px solid var(--e-bg);display:none}',
    '.emie.has-dot .emie-dot{display:block;animation:emiePing 2s ease-out infinite}',
    '@keyframes emiePing{0%{box-shadow:0 0 0 0 rgba(253,158,1,.55)}70%{box-shadow:0 0 0 10px rgba(253,158,1,0)}100%{box-shadow:0 0 0 0 rgba(253,158,1,0)}}',
    // Teaser
    '.emie-teaser{position:absolute;right:0;bottom:76px;width:320px;max-width:calc(100vw - 32px);background:var(--e-bg);border:1px solid var(--e-line);border-radius:14px;padding:18px 18px 16px;box-shadow:0 20px 50px rgba(7,20,48,.28);opacity:0;transform:translateY(10px) scale(.98);transform-origin:bottom right;pointer-events:none;visibility:hidden;transition:opacity .35s ease,transform .35s cubic-bezier(.16,1,.3,1),visibility .35s}',
    '.emie-teaser.is-in{opacity:1;transform:none;pointer-events:auto;visibility:visible}',
    '.emie-teaser::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;border-radius:14px 14px 0 0;background:var(--brand-grad,var(--e-grad))}',
    '.emie-teaser-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}',
    '.emie-ava{flex:none;width:36px;height:36px;border-radius:50%;display:block;box-shadow:0 4px 12px rgba(37,99,235,.28)}',
    '.emie-ava.lg{width:44px;height:44px}',
    '.emie-ava .emie-face{width:100%;height:100%;display:block}',
    '.emie-teaser-who{font-size:13px;font-weight:600;line-height:1.2}.emie-teaser-who small{display:block;font-weight:400;color:var(--e-muted);font-size:12px}',
    '.emie-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono,ui-monospace,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--e-amber);background:var(--amber-soft,rgba(253,158,1,.14));border-radius:999px;padding:3px 9px;margin-bottom:8px}',
    '.emie-tag::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}',
    '.emie-teaser h3{margin:0 0 6px;font-family:var(--font-display,Poppins,sans-serif);font-size:19px;line-height:1.2;letter-spacing:-.025em;font-weight:700;color:var(--e-fg)}',
    '.emie-teaser p{margin:0 0 14px;color:var(--muted-light,var(--e-muted));font-size:13.5px}',
    '.emie-teaser-actions{display:flex;gap:8px;flex-wrap:wrap}',
    '.emie-btn{appearance:none;border:0;cursor:pointer;border-radius:8px;padding:10px 14px;font:600 13.5px/1 var(--font-body,Inter,system-ui,sans-serif);background:var(--e-grad);color:#fff;transition:filter .15s ease,transform .15s ease}',
    '.emie-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}',
    '.emie-btn.ghost{background:transparent;color:var(--e-fg);border:1px solid var(--e-line)}',
    '.emie-close{position:absolute;top:10px;right:10px;width:28px;height:28px;border:0;border-radius:50%;background:transparent;color:var(--e-muted);cursor:pointer;display:grid;place-items:center}',
    '.emie-close:hover{background:var(--e-soft);color:var(--e-fg)}',
    // Panel
    '.emie-panel{position:absolute;right:0;bottom:76px;width:380px;height:min(600px,calc(100vh - 120px));height:min(600px,calc(100dvh - 120px));background:var(--e-bg);border:1px solid var(--e-line);border-radius:16px;box-shadow:0 24px 60px rgba(7,20,48,.32);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(12px) scale(.98);transform-origin:bottom right;visibility:hidden;pointer-events:none;transition:opacity .3s ease,transform .3s cubic-bezier(.16,1,.3,1),visibility .3s}',
    '.emie.is-open .emie-panel{opacity:1;transform:none;visibility:visible;pointer-events:auto}',
    '.emie-head{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 16px;border-bottom:1px solid var(--e-line);background:var(--e-soft)}',
    '.emie-head-txt{flex:1;min-width:0}.emie-head-txt strong{display:block;font-size:15px;line-height:1.2}',
    '.emie-head-txt span{font-size:12px;color:var(--e-muted);display:flex;align-items:center;gap:6px}',
    '.emie-head-txt span::before{content:"";width:7px;height:7px;border-radius:50%;background:#14b8a6}',
    '.emie-head .emie-close{position:static}',
    '.emie-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;overscroll-behavior:contain}',
    '.emie-msg{max-width:88%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;animation:emieIn .25s ease}',
    '.emie-msg.bot{background:var(--e-soft);border:1px solid var(--e-line);border-bottom-left-radius:4px;align-self:flex-start}',
    '.emie-msg.me{background:var(--e-accent);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}',
    '.emie-msg a{color:var(--e-link);text-decoration:underline;text-underline-offset:2px}',
    '.emie-msg.me a{color:#fff}',
    '.emie-msg strong{font-weight:600}',
    '.emie-msg.note{align-self:center;background:none;border:0;color:var(--e-muted);font-size:12px;text-align:center;padding:2px 8px}',
    '@keyframes emieIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '.emie-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:var(--e-soft);border:1px solid var(--e-line);border-radius:14px;border-bottom-left-radius:4px}',
    '.emie-typing i{width:6px;height:6px;border-radius:50%;background:var(--e-muted);animation:emieDot 1s infinite}',
    '.emie-typing i:nth-child(2){animation-delay:.15s}.emie-typing i:nth-child(3){animation-delay:.3s}',
    '@keyframes emieDot{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}',
    '.emie-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}',
    '.emie-chip{appearance:none;cursor:pointer;border:1px solid var(--e-line);background:transparent;color:var(--e-fg);border-radius:999px;padding:7px 12px;font:500 13px/1.1 var(--font-body,Inter,system-ui,sans-serif);transition:border-color .15s ease,background .15s ease}',
    '.emie-chip:hover{border-color:var(--e-accent);background:var(--teal-soft,rgba(37,99,235,.16))}',
    '.emie-chip.primary{background:var(--e-grad);color:#fff;border-color:transparent}',
    '.emie-chip.toggle.is-on{border-color:var(--e-accent);background:var(--teal-soft,rgba(37,99,235,.16));color:var(--e-fg)}',
    '.emie-chip.toggle.is-on::before{content:"\\2713  ";font-weight:700;color:var(--e-link)}',
    '.emie-form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--e-line)}',
    '.emie-form input{flex:1;min-width:0;border:1px solid var(--e-line);background:var(--e-soft);color:var(--e-fg);border-radius:10px;padding:11px 12px;font:400 16px/1.2 var(--font-body,Inter,system-ui,sans-serif)}',
    '.emie-form input::placeholder{color:var(--e-muted)}',
    '.emie-send{flex:none;width:44px;border:0;border-radius:10px;background:var(--e-grad);color:#fff;cursor:pointer;display:grid;place-items:center}',
    '.emie-send svg{width:18px;height:18px}',
    '.emie-foot{padding:0 12px 10px;font-size:11px;color:var(--e-muted);text-align:center}',
    '.emie-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    'html[data-theme="light"] .emie-teaser,html[data-theme="light"] .emie-panel{box-shadow:0 20px 50px rgba(7,20,48,.16)}',
    'body.has-emie .explore-pill{right:100px}',
    '@media (max-width:600px){',
    '  .emie{right:16px;bottom:16px}',
    '  .emie-launch{width:56px;height:56px}',
    '  .emie-teaser{bottom:70px}',
    '  .emie.is-open{left:0;right:0;bottom:0;top:0}',
    '  .emie.is-open .emie-launch{display:none}',
    '  .emie-panel{position:fixed;inset:0;width:auto;height:auto;border-radius:0;border:0}',
    '  body.has-emie .explore-pill{right:84px}',
    '}',
    '@media (prefers-reduced-motion:reduce){.emie *{animation:none!important;transition:none!important}}',
    '@media print{.emie{display:none!important}}'
  ].join('\n');

  // ---- DOM -----------------------------------------------------------------------
  // EMIE's face: an original mark in the Pravadh gradient. Eyes blink; she nods when the invite appears.
  function FACE(extra) {
    return '<svg class="emie-face' + (extra ? ' ' + extra : '') + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="emieFaceG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset=".55" stop-color="#0ea5e9"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>' +
      '<circle cx="32" cy="32" r="32" fill="url(#emieFaceG)"/>' +
      '<path d="M32 15V10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle class="emie-bulb" cx="32" cy="8" r="3.4" fill="#FD9E01"/>' +
      '<rect x="9.5" y="27" width="5" height="11" rx="2.5" fill="#fff" opacity=".8"/>' +
      '<rect x="49.5" y="27" width="5" height="11" rx="2.5" fill="#fff" opacity=".8"/>' +
      '<rect x="13" y="15.5" width="38" height="33" rx="15" fill="#fff"/>' +
      '<g class="emie-eyes"><rect x="22" y="24.5" width="6.4" height="9.5" rx="3.2" fill="#071430"/><rect x="35.6" y="24.5" width="6.4" height="9.5" rx="3.2" fill="#071430"/>' +
      '<circle cx="26.4" cy="27" r="1.3" fill="#fff"/><circle cx="40" cy="27" r="1.3" fill="#fff"/></g>' +
      '<ellipse cx="19.5" cy="37.5" rx="3" ry="1.8" fill="#FD9E01" opacity=".4"/><ellipse cx="44.5" cy="37.5" rx="3" ry="1.8" fill="#FD9E01" opacity=".4"/>' +
      '<path d="M27 38.6q5 4.6 10 0" stroke="#071430" stroke-width="2.3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }
  var ICON_X = '<svg class="emie-x" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_X_SM = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  var root, launch, teaser, panel, log, chipsEl, form, input;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    var style = el('style');
    style.id = 'emie-style';
    style.textContent = css;
    document.head.appendChild(style);

    root = el('div', 'emie');
    root.setAttribute('data-nosnippet', '');
    root.setAttribute('data-lenis-prevent', '');

    // Teaser
    teaser = el('div', 'emie-teaser');
    teaser.setAttribute('role', 'dialog');
    teaser.setAttribute('aria-label', 'Early Access Program invitation');
    teaser.innerHTML =
      '<button class="emie-close" type="button" aria-label="Dismiss">' + ICON_X_SM + '</button>' +
      '<div class="emie-teaser-head"><div class="emie-ava lg">' + FACE() + '</div>' +
      '<div class="emie-teaser-who">EMIE<small>Pravadh Labs assistant</small></div></div>' +
      '<div class="emie-tag">' + esc(TEASER.tag) + '</div>' +
      '<h3>' + esc(TEASER.title) + '</h3>' +
      '<p>' + esc(TEASER.body) + '</p>' +
      '<div class="emie-teaser-actions">' +
      '<button class="emie-btn" type="button" data-act="primary">' + esc(TEASER.primary) + ' →</button>' +
      (TEASER.secondary ? '<button class="emie-btn ghost" type="button" data-act="secondary">' + esc(TEASER.secondary) + '</button>' : '') +
      '</div>';

    // Panel
    panel = el('div', 'emie-panel');
    panel.id = 'emie-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with EMIE');
    panel.innerHTML =
      '<div class="emie-head"><div class="emie-ava">' + FACE() + '</div>' +
      '<div class="emie-head-txt"><strong>EMIE</strong><span>Pravadh Labs assistant · replies instantly</span></div>' +
      '<button class="emie-close" type="button" aria-label="Close chat">' + ICON_X_SM + '</button></div>' +
      '<div class="emie-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="emie-chips"></div>' +
      '<form class="emie-form" autocomplete="on"><label class="emie-sr" for="emie-input">Message EMIE</label>' +
      '<input id="emie-input" type="text" maxlength="600" placeholder="Ask me anything…" autocomplete="off">' +
      '<button class="emie-send" type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '<div class="emie-foot">Automated answers. A person replies to anything you send to the team.</div>';

    launch = el('button', 'emie-launch');
    launch.type = 'button';
    launch.setAttribute('aria-label', 'Chat with EMIE');
    launch.setAttribute('aria-controls', 'emie-panel');
    launch.setAttribute('aria-expanded', 'false');
    launch.innerHTML = FACE('emie-spark') + ICON_X + '<span class="emie-dot" aria-hidden="true"></span>';

    root.appendChild(teaser);
    root.appendChild(panel);
    root.appendChild(launch);
    document.body.appendChild(root);
    document.body.classList.add('has-emie');

    log = panel.querySelector('.emie-log');
    chipsEl = panel.querySelector('.emie-chips');
    form = panel.querySelector('.emie-form');
    input = panel.querySelector('input');

    launch.addEventListener('click', function () { session.open ? close() : open(); });
    panel.querySelector('.emie-close').addEventListener('click', close);
    teaser.querySelector('.emie-close').addEventListener('click', function () { hideTeaser(true); });
    teaser.querySelector('[data-act="primary"]').addEventListener('click', function () {
      hideTeaser(false);
      if (TEASER.primaryAction === 'eap' && !session.flow) {
        open({ skipGreet: true });
        userSays('See if I qualify', function () { startFlow('eap'); });
      } else open();
    });
    var sec = teaser.querySelector('[data-act="secondary"]');
    if (sec) sec.addEventListener('click', function () { hideTeaser(false); open(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      handleText(v);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (session.open) { close(); launch.focus(); }
      else if (teaser.classList.contains('is-in')) hideTeaser(true);
    });
  }

  // ---- Rendering -------------------------------------------------------------------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Tiny, safe formatter: escape first, then **bold** and [text](url) for http(s)/relative links.
  function fmt(s) {
    var h = esc(s);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|[a-z0-9_-]+\.html|mailto:)[^)\s]*)\)/gi, function (m, t, u) {
      var ext = /^https?:/i.test(u) && u.indexOf(location.host) === -1;
      return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    });
    h = h.replace(/([\w.+-]+@pravadhlabs\.com)/g, '<a href="mailto:$1">$1</a>');
    return h;
  }

  function renderMsg(m) {
    var n = el('div', 'emie-msg ' + m.who, fmt(m.text));
    log.appendChild(n);
  }
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addMsg(who, text) {
    var m = { who: who, text: text };
    if (who === 'me' && session.flow) m.f = 1; // answers to the details form aren't repeated in the email
    session.msgs.push(m);
    persist();
    renderMsg(m);
    scrollDown();
  }

  function setChips(list) {
    session.chips = list || [];
    persist();
    renderChips();
  }
  function renderChips() {
    chipsEl.innerHTML = '';
    (session.chips || []).forEach(function (c) {
      var label = typeof c === 'string' ? c : c.label;
      var b = el('button', 'emie-chip' + (c.primary ? ' primary' : '') + (c.action === 'toggle' ? ' toggle' + (c.on ? ' is-on' : '') : ''), esc(label));
      b.type = 'button';
      if (c.action === 'toggle') b.setAttribute('aria-pressed', c.on ? 'true' : 'false');
      b.addEventListener('click', function () { handleText(label, c); });
      chipsEl.appendChild(b);
    });
  }

  var typingNode = null;
  function botSays(text, chips, done) {
    setChips([]);
    if (!typingNode) {
      typingNode = el('div', 'emie-typing', '<i></i><i></i><i></i>');
      typingNode.setAttribute('aria-hidden', 'true');
    }
    log.appendChild(typingNode);
    root.classList.add('is-typing');
    scrollDown();
    var delay = Math.min(1100, 350 + text.length * 4);
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) delay = 0;
    setTimeout(function () {
      if (typingNode.parentNode) typingNode.parentNode.removeChild(typingNode);
      root.classList.remove('is-typing');
      addMsg('bot', text);
      setChips(chips || []);
      if (done) done();
    }, delay);
  }
  function userSays(text, then) { addMsg('me', text); if (then) then(); }

  // ---- Open / close / teaser ---------------------------------------------------------
  function greetIfEmpty() {
    if (session.msgs.length) return;
    session.pending = 'eap';
    var hello = ON_EAP
      ? 'Hi, I\'m EMIE. Thinking about the Early Access Program? Ask me anything, or I can take your details and pass them to the team.'
      : 'Hi, I\'m EMIE from Pravadh Labs.\n\nWe\'re opening an **Early Access Program**: selected teams get **six months free** on our AI products, before launch. Want to see if you qualify, or ask me something first?';
    botSays(hello, ON_EAP
      ? ['Who is it for?', 'Which products?', 'What do selected teams get?', 'Talk to the team']
      : [{ label: 'Check if I qualify', primary: true }, 'What do you build?', 'Pricing', 'Talk to the team']);
  }

  function open(opts) {
    session.open = true;
    persist();
    root.classList.add('is-open');
    root.classList.remove('has-dot');
    launch.setAttribute('aria-expanded', 'true');
    launch.setAttribute('aria-label', 'Close chat');
    hideTeaser(false, true);
    if (!(opts && opts.skipGreet)) greetIfEmpty();
    setTimeout(function () { scrollDown(); if (window.innerWidth > 600) input.focus(); }, 60);
  }
  function close() {
    session.open = false;
    persist();
    root.classList.remove('is-open');
    launch.setAttribute('aria-expanded', 'false');
    launch.setAttribute('aria-label', 'Chat with EMIE');
  }

  function teaserAllowed() {
    if (session.teaserShown || session.open || session.msgs.length) return false;
    if (prefs.submitted) return false;
    if (prefs.snoozeUntil && Date.now() < prefs.snoozeUntil) return false;
    return true;
  }
  function showTeaser() {
    if (!teaserAllowed()) return;
    session.teaserShown = true;
    persist();
    teaser.classList.add('is-in');
    root.classList.add('has-dot');
  }
  function hideTeaser(snooze, silent) {
    if (!teaser.classList.contains('is-in') && !snooze) return;
    teaser.classList.remove('is-in');
    if (snooze) {
      prefs.snoozeUntil = Date.now() + CONFIG.snoozeDays * 864e5;
      persistPrefs();
      if (!silent) root.classList.remove('has-dot');
    }
  }
  function scheduleTeaser() {
    if (!teaserAllowed()) {
      // Still nudge with the dot on a fresh visit if they never opened the chat.
      if (!session.msgs.length && !prefs.submitted && !session.open) root.classList.add('has-dot');
      return;
    }
    var fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      window.removeEventListener('scroll', onScroll);
      showTeaser();
    }
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && window.scrollY / h >= CONFIG.teaserScrollRatio) fire();
    }
    setTimeout(fire, CONFIG.teaserDelayMs);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Understanding ---------------------------------------------------------------
  function norm(s) {
    return ' ' + String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9@./+\- ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  function match(text) {
    var t = norm(text);
    var best = null, bestScore = 0;
    KB.forEach(function (item) {
      var score = 0;
      item.keys.forEach(function (k) {
        var key = k.toLowerCase();
        var hit = key.length <= 3 || key.charAt(0) === ' '
          ? t.indexOf(' ' + key.trim() + ' ') !== -1
          : t.indexOf(key) !== -1;
        if (hit) score += 1 + key.trim().length / 6;
      });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return bestScore >= 1 ? best : null;
  }

  var EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i;
  var PERSONAL = /@(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|icloud|me|mac|aol|proton|protonmail|pm|zoho|zohomail|gmx|mail|email|inbox|yandex|rediffmail|rediff|tutanota|tuta|fastmail|mailinator|guerrillamail|tempmail|10minutemail|trashmail|yopmail)\.[a-z.]+$/i;
  function isBusiness(email) {
    if (window.PravadhEmail && window.PravadhEmail.isBusinessEmail) return window.PravadhEmail.isBusinessEmail(email);
    return !PERSONAL.test(email);
  }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s); }

  function productsFromText(text) {
    var t = norm(text), out = [];
    if (/pravadhiq|pravadh iq| iq /.test(t)) out.push('pravadhiq');
    if (/governx|govern x| gx /.test(t)) out.push('governx');
    if (/pravadh pm| pm /.test(t)) out.push('pravadh-pm');
    if (/pravadh si| si /.test(t)) out.push('pravadh-si');
    if (/caliber/.test(t)) out.push('caliber');
    if (/pravadh ix|pravadhix| ix /.test(t)) out.push('pravadh-ix');
    if (!out.length && /not sure|unsure|dont know|help me pick|all of them|any/.test(t)) out.push('not-sure');
    return out;
  }
  function productLabels(list) {
    return (list && list.length ? list : ['not-sure']).map(function (v) { return labelFor(PRODUCT_CHOICES, v); }).join(', ');
  }

  // ---- Conversation ------------------------------------------------------------------
  function handleText(text, chip) {
    var act = chip && chip.action;
    if (act === 'goEap') { window.location.href = chip.href; return; }
    if (act === 'mailto') { window.location.href = chip.href; return; }
    if (act === 'toggle' && session.flow) { toggleProduct(chip.value); return; }
    if (act === 'productsDone' && session.flow) text = productLabels(session.flow.data.products);
    userSays(text);
    var t = norm(text);
    var pending = session.pending;
    session.pending = null;
    persist();

    if (act === 'retry' && session.flow) return confirmAndSend();
    if (act === 'pass' && !session.flow) return startFlow('question');

    // Cancel a running flow
    if (session.flow && /^ (cancel|stop|nevermind|never mind|not now|later|no thanks) $/.test(t)) {
      session.flow = null;
      persist();
      return botSays('No problem. What else can I help with?', CHIPS_MAIN);
    }
    if (session.flow) return flowStep(text, chip);

    // Action chips / intents
    if (/^ (yes|yes please|yeah|yep|sure|ok|okay|please do|go ahead) $/.test(t)) {
      return pending === 'pass' ? startFlow('question') : startFlow('eap');
    }
    if (/check if i qualify|see if i qualify|apply|early access $|i want early access/.test(t)) {
      return startFlow('eap', { products: productsFromText(text).filter(function (x) { return x !== 'not-sure'; }) });
    }
    if (/talk to the team|get a quote|help installing docsign|contact sales|book a demo|^ (demo|human|agent|person) $/.test(t)) {
      return startFlow('question', { topic: text });
    }
    if (/what do selected teams get/.test(t)) return answer(KB.filter(function (k) { return k.id === 'eap'; })[0]);
    if (/self-hosting/.test(t)) return answer(KB.filter(function (k) { return k.id === 'selfhost'; })[0]);

    // Someone typed their email straight away
    var em = text.match(EMAIL_RE);
    if (em) return startFlow('question', { email: em[0].toLowerCase(), topic: text });

    var item = match(text);
    if (item) return answer(item);

    session.asked.push(text);
    session.pending = 'pass';
    persist();
    botSays('I don\'t have a good answer for that one yet, but the team will. Want me to pass your question on? Someone will reply by email.',
      [{ label: 'Yes, pass it on', primary: true, action: 'pass' }, 'What do you build?', 'Early Access Program']);
  }

  function answer(item) {
    session.asked.push(item.id);
    persist();
    botSays(item.a, item.chips);
  }

  function startFlow(type, data) {
    session.flow = { type: type, step: 'name', data: data || {} };
    // A typed-in email from earlier is kept; carry the last unanswered question as the topic.
    if (type === 'question' && !session.flow.data.topic) {
      var lastQ = session.asked.filter(function (q) { return q.length > 12; }).pop();
      if (lastQ) session.flow.data.topic = lastQ;
    }
    persist();
    var intro = type === 'eap'
      ? 'Great, it takes about 30 seconds. I\'ll ask a few quick things and send them to the team, who review every application personally.\n\nFirst, what\'s your **name**?'
      : 'Sure. I\'ll pass this to the team and someone will reply by email.\n\nWhat\'s your **name**?';
    botSays(intro, ['Cancel']);
  }

  function flowStep(text, chip) {
    var f = session.flow, d = f.data, v = text.trim();

    if (chip && chip.action === 'noBiz') {
      f.type = 'question'; f.step = 'email'; persist();
      return botSays('No problem. I can still pass a question to the team with any email, and they can tell you about other options. What email should they reply to?', ['Cancel']);
    }

    switch (f.step) {
      case 'name':
        if (v.length < 2 || v.length > 80 || !/[a-zÀ-ɏऀ-ॿ]/i.test(v)) return botSays('Could you share your name?', ['Cancel']);
        d.name = v.replace(/^(i am|im|i'm|my name is|this is)\s+/i, '');
        if (d.email) { f.step = 'company'; persist(); return botSays('Thanks, ' + first(d.name) + '. Which **company** are you with?', ['Cancel']); }
        f.step = 'email'; persist();
        return botSays('Thanks, ' + first(d.name) + '. What\'s your **work email**?' + (f.type === 'eap' ? ' (Early access needs a company address, not Gmail, Yahoo or Outlook.com.)' : ''), ['Cancel']);

      case 'email':
        var m = v.match(EMAIL_RE);
        var e = m ? m[0].toLowerCase() : '';
        if (!e || !validEmail(e)) return botSays('That doesn\'t look like an email address. Could you check it?', ['Cancel']);
        if (f.type === 'eap' && !isBusiness(e)) {
          return botSays('The Early Access Program needs a **company email** so we can review the business. Do you have a work address?',
            ['Cancel', { label: 'I don\'t have one', action: 'noBiz' }]);
        }
        if (/@pravadh(labs)?\.com$/i.test(e) && f.type === 'eap') {
          return botSays('Early access is for external businesses, so Pravadh team addresses can\'t apply. Want to send a question instead?', [{ label: 'Talk to the team' }, 'Cancel']);
        }
        d.email = e; f.step = 'company'; persist();
        return botSays('Got it. Which **company** are you with?', ['Cancel']);

      case 'company':
        if (v.length < 2) return botSays('Which company are you with?', ['Cancel']);
        d.company = v.slice(0, 120);
        if (f.type === 'eap') {
          f.step = 'product';
          d.products = d.products || [];
          persist();
          return askProducts();
        }
        f.step = 'message'; persist();
        return botSays(d.topic && d.topic.length > 12
          ? 'Thanks. I\'ll include your question: "' + d.topic.slice(0, 140) + '". Anything to add? (Or tap Send as is.)'
          : 'Thanks. What would you like to ask or discuss?', d.topic && d.topic.length > 12 ? [{ label: 'Send as is', primary: true, action: 'asis' }, 'Cancel'] : ['Cancel']);

      case 'product':
        if (!(chip && chip.action === 'productsDone')) {
          var typed = productsFromText(v);
          if (!typed.length) return botSays('Tap the products you\'re interested in (pick as many as you like), then **Continue**.', productChips());
          d.products = typed;
        }
        if (!d.products || !d.products.length) return botSays('Pick at least one, or choose **Not sure yet** and we\'ll help you find the fit.', productChips());
        f.step = 'timeline'; persist();
        return askTimeline();

      case 'timeline':
        var tl = (chip && chip.value) || TIMELINE_CHOICES.filter(function (c) { return norm(c.label) === norm(v); }).map(function (c) { return c.value; })[0];
        d.timeline = tl || v.slice(0, 60);
        f.step = 'challenge'; persist();
        return botSays('Last one: in a sentence, **what business problem** would you use it for? This is what the team looks at first.', [{ label: 'Skip', action: 'skip' }, 'Cancel']);

      case 'challenge':
        d.challenge = chip && chip.action === 'skip' ? '' : v.slice(0, 1000);
        return askSum();

      case 'message':
        d.message = chip && chip.action === 'asis' ? '' : v.slice(0, 1000);
        return askSum();

      case 'captcha':
        if (parseInt(v, 10) === f.sum) return confirmAndSend();
        return askSum('Not quite. Try this one: ');
    }

    botSays('Sorry, I lost track. Shall we start again?', CHIPS_MAIN);
    session.flow = null; persist();
  }

  function productChips() {
    var sel = (session.flow && session.flow.data.products) || [];
    return PRODUCT_CHOICES.map(function (p) { return { label: p.label, value: p.value, action: 'toggle', on: sel.indexOf(p.value) !== -1 }; })
      .concat([{ label: 'Continue →', primary: true, action: 'productsDone' }]);
  }
  function askProducts() {
    return botSays('Which products would you want early access to? **Pick as many as you like**, then tap Continue.', productChips());
  }
  function toggleProduct(value) {
    var d = session.flow.data, list = d.products || [];
    var i = list.indexOf(value);
    if (i !== -1) list.splice(i, 1);
    else if (value === 'not-sure') list = ['not-sure'];
    else { list = list.filter(function (x) { return x !== 'not-sure'; }); list.push(value); }
    d.products = list;
    setChips(productChips());
  }

  function askTimeline() {
    return botSays('When would you want to start?', TIMELINE_CHOICES.map(function (c) { return { label: c.label, value: c.value }; }));
  }
  function first(name) { return String(name).split(/\s+/)[0]; }
  function labelFor(list, v) { var x = list.filter(function (c) { return c.value === v; })[0]; return x ? x.label : v; }

  // ---- Simple sum check, asked in the chat --------------------------------------------
  function askSum(prefix) {
    var f = session.flow;
    var a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
    f.sum = a + b; f.step = 'captcha'; persist();
    botSays((prefix || 'Last step, so I know you\'re a person: ') + 'what is **' + a + ' + ' + b + '**?', ['Cancel']);
  }

  function mailtoFor(f) {
    var d = f.data;
    var subj = (f.type === 'eap' ? 'EAP interest: ' : 'Question: ') + (d.company || d.name);
    var body = ['Name: ' + d.name, 'Email: ' + d.email, 'Company: ' + (d.company || '')];
    if (f.type === 'eap') body.push('Products: ' + productLabels(d.products), 'Start: ' + labelFor(TIMELINE_CHOICES, d.timeline || ''), 'Business problem: ' + (d.challenge || ''));
    else body.push('Question: ' + [d.topic, d.message].filter(Boolean).join(' / '));
    return 'mailto:' + CONFIG.inboxEmail + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body.join('\n'));
  }

  function sendFailed(reason) {
    if (window.console) console.warn('[EMIE] send failed:', reason);
    var f = session.flow;
    if (!f) return;
    f.step = 'retry'; persist();
    botSays('That didn\'t go through, sorry. Tap **Try again**, or send it as an email from your own inbox. I\'ve written it for you.',
      [{ label: 'Try again', primary: true, action: 'retry' }, { label: 'Email it instead', action: 'mailto', href: mailtoFor(f) }, 'Cancel']);
  }

  function confirmAndSend() {
    var f = session.flow;
    if (!f) return;
    var d = f.data;
    f.step = 'sending'; persist();
    botSays('Sending…', [], function () {
      send(f).then(function () {
        prefs.submitted = true; persistPrefs();
        save(ss, 'emie-lead', { name: d.name, email: d.email, company: d.company, products: d.products, timeline: d.timeline, challenge: d.challenge });
        session.flow = null; persist();
        if (f.type === 'eap') {
          var firstP = (d.products || []).filter(function (x) { return x !== 'not-sure'; })[0];
          var href = CONFIG.eapUrl + (firstP ? '?product=' + firstP : '');
          botSays('Done, ' + first(d.name) + '. The team has your interest in **' + productLabels(d.products) + '** and will reply to ' + d.email + ' from a pravadhlabs.com address.\n\nWant to move to the front of the review? The [full application](' + href + ') takes two minutes, and I\'ve filled in what you already told me.',
            [{ label: 'Open the full application', primary: true, action: 'goEap', href: href }, 'What do you build?']);
        } else {
          botSays('Sent. Thanks, ' + first(d.name) + '. Someone from the team will reply to ' + d.email + ' soon. Anything else in the meantime?', CHIPS_MAIN);
        }
      }).catch(function (e) { sendFailed(e && e.message); });
    });
  }

  // ---- Sending ---------------------------------------------------------------------
  function send(f) {
    var d = f.data;
    var attr = window.PravadhAttribution && window.PravadhAttribution.get ? window.PravadhAttribution.get() : null;
    var source = attr ? attr.source : 'website';
    var pages = session.pages.map(function (p) { return '  • ' + (p.title || p.path) + ' (' + p.path + ') ' + p.at.slice(11, 16) + ' UTC'; }).join('\n');
    var asked = session.msgs.filter(function (m) { return m.who === 'me' && !m.f; }).map(function (m) { return '  • ' + m.text; }).slice(-25).join('\n');
    var isEap = f.type === 'eap';
    var subject = (isEap ? '[EMIE · EAP interest] ' : '[EMIE · Website question] ') + (d.company || d.email) + ' (' + source + ')';
    var lines = [
      isEap ? 'A website visitor asked EMIE about the Early Access Program.' : 'A website visitor sent a question through EMIE.',
      '',
      'Name: ' + d.name,
      'Email: ' + d.email,
      'Company: ' + (d.company || '—')
    ];
    if (isEap) {
      lines.push('Products: ' + productLabels(d.products));
      lines.push('Start: ' + labelFor(TIMELINE_CHOICES, d.timeline || '—'));
      lines.push('Business problem: ' + (d.challenge || '—'));
    } else {
      lines.push('Question: ' + ([d.topic, d.message].filter(Boolean).join(' / ') || '—'));
    }
    lines.push('', 'Lead source: ' + source + (attr && attr.first_source ? ' (first touch: ' + attr.first_source + ')' : ''));
    lines.push('Sent from page: ' + location.pathname);
    lines.push('', 'Pages viewed this visit:', pages || '  —');
    lines.push('', 'What they typed in the chat:', asked || '  —');
    if (isEap) lines.push('', 'Not yet a full EAP application unless one arrives from the EAP form.');

    // Netlify Forms: urlencoded POST to the site root. Field names match the hidden form in index.html.
    var body = new URLSearchParams();
    body.append('form-name', CONFIG.netlifyForm);
    body.append('subject', subject);
    body.append('type', isEap ? 'EAP interest' : 'Question');
    body.append('name', d.name);
    body.append('email', d.email);
    body.append('company', d.company || '');
    body.append('lead_source', source);
    body.append('message', lines.join('\n'));
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return { ok: true };
    });
  }

  // ---- Prefill the EAP form with what the visitor told EMIE -------------------------
  function prefillEap() {
    var f = document.getElementById('eapForm');
    var lead = ss && load(ss, 'emie-lead');
    if (!f || !lead) return;
    function setIf(name, val) { var x = f.elements[name]; if (x && !x.value && val) x.value = val; }
    setIf('fullName', lead.name);
    setIf('email', lead.email);
    setIf('company', lead.company);
    setIf('timeline', lead.timeline);
    setIf('challenge', lead.challenge);
    (lead.products || (lead.product ? [lead.product] : [])).forEach(function (v) {
      var box = f.querySelector('input[name="products"][value="' + v + '"]');
      if (box) box.checked = true;
    });
  }

  // ---- Boot ------------------------------------------------------------------------
  function boot() {
    build();
    session.msgs.forEach(renderMsg);
    renderChips();
    if (session.flow && session.flow.step === 'sending') session.flow.step = 'retry';
    if (session.open && window.innerWidth > 600) {
      root.classList.add('is-open');
      launch.setAttribute('aria-expanded', 'true');
      setTimeout(scrollDown, 30);
    } else {
      session.open = false;
    }
    scheduleTeaser();
    if (ON_EAP) prefillEap();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
