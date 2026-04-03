# Session Handoff
**Written:** 2026-04-03

## In Progress
- Nothing actively in progress. Production is live.

## Completed This Session
- **Production deployed** — rxdrill.com is live on GCP Compute Engine (e2-micro)
- **GCP instance created** — `rxdrill-prod` in us-central1-a, firewall rules for HTTP/HTTPS
- **Production configs** — docker-compose.prod.yml, nginx-prod.conf, .env on instance
- **Changelog notification** — What's New panel with build-time CHANGELOG.md parser (cycle 11)
- **Hardcoded URLs removed** — all URLs config-driven via VITE_APP_URL / APP_URL
- **CHANGELOG.md rewritten** — customer-facing language for all entries
- **14 specs marked Complete** — all shipped features updated
- **Release workflow updated** — SSH deploy to production on version tags, BFF image push added
- **nginx-staging.conf** — committed to repo (was only on VM)

## Decisions Made
- Production on GCP e2-micro (free tier eligible, cheapest option)
- Postgres in docker-compose stack (no Cloud SQL — cost savings)
- TLS via external proxy (Cloudflare or similar)
- docker-compose.prod.yml ports updated to 80:80 and 443:443
- Production domain: rxdrill.com

## Blockers
- None — production is running

## Next Steps
1. **GitHub secrets** — add PROD_HOST, PROD_USER, PROD_SSH_KEY for automated deploys
2. **GitHub environment** — create "production" environment with required reviewers
3. **DNS verification** — confirm rxdrill.com resolves correctly
4. **Manual QA on production** — test OAuth login, quiz flow, share links, What's New panel
5. **Tag v0.5.1** — first production release tag to test the release workflow
6. **Plan M6** — remaining specs for pwa-offline, exam-countdown, school-leaderboards
