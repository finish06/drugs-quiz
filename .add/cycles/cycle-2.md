# Cycle 2 — SEO & Discoverability

**Milestone:** M2 — SEO & Discoverability
**Maturity:** Alpha
**Status:** COMPLETE
**Started:** 2026-03-19
**Completed:** 2026-03-19
**Duration Budget:** ~2-3 hours (single session)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| seo-optimization | SPECCED | DONE | Agent-1 | ~2-3 hours | All 10 ACs passing, unit tests for tag presence, deployed to staging |

## Dependencies & Serialization

Single feature, no dependencies. Serial execution.

## Parallel Strategy

Single-threaded execution. One feature advancing SPECCED → DONE in one cycle.

## Validation Criteria

### Per-Item Validation
- **seo-optimization:**
  - AC-001: OG meta tags in index.html (og:title, og:description, og:image, og:url, og:type)
  - AC-002: Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image)
  - AC-003: OG banner image (1200x630 PNG) in public/
  - AC-004: robots.txt allows all crawlers, points to sitemap
  - AC-005: sitemap.xml with production URL
  - AC-006: JSON-LD WebApplication structured data
  - AC-007: Canonical URL tag
  - AC-008: Keyword-rich meta description
  - AC-009: Optimized page title
  - AC-010: Social preview renders correctly (manual verification)

### Cycle Success Criteria
- [ ] All 10 ACs implemented
- [ ] Unit tests verify tag presence in built HTML
- [ ] No regressions in existing test suite (129 tests)
- [ ] Deployed to staging
- [ ] Coverage remains >= 90%

## Agent Autonomy & Checkpoints

Alpha: High autonomy. Single-session execution. Human available for questions.

## Notes

- OG banner must be PNG (not SVG) for maximum social platform compatibility
- Canonical URL and sitemap point to production URL (drug-quiz.calebdunn.tech) even if not live yet
- SEO tags are in static HTML (not React-injected) so crawlers see them without JS
