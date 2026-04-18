# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

## [0.6.1] - 2026-04-18

### Added
- **Achievement Badges** — Earn badges for quiz milestones: First Quiz, Perfect Score, Class Master, Centurion (100 questions), and Streak Seeker (7-day streak)
- **Badges Page** — View all earned and locked badges with criteria from the user menu
- **Recent Badges Widget** — See your latest badges on the progress dashboard
- **Badge Notifications** — Toast celebration when you earn a new badge
- **Badge Analytics** — Track badge views and unlocks via Umami

### Fixed
- **Session Saving** — Quiz sessions now correctly save to the database for authenticated users (AuthProvider was rendering below hooks instead of above them)
- **Badge Unlocking** — Badge evaluation now triggers after each quiz (requires session save to work)
- **Database Migration** — Achievements table auto-creates on startup (fixed Drizzle migration timestamp ordering)

## [0.6.0] - 2026-04-12

### Added
- **Progress Dashboard** — New "My Progress" screen with accuracy trends, streak tracking, weakest/strongest classes, and quiz type breakdown
- **Stats API** — `GET /api/stats` endpoint returns server-computed performance metrics
- **Accuracy Trend Chart** — SVG line chart with selectable time ranges (7 days, 30 days, all time)
- **Streak Tracking** — Consecutive day streak with milestone markers at 3, 7, 14, and 30 days
- **Sign-in Upgrade Prompt** — Unauthenticated users see 14-day limited stats with sign-in CTA

## [0.5.15] - 2026-04-12

### Fixed
- **Version Sync** — Changelog and health endpoints now always match the deployed version

## [0.5.14] - 2026-04-12

### Added
- **Analytics Tracking** — Quiz start events now tracked via Umami for usage insights

### Fixed
- **Quiz Question Quality** — Filtered allergens, homeopathic remedies, vaccines, and insect extracts from quizzes (fire ant, pollen, nosodes, etc.)
- **Perfect Score Confetti** — Fixed confetti animation not firing on 100% scores
- **Dark Mode Quiz Answers** — Improved answer button styling in dark mode
- **Matching Quiz Dark Mode** — Fixed result color contrast in dark mode

## [0.5.13] - 2026-04-11

### Added
- **Keyboard Shortcut Hints** — First-time quiz takers see a helpful shortcut overlay
- **Perfect Score Confetti** — Celebrate 100% quiz scores with a confetti animation
- **Production Smoke Tests** — Daily automated health checks against production
- **Manual Release Trigger** — Workflow dispatch for hotfix redeploys

### Fixed
- **Share Page Dark Mode** — Improved dark mode styling on public share pages

## [0.5.12] - 2026-04-11

### Fixed
- **Build Pipeline** — Quality build step now receives correct URL and analytics env vars, eliminating Vite warnings

## [0.5.11] - 2026-04-11

### Changed
- **Rebrand** — All user-facing "Drug Quiz" and "Rx Quiz" references updated to "Rx Drill"

## [0.5.10] - 2026-04-05

### Added
- **Health Check** — Added `/health` and `/api/health` endpoints for monitoring with version and build info

## [0.5.8] - 2026-04-04

### Changed
- **Automated Deployments** — Production deploys are now fully automated via version tags with approval gate

### Fixed
- **Analytics** — Fixed analytics tracking for both production and staging environments
- **Security Headers** — Updated content security policy to work with Cloudflare and analytics

## [0.5.1] - 2026-04-03

### Added
- **What's New** — See what's changed with each update right inside the app
- **Production Launch** — Rx Drill is now live at rxdrill.com

### Changed
- **Config-Driven URLs** — All URLs are now set at deployment time, no hardcoded domains

## [0.5.0] - 2026-03-29

### Added
- **Google Sign-In** — Sign in with your Google account to sync quiz history across devices
- **Cloud Quiz History** — Your quiz sessions are now saved to the cloud when signed in
- **History Sync** — First-time sign-in prompts you to sync your existing quiz history to your account
- **Shareable Score Cards** — Generate a shareable link to show off your quiz results to classmates
- **Share Pages** — Shared links show a preview of your score when posted on social media or messaging apps

### Fixed
- **Quiz Loading** — Improved reliability of quiz question loading

## [0.4.0] - 2026-03-22

### Added
- **Rx Logo** — New app logo and favicon
- **Timed Quiz Mode** — Add a countdown timer (30, 60, or 90 seconds) to any quiz
- **Question Flagging** — Bookmark questions to review later
- **Keyboard Shortcuts** — Use number keys (1-4) to answer, Enter to continue

### Fixed
- **Quiz Start** — Fixed a race condition that could cause quizzes to not start
- **Exit Confirmation** — Added confirmation dialog when exiting a quiz in progress

## [0.3.1] - 2026-03-21

### Fixed
- **Stability** — Fixed 9 bugs affecting quiz loading and error handling

## [0.3.0] - 2026-03-20

### Added
- **Answer Review** — See the correct answers with drug class context after each quiz
- **Spaced Repetition** — The app tracks which drugs you get wrong and shows them more often
- **Session History** — Your last 10 quiz sessions appear on the home screen with personal bests
- **Quick 5** — One-tap button for a fast 5-question mixed quiz

### Performance
- **Faster Quizzes** — Quiz questions now load significantly faster

## [0.2.0] - 2026-03-18

### Added
- **Dark Mode** — Automatic dark mode based on your device settings, with manual toggle
- **Loading Indicator** — See progress while quiz questions are being generated

## [0.1.0] - 2026-03-15

### Added
- **Initial Release** — Three quiz types: Name the Class, Match Drug to Class, and Brand/Generic Match
- **Quiz Configuration** — Choose your quiz type and number of questions
- **Scoring** — See your score, correct/incorrect breakdown, and percentage at the end
