# Roadmap Proposal — Agent 1: UX/Product Lead

**Role:** Head of Product at an edtech startup focused on pharmacy exam prep
**Date:** 2026-03-19

---

## Observations on the Current State

The MVP is clean and functional. Three quiz types, dark mode, lazy loading — the bones are right. But the product has a conversion problem hidden under the surface: there is no reason for a user to return tomorrow. A pharmacy student lands, answers 10 questions, sees "70% — Good work!", and... closes the tab. We've built a quiz machine, not a study tool.

The gap between what exists and what pharmacy students actually need is not more quiz types. It's feedback loops, context, and a sense of progress over time. Every successful edtech product — Duolingo, Anki, Osmosis — earns daily usage through the same mechanisms: spaced repetition driven by personal performance data, meaningful feedback in the moment (not just correct/incorrect), and the feeling that the app knows where you are in your journey.

Right now, drugs-quiz treats every session as if the user has never opened the app before. That is the core product gap.

---

## 10 UX/Product Improvement Ideas

### 1. Answer Review Mode — "What Did I Get Wrong?"
After a quiz, the results screen only shows which question numbers were correct (green/red dots). It does not show users what the correct answer was for questions they missed. A post-quiz review screen that walks through each missed question with the correct answer and a one-sentence explanation (e.g., "Metformin belongs to Biguanides — it works by reducing hepatic glucose output") would dramatically improve learning outcomes. This is table stakes for any educational tool.

### 2. Spaced Repetition via localStorage — "Your Weak Spots"
Track which drugs a user consistently gets wrong across sessions (stored in localStorage, no account required). Surface a "Focus Mode" that over-indexes on known weak areas. When a user gets atorvastatin wrong three sessions in a row, the app knows. It should ask about it again tomorrow. This is the single highest-leverage learning intervention available without user accounts.

### 3. Exam Mode — NAPLEX/PTCE Simulation
Create a curated, timed quiz mode that mirrors actual exam conditions: 25 questions, 45-minute timer, no feedback during the session, results only at the end. NAPLEX and PTCE are the explicit motivation for the primary user segment. Give them something that feels like the real thing. This also gives the product a clear differentiator in a crowded flashcard/Quizlet market.

### 4. Drug Class Deep Dives — Contextual Learning Cards
When a user gets a question wrong (or right), show a lightweight info card: what class this drug belongs to, 2-3 other drugs in the same class, and a memory hook (e.g., "-statin suffix = HMG-CoA reductase inhibitor"). This transforms a quiz from a pure test into an active learning moment. Context at the point of failure is when memory consolidation is highest.

### 5. Daily Streak and Minimum Viable Habit
A streak counter (1 day, 7 days, 30 days) and a daily minimum of just 5 questions to count as "done for the day." Not gamification for its own sake — habit formation for an audience with a high-stakes exam on the horizon. The daily minimum is intentionally low to reduce friction on busy clinical rotation days. The streak is the accountability mechanism that fills the return-usage gap in current success metrics.

### 6. "Quick 5" Home Screen Entry Point
The current config screen requires three decisions before starting (quiz type + question count + Start button click). Add a single "Quick 5" button that launches a 5-question randomized mix of all quiz types with a single tap. Lower the activation energy for short study sessions between classes. This is the mobile-first pattern that Duolingo uses ("just one lesson") and it drives the highest engagement frequency.

### 7. Drug Name Pronunciation Guide
Pharmacy students struggle to connect written drug names to their spoken form. Add phonetic pronunciations alongside drug names during questions and in post-quiz review (e.g., "atorvastatin — ah-TOR-va-sta-tin"). This is high-value, low-cost — the pronunciation data can be seeded statically for the top 200 NAPLEX drugs. It differentiates from every other digital flashcard tool on this metric alone.

### 8. Session History and Personal Best Tracking (localStorage)
Store the last 10 session results in localStorage: date, quiz type, score, question count. Surface a simple "Your recent sessions" view on the home screen. Show a personal best per quiz type. This gives users a sense of trajectory without requiring accounts. It also primes the M3 user account feature — when accounts ship, offer to "sync your history to the cloud."

### 9. Onboarding Flow — "Where Are You in Your Studies?"
A first-run experience that asks two questions: (1) Are you studying for NAPLEX, PTCE, or refreshing general knowledge? (2) When is your exam? Use these answers to customize the home screen (recommended quiz types, daily goal) and show a countdown to exam day. This is not a blocker to the core quiz — it's a 20-second modal that dramatically increases the app's perceived relevance to each user's specific situation.

### 10. Share Your Score — Social Proof Without Accounts
After completing a quiz, generate a shareable image or link (e.g., "I scored 90% on Brand/Generic Match on drugs-quiz — try it!") with a pre-composed Twitter/X, iMessage, or clipboard copy action. Pharmacy students are a tight professional community. Organic social sharing from a study tool is a real acquisition channel. No accounts required — the share card is generated client-side.

---

## 4-Milestone Roadmap

The 10 ideas above are not equal. I am proposing a roadmap organized by the primary value driver at each stage:

**Stage 1: Close the Learning Loop** (without accounts)
**Stage 2: Build the Habit** (engagement mechanics)
**Stage 3: Go Social** (accounts + sharing)
**Stage 4: Go Native** (PWA + mobile distribution)

---

### M3: Close the Learning Loop
**Goal:** Turn a quiz machine into a study tool. Users should leave every session having learned something, not just having been tested.

**Why this matters:** The current results screen shows a score. It does not teach. The highest-value intervention in any edtech product is feedback at the moment of failure. Users who understand *why* they got something wrong retain it. Users who only know they got it wrong do not.

