# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added
- Lazy load quiz questions — start after 2, generate rest in background
- Dark mode with OS preference detection and toggle
- Loading progress indicator for question generation
- CI Docker registry push for beta and release images
- Playwright E2E tests for quiz flow
- Quiz UI components and wire up App (QuizConfig, MultipleChoice, MatchingQuiz, QuizResults)
- useQuizSession hook for quiz state management
- Quiz question generators for all 3 quiz types
- API client with typed endpoints for drug-gate API
- Initialize drugs-quiz project with ADD methodology

### Changed
- Use same-origin proxy for API key security

### Fixed
- Lazy load: quiz starts after 2 questions instead of waiting for all
- Deduplicate drugs across questions within a session
- Randomize EPC class page selection for quiz variety
- Filter obscure non-exam-relevant drugs from quizzes
- Normalize drug name casing to title case
- Normalize card heights and add tooltips for long drug names
- Rewrite Brand/Generic generator and add error resilience
- Rewrite Name the Class generator to start from EPC classes
- Add @types/node for Docker build compatibility
- Remove useCallback to satisfy React Compiler lint

### Performance
- Add in-memory request cache to API client
- Generate quiz questions in parallel for faster loading

### Documentation
- Update CLAUDE.md and docs-manifest for dark mode, cache, and utils
- Mark all M1 specs Complete, document UX improvements
- Update sequence diagrams for pagination-aware generators
- Generate docs manifest, sequence diagrams, fix version drift
