# Milestone M6 — Compete + Go Native

**Goal:** Add the competitive layer and native iOS experience that makes drugs-quiz the default pharmacy study tool. Ship v1.0.0 to the App Store.
**Appetite:** 3-4 weeks
**Target Maturity:** Beta
**Status:** SHAPED
**Started:** TBD
**Completed:** TBD

## Hill Chart

```
capacitor-ios        ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — Capacitor wrap, deep links, App Store submission
pwa-offline          ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — service worker, cached quiz data, installable
exam-countdown       ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — NAPLEX/PTCE sim, daily quota, timer
school-leaderboards  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — peer-group competition, school affiliation
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| capacitor-ios | specs/capacitor-ios.md | SHAPED | Capacitor wrap of React SPA, OAuth deep links, App Store submission, v1.0.0 |
| pwa-offline | specs/pwa-offline.md | SHAPED | Service worker, offline quiz cache, push notifications, browser installable |
| exam-countdown | specs/exam-countdown.md | SHAPED | NAPLEX/PTCE simulation with daily quota and timer |
| school-leaderboards | specs/school-leaderboards.md | SHAPED | School affiliation, peer leaderboards, cohort competition |

## Success Criteria

- [ ] Capacitor iOS app builds and runs on simulator
- [ ] App submitted to App Store (or TestFlight at minimum)
- [ ] OAuth works via deep links in native app
- [ ] PWA installable from browser with offline quiz support
- [ ] Exam countdown mode with daily quota and timer
- [ ] School-affiliated leaderboards functional
- [ ] Exam mode completion rate >60%
- [ ] v1.0.0 tagged and released
- [ ] No regression in existing test suite

## Dependencies

- M5 complete (accounts, shareable scores, database)
- Apple Developer Program enrollment ($99/year)
- Google Cloud Console OAuth redirect URI for native (custom URL scheme)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App Store review rejection | Medium | High | Follow Apple HIG, submit to TestFlight first, iterate on feedback |
| OAuth deep link complexity | Medium | Medium | Capacitor has well-documented deep link plugins; arctic supports custom schemes |
| Offline data staleness | Low | Medium | Cache recent quiz data with TTL, show "last updated" timestamp |
| Leaderboard gaming/abuse | Low | Medium | Rate limiting on score submission, server-side validation |
| Push notification opt-in rates | Medium | Low | Defer push to post-launch; focus on PWA + native experience first |

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