**Features:**
- **Answer Review Mode** (Idea #1) — Post-quiz review of all questions, with correct answers revealed and one-sentence drug class context for each wrong answer. Walk through missed questions with "What you answered → What was correct → Why."
- **Drug Class Context Cards** (Idea #4) — After answering (right or wrong), show a lightweight card: drug class, 2-3 sibling drugs in the same class, and a suffix/pattern memory hook where applicable.
- **Session History via localStorage** (Idea #8) — Store last 10 sessions (date, type, score) in localStorage. Show "Recent Sessions" on the home screen. Show personal best per quiz type. No backend required.

**Success criteria:** Users consistently answer more than 10 questions per session (current PRD target). Post-quiz review is the primary navigation action after completing a quiz (measurable via future analytics).

---

### M4: Build the Habit
**Goal:** Get users to return daily. A pharmacy student preparing for NAPLEX needs 60–90 days of consistent practice. The app must become a daily habit before the exam, not a last-minute cram tool.

**Why this matters:** The PRD success metric of "return within 7 days" is critically important and currently unaddressed. Without habit mechanics, return usage depends entirely on the user's intrinsic motivation. That works for 20% of users. Habit design works for 80%.

**Features:**
- **Daily Streak + Daily Minimum** (Idea #5) — Track consecutive days with at least one 5-question session. Show streak on home screen. Gentle daily nudge (browser notification, opt-in). The minimum is 5 questions — low enough for a busy rotation day.
- **Spaced Repetition via localStorage** (Idea #2) — Track drugs a user consistently gets wrong. Surface a "Focus Mode" quiz that over-indexes on weak areas. When a user answers the same drug incorrectly in 2+ sessions, prioritize it in future questions.
- **"Quick 5" Entry Point + Onboarding** (Ideas #6 + #9) — Add a one-tap "Quick 5" button for fast sessions. Add a 20-second first-run onboarding that captures exam date and target (NAPLEX/PTCE) to show a countdown and personalize the home screen.

**Success criteria:** 30%+ of users who complete a first session return within 7 days (measurable once analytics added). Average sessions per user per week reaches 3+.

---

### M5: Go Social (User Accounts + Leaderboards)
**Goal:** Add the social layer that transforms a solo study tool into a community study platform. Google OAuth accounts unlock history sync, leaderboards, and competitive motivation.

**Why this matters:** Pharmacy programs are cohort-based. Students in the same program study together, compete in a healthy way, and motivate each other. A leaderboard within a cohort (or nationally) is a retention multiplier. Accounts also enable the "sync your localStorage history to the cloud" migration story already set up by M3/M4.

**Features:**
- **Google OAuth / User Accounts** (PRD M3) — Sign up with Google. All session history and spaced repetition data syncs to the cloud. Returning users on a new device pick up where they left off.
- **Score Sharing** (Idea #10) — Shareable score cards (client-side generated image or pre-composed link). "I scored 90% on Brand/Generic Match — try it!" Post-quiz share button. Drives organic acquisition.
- **Leaderboards** (PRD M5) — Weekly leaderboard by score and by streak. Optional: filter by exam type (NAPLEX vs. PTCE cohorts). Opt-in only — no surprise public rankings.

**Success criteria:** 20%+ of active users sign up for an account within 30 days of account launch. Share button is tapped by 10%+ of users who complete a quiz.

---

### M6: Go Native (PWA + Exam Mode + Distribution)
**Goal:** Make drugs-quiz the app pharmacy students install, not just visit. PWA installation removes the browser overhead and positions the app for App Store distribution via Capacitor.

**Why this matters:** Mobile is where pharmacy students study — between patient encounters, on public transit, in the library. A PWA that lives on the home screen with offline support competes directly with the flashcard apps (Quizlet, AnkiDroid) that currently own this space. Exam Mode is the feature that gets word-of-mouth from faculty recommending it to students.

**Features:**
- **PWA Manifest + Service Worker + Offline Support** (PRD M6) — Installable from the browser. Cached drug data enables offline quiz sessions. Push notifications for daily streak reminders (opt-in).
- **Exam Mode — NAPLEX/PTCE Simulation** (Idea #3) — 25-question timed session (45 minutes). No mid-session feedback. Results-only at the end. Question bank weighted toward high-yield NAPLEX/PTCE drugs. This is the flagship feature for faculty and student word-of-mouth.
- **Capacitor iOS Wrap** (PRD M6) — Package the PWA as a native iOS app. Submit to App Store. Unlocks the distribution channel where pharmacy students already discover apps.

**Success criteria:** App Store submission and approval. 100+ installs in first 30 days. Exam Mode completion rate >60% (users who start finish it).

---

## Key Bets

1. **localStorage before accounts.** Spaced repetition, session history, and streaks do not require a backend. Shipping them in M3/M4 proves the value proposition before investing in OAuth infrastructure. It also creates a natural "upgrade path" narrative for account sign-up.

2. **The "Why" matters more than the "What" in results.** Every competing product shows you a score. Almost none explain the drug class pattern you missed. Drug class context cards (Idea #4) are the highest-differentiation feature at the lowest implementation cost.

3. **Exam Mode is the feature that gets word-of-mouth.** Faculty recommend tools to students. A polished, realistic NAPLEX simulation is the feature a clinical pharmacist sends to their students on a Slack or WhatsApp group. It earns trust from the credential-conscious audience in a way that a general quiz never does.

4. **Habit beats content.** The depth of the drug database is the tech team's instinct to expand. The right product instinct is to go deep on habits first. A user who returns 30 days in a row with 200 drugs will outperform a user who sessions once with 2,000 drugs.
