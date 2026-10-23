/* Pravadh Labs — lead source attribution (internal).
 *
 * Works out where a visitor came from and remembers it for 90 days, so a
 * form submitted later (e.g. the EAP application) can tell Pravadh SI the
 * lead's Source. Nothing here is shown to the visitor.
 *
 * How the source is decided (most explicit wins):
 *   1. ?src=<slug>            — our own tagged links, e.g. ?src=linkedin
 *   2. ?utm_source=...        — standard UTM tags (mapped to known sources)
 *   3. ?gclid / ?li_fat_id    — Google Ads / LinkedIn Ads click IDs
 *   4. utm_medium=email       — email campaigns
 *   5. document.referrer      — linkedin.com, google.*, webmail hosts
 *   6. nothing                — "website" (direct / organic site visit)
 *
 * A new explicit touch (1–5) overwrites the stored one; a plain direct visit
 * never overwrites an earlier tagged visit. The first touch is also kept.
 */
(function (global) {
  var KEY = 'pravadh-attr-v1';
  var TTL_MS = 90 * 24 * 60 * 60 * 1000;
  var SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,29}$/;

  function normalise(value) {
    var v = String(value || '').toLowerCase().trim();
    if (!v) return '';
    if (/linkedin|lnkd/.test(v)) return 'linkedin';
    if (/google|adwords|gads/.test(v)) return 'google';
    if (/^e-?mail$|newsletter|mailchimp|brevo|sendgrid|mailer|outreach/.test(v)) return 'email';
    if (/^(website|site|web|direct|pravadhlabs(\.com)?)$/.test(v)) return 'website';
    v = v.replace(/[^a-z0-9_-]/g, '');
    return SLUG_RE.test(v) ? v : '';
  }

  function fromUrl() {
    var p;
    try { p = new URLSearchParams(global.location.search); } catch (e) { return null; }
    var raw = p.get('src') || p.get('source') || p.get('utm_source') || '';
    var source = normalise(raw);
    if (!source && p.get('gclid')) source = 'google';
    if (!source && p.get('li_fat_id')) source = 'linkedin';
    if (!source && String(p.get('utm_medium') || '').toLowerCase() === 'email') source = 'email';
    if (!source) return null;
    return {
      source: source,
      raw: raw || null,
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
      utm_content: p.get('utm_content'),
      utm_term: p.get('utm_term'),
      gclid: p.get('gclid'),
      landing_page: global.location.pathname,
      referrer: document.referrer || null,
      at: Date.now()
    };
  }

  function fromReferrer() {
    var ref = document.referrer;
    if (!ref) return null;
    var host;
    try { host = new URL(ref).hostname.toLowerCase(); } catch (e) { return null; }
    if (host === global.location.hostname) return null;
    var source = '';
    if (/linkedin\.com$|lnkd\.in$/.test(host)) source = 'linkedin';
    else if (/(^|\.)google\.[a-z.]+$/.test(host)) source = 'google';
    else if (/mail\.|outlook\.|webmail/.test(host)) source = 'email';
    if (!source) return null;
    return { source: source, raw: host, referrer: ref, landing_page: global.location.pathname, at: Date.now() };
  }

  function read() {
    try {
      var data = JSON.parse(global.localStorage.getItem(KEY) || 'null');
      if (data && data.last && Date.now() - data.last.at < TTL_MS) return data;
    } catch (e) { /* storage blocked or corrupt */ }
    return null;
  }

  function write(data) {
    try { global.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  var memory = read();
  var touch = fromUrl() || fromReferrer();
  if (touch) {
    memory = { first: (memory && memory.first) || touch, last: touch };
    write(memory);
  }

  global.PravadhAttribution = {
    /** Returns { source, first_source, detail } for a form submission. */
    get: function () {
      var data = memory || read();
      var last = data && data.last;
      var first = data && data.first;
      return {
        source: last ? last.source : 'website',
        first_source: first ? first.source : (last ? last.source : 'website'),
        detail: {
          last_touch: last || null,
          first_touch: first || null,
          submitted_from: global.location.pathname,
          referrer: document.referrer || null
        }
      };
    }
  };
})(window);
