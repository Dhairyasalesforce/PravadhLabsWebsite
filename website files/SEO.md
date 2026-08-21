# Pravadh Labs — SEO Optimization Guide

This document covers what is already implemented in the site and recommended next steps for search visibility.

## Implemented (technical SEO)

### Crawling & indexing
- `robots.txt` — allows all pages, points to sitemap
- `sitemap.xml` — all 7 public pages with priority and changefreq
- `<meta name="robots" content="index, follow, max-image-preview:large">` on every page
- Canonical URLs on each page (`<link rel="canonical">`)

### Meta & social
- Unique `<title>` and `<meta name="description">` per page (keep titles under 60 chars, descriptions 150–160 chars)
- Open Graph tags: `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `og:image`
- Twitter Card tags: `summary`, title, description, image
- Shared OG image: `/assets/og-image.svg` (export a **1200×630 PNG** for LinkedIn/Facebook — they do not reliably support SVG)

### Structured data (JSON-LD)
- **Homepage:** `Organization`, `WebSite`, `SoftwareApplication` (PravadhIQ)
- **About:** Organization details
- **Products:** product-focused schema (extend with `Product` / `SoftwareApplication` per SKU)
- **Contact:** `ContactPage` + Organization contactPoint
- **Insights:** `Blog` / `CollectionPage`

### Performance & UX (ranking signals)
- `font-display: swap` via Google Fonts
- Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`
- Reduced motion support (`prefers-reduced-motion`)
- Mobile viewport, touch targets ≥ 44px, no horizontal scroll
- Semantic HTML: `<main>`, `<header>`, `<footer>`, skip link, ARIA labels

### Content signals
- One H1 per page
- Descriptive alt text on key SVGs / images
- Internal linking via nav + footer (Insights before Contact)
- Keyword-rich copy on homepage meta (Salesforce, deployment, migration, governance)

---

## Recommended next steps

### High impact
1. **Export OG PNG** — Convert `assets/og-image.svg` to `assets/og-image.png` (1200×630) and update meta tags.
2. **Google Search Console** — Verify domain, submit sitemap, monitor Core Web Vitals.
3. **Page-specific keywords** — Tune each page’s title/description:
   - Products: “PravadhIQ & GovernX | Salesforce Control Plane”
   - Security: “Enterprise Security & Compliance | Pravadh Labs”
   - Compare: “PravadhIQ vs Alternatives | Salesforce DevOps”
4. **Blog post schema** — When Insights loads posts, inject `Article` JSON-LD per post (headline, datePublished, author, image).
5. **HTTPS + HSTS** — Ensure production serves only HTTPS with redirect.

### Medium impact
6. **BreadcrumbList** schema on inner pages (Products → PravadhIQ).
7. **FAQ schema** on Security or Products if you add FAQ sections.
8. **LocalBusiness** schema for Ahmedabad / Bengaluru / Jaipur offices on Contact.
9. **hreflang** — Only if you add localized pages later.
10. **Lazy-load** below-fold images on Insights when post thumbnails exist.

### Content & links
11. Publish Insights regularly (2–4 posts/month) targeting long-tail queries:
    - “Salesforce deployment best practices”
    - “Data migration governance checklist”
    - “RevOps control plane”
12. Build backlinks from Salesforce community, Dreamin events, partner pages.
13. Add a `/llms.txt` or concise `/about` summary for AI crawlers (optional, emerging practice).

### Analytics
14. Add privacy-conscious analytics (Plausible, Fathom, or GA4 with consent banner if required).
15. Track conversions: Contact form submits, “Explore products” clicks.

---

## Per-page checklist

| Page | Title length | Meta description | Schema | Notes |
|------|-------------|------------------|--------|-------|
| Home | ✓ | ✓ | Organization, WebSite, SoftwareApplication | Primary landing |
| Products | ✓ | ✓ | Add Product ×2 | Anchor IDs `#pravadhiq`, `#governx` |
| Compare | ✓ | ✓ | — | Table content is indexable |
| Security | ✓ | ✓ | — | Good for trust queries |
| About | ✓ | ✓ | Organization | Team/story content |
| Insights | ✓ | ✓ | Blog | Dynamic posts need Article schema |
| Contact | ✓ | ✓ | ContactPage | NAP consistency |

---

## NAP consistency (Name, Address, Phone)

Use identical formatting everywhere:
- **Name:** Pravadh Labs Private Limited
- **Email:** inquire@pravadhlabs.com
- **Phone:** +91-9998525192
- **URL:** https://pravadhlabs.com

---

## Files added for SEO

```
robots.txt
sitemap.xml
assets/og-image.svg
```

Update sitemap `lastmod` dates when you deploy significant content changes.
