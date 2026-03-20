# Spec: SEO Optimization

**Version:** 0.1.0
**Created:** 2026-03-19
**PRD Reference:** docs/prd.md §3 Success Metrics (Return usage), §2 Target Users
**Status:** Complete

## 1. Overview

Add comprehensive SEO and social sharing support to improve organic search discovery and link preview quality. Includes meta tags, Open Graph / Twitter Card tags, structured data (JSON-LD), a dedicated OG banner image, robots.txt, sitemap.xml, and a canonical URL tag.

### User Story

As a pharmacy student searching for exam prep tools, I want to find drugs-quiz through Google search so that I can start practicing without needing a direct link.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | `index.html` includes Open Graph meta tags (og:title, og:description, og:image, og:url, og:type) | Must |
| AC-002 | `index.html` includes Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image) | Must |
| AC-003 | A dedicated 1200x630 OG banner image exists in `public/` with app name and tagline | Must |
| AC-004 | `public/robots.txt` exists and allows all crawlers, points to sitemap | Must |
| AC-005 | `public/sitemap.xml` exists with the production URL | Must |
| AC-006 | `index.html` includes JSON-LD structured data with WebApplication schema | Must |
| AC-007 | `index.html` includes a canonical URL tag pointing to the production URL | Must |
| AC-008 | Meta description is keyword-rich, targeting: pharmacy quiz, drug quiz, NAPLEX practice, PTCE study tool, pharmacy exam prep | Must |
| AC-009 | Page title is optimized for search (concise, keyword-first) | Should |
| AC-010 | All meta tags render correctly when tested with a social preview validator | Should |

## 3. User Test Cases

### TC-001: Social link preview shows correct information

**Precondition:** App is deployed to production URL
**Steps:**
1. Copy the production URL
2. Paste into a social preview validator (e.g., opengraph.xyz or Twitter Card Validator)
3. Observe the preview card
**Expected Result:** Preview shows: title, description, and the OG banner image (1200x630)
**Screenshot Checkpoint:** tests/screenshots/seo/step-01-social-preview.png
**Maps to:** TBD

### TC-002: Google can crawl the site

**Precondition:** App is deployed, robots.txt and sitemap.xml accessible
**Steps:**
1. Navigate to `{production-url}/robots.txt`
2. Verify it returns valid robots.txt content
3. Navigate to `{production-url}/sitemap.xml`
4. Verify it returns valid XML with the production URL listed
**Expected Result:** Both files are accessible and well-formed
**Screenshot Checkpoint:** tests/screenshots/seo/step-02-robots-txt.png
**Maps to:** TBD

### TC-003: Structured data is valid

**Precondition:** App is deployed
**Steps:**
1. Open Google's Rich Results Test (or Schema.org validator)
2. Enter the production URL
3. Review the structured data output
**Expected Result:** WebApplication schema detected with name, description, applicationCategory, and operatingSystem fields
**Screenshot Checkpoint:** tests/screenshots/seo/step-03-structured-data.png
**Maps to:** TBD

### TC-004: HTML source contains all SEO tags

**Precondition:** App is built
**Steps:**
1. Open `dist/index.html` (or view page source in browser)
2. Inspect the `<head>` section
**Expected Result:** Contains: og:title, og:description, og:image, og:url, og:type, twitter:card, twitter:title, twitter:description, twitter:image, canonical link, JSON-LD script block
**Screenshot Checkpoint:** N/A (source inspection)
**Maps to:** TBD

## 4. Data Model

No new data entities. All SEO content is static HTML in `index.html` and static files in `public/`.

### Assets

| File | Type | Description |
|------|------|-------------|
| `public/og-banner.svg` | SVG | 1200x630 Open Graph banner image with app name + tagline |
| `public/robots.txt` | Text | Crawler directives, sitemap pointer |
| `public/sitemap.xml` | XML | URL listing for search engine indexing |

## 5. API Contract

N/A — no API changes. All static files.

## 6. UI Behavior

No visible UI changes. All SEO work is in the HTML `<head>` and static public files. Users see no difference; crawlers and social platforms do.

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Social preview card rendering | tests/screenshots/seo/step-01-social-preview.png |
| 2 | robots.txt accessible | tests/screenshots/seo/step-02-robots-txt.png |
| 3 | Structured data validation | tests/screenshots/seo/step-03-structured-data.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| OG image fails to load | Social platforms fall back to text-only preview — still shows title + description |
| Sitemap URL doesn't match deployed environment | Sitemap should use the production URL from config, not hardcoded |
| Search engine can't execute JavaScript | Meta tags, JSON-LD, and OG tags are in static HTML (not injected by React), so they're visible without JS execution |
| Multiple deployments (staging vs production) | Canonical URL and sitemap always point to production, regardless of where deployed |

## 8. Dependencies

- Production URL must be finalized: `https://drug-quiz.calebdunn.tech`
- Favicon SVG already exists in `public/favicon.svg` (can reference for branding consistency in OG banner)

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-19 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
