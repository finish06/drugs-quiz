# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

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
