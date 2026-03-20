# Growth & Market Proposal — drugs-quiz
**Agent 3: Growth and Market Strategist**
**Date:** 2026-03-19

---

## Market Framing

The pharmacy exam prep market is dominated by well-funded incumbents: RxPrep ($300+ courses), Pharmacy Exam (passive flashcards), and generic tools like Quizlet and Anki that pharmacy students repurpose. None of them are built mobile-first, quiz-native, and FDA-data-powered. drugs-quiz has a genuine moat — real FDA/DailyMed data, three smart quiz modalities, and zero cost to the user. The growth strategy should exploit that moat aggressively before incumbents wake up.

The two biggest leverage points are: (1) the pharmacy student community is dense, concentrated, and highly referral-driven — they study in cohorts and share tools obsessively on Reddit, Discord, and school Slack groups, and (2) NAPLEX/PTCE exam cycles create predictable urgency spikes that can be amplified with timely acquisition campaigns.

---

## 10 Growth and Market Improvements

### 1. Shareable Score Cards (Viral Loop Engine)
After each quiz session, generate a shareable result card — a styled PNG or OG-ready URL — showing the user's score, quiz type, and a subtle "practice at drug-quiz.calebdunn.tech" CTA. Students love flex-posting their prep progress on Reddit (r/pharmacy, r/PharmacyStudents) and Instagram stories. This is the lowest-cost viral loop available. Zero engineering cost relative to distribution value. Quizlet doesn't do this for quiz results. RxPrep doesn't do this at all.

### 2. Spaced Repetition Engine (Retention + Return Visits)
Replace random question selection with a lightweight spaced repetition algorithm (SM-2 or similar). Track which drugs each user gets wrong and surface them more frequently. This directly attacks the #1 retention problem: users who feel "good enough" after one session never return. SR gives them a reason to come back every day. It also creates a natural hook for user accounts — your repetition schedule needs to persist somewhere. This is the single highest-retention feature in the entire product.

### 3. Exam Countdown Mode ("NAPLEX in 14 days")
Let users set an exam date. The app reconfigures itself: it shows a daily question quota, tracks progress toward exam readiness, and sends daily reminder push notifications (PWA) or emails. Urgency is the most powerful motivator in exam prep. Kaplan and RxPrep monetize this with structured 30/60/90-day courses. drugs-quiz can offer the same urgency loop for free and capture users who can't afford $300 courses.

### 4. Instructor/Professor Sharing Tools (B2B2C Channel)
Pharmacy school instructors are the most underrated distribution channel in this market. A professor who shares a quiz link to 120 students is worth more than 120 individual acquisition campaigns. Build a simple "class share" feature: instructors create a shareable quiz link pre-configured for a specific drug class or topic (e.g., "Beta-Blockers Quiz — Chapter 14"). No account needed for students. This is a zero-friction B2B2C wedge that compounds every semester.

### 5. Weekly "Drug of the Week" Email (Organic Retention + SEO)
A lightweight email digest: one drug, its class, brand/generic pair, and a 3-question mini-quiz link. Low production cost, high perceived value. The email drives repeat visits from lapsed users (classic retention email playbook). The landing page for each "Drug of the Week" becomes an SEO target — "metformin brand name quiz," "lisinopril drug class practice." This stacks on top of the existing SEO foundation from M2 and compounds over 52 weeks.

### 6. Leaderboard with School Affiliation (Social + Network Effects)
When leaderboards ship, allow users to affiliate with their pharmacy school. Show both a global leaderboard and a school-specific one. "Top at University of Florida College of Pharmacy" is far more motivating than "Top 500 globally." School affiliation creates network effects: students recruit classmates to climb the school ranking. This is how Duolingo's league system drives DAU — competition at a peer-group level, not abstract global competition. It also opens a future channel for direct outreach to pharmacy programs.

### 7. PWA + Home Screen Installation Campaign (Mobile Retention)
The current tech stack supports PWA. But shipping PWA is only half the job — the install prompt needs to be surfaced at the right moment (after a successful quiz session, not on first load) with the right framing ("Add to Home Screen for daily practice"). Mobile-first is table stakes for the 18-25 demographic. Users who install the PWA have 3-5x higher 30-day retention than web-only users across every edtech product. This is a known mechanic — execute it deliberately.

### 8. Performance Benchmarking by Drug Class ("How do you compare?")
After a quiz session on a specific drug class (e.g., ACE inhibitors), show how the user scored relative to all users who took the same quiz. "You scored 8/10 — better than 73% of people who practiced this class." This is social proof + competitive motivation without requiring a full leaderboard. It also surfaces as a natural CTA for account creation ("Create an account to track your improvement over time"). Anonymous aggregate benchmarking requires no user accounts to implement.

### 9. Targeted Reddit + Discord Community Seeding
r/pharmacy (340K members), r/PharmacyStudents, and pharmacy Discord servers are extremely high-intent acquisition channels. A genuine, non-spammy presence — answering questions, sharing the app when relevant, posting "I built this free NAPLEX quiz tool" — consistently outperforms paid acquisition for niche edtech tools with no marketing budget. This is an ops play, not an engineering play, but it belongs in the roadmap because it needs to be timed with feature launches (especially leaderboards and school affiliation) to maximize conversion.

### 10. Freemium Tier with "Pro" Unlock (Monetization Foundation)
The current product is entirely free. That's correct for acquisition but leaves money on the table. A Pro tier ($4.99/month or $29/year) unlocks: spaced repetition history, exam countdown mode, advanced analytics, and ad-free experience. Free tier remains generous — all quiz types, unlimited sessions, no account required. The pricing targets students who are already spending $300+ on RxPrep courses: $5/month is a rounding error. This also creates the financial runway to sustain the drug-gate API and infrastructure costs long-term.

---

## 4-Milestone Growth Roadmap

### Milestone A: Retention Flywheel
**Goal:** Turn one-time visitors into daily active users before investing in acquisition.
**Market Justification:** There is no point driving traffic to a product with low return rates. Fix retention first, then pour fuel on acquisition. The PRD's own success metric is "return within 7 days" — this milestone directly attacks it. The existing codebase is technically ready; this is purely a product investment.

**Features:**
1. **Spaced Repetition Engine** — Weight missed drugs to surface them more frequently. Store the repetition schedule in localStorage for anonymous users; migrate to server-side when accounts ship. This is the highest-leverage retention mechanic available.
2. **PWA Install Prompt (Deliberate)** — Surface the "Add to Home Screen" prompt after a completed quiz session with clear framing. Pair with a service worker for offline quiz capability using cached drug data.
3. **Performance Benchmarking ("How do you compare?")** — Show anonymous aggregate percentile after each session. Requires no accounts. Creates social proof and a natural upsell hook for future account features.

---

### Milestone B: Viral Acquisition Loop
**Goal:** Make every quiz session a distribution event. Get to 1,000 organic monthly active users before considering paid spend.
**Market Justification:** The pharmacy student community is tight-knit and highly referral-driven. Tools spread through Reddit, Discord, and school group chats faster than any paid channel. Shareable score cards and instructor tools exploit this network effect without a marketing budget. This milestone also builds the SEO content surface that compounds over time.

**Features:**
1. **Shareable Score Cards** — Auto-generate a styled result card (OG-image or share URL) after each session. One-tap share to Reddit, Twitter/X, or copy link. The card includes score, quiz type, and app CTA.
2. **Instructor Share Links** — Pre-configured quiz URLs for a specific drug class or topic. Instructors paste one link into their LMS or email. No account required for students. This is the B2B2C wedge.
3. **Weekly Drug of the Week Email + SEO Landing Pages** — A weekly digest email with a 3-question mini-quiz and a corresponding SEO-optimized landing page. Stacks on M2's SEO foundation and drives both email retention and organic search traffic.

---

### Milestone C: Social Competition Layer
**Goal:** Add school-affiliated leaderboards and exam countdown mode to drive cohort-level engagement and urgency.
**Market Justification:** Exam urgency and peer competition are the two most powerful motivators in the exam prep category. RxPrep sells structured timelines for $300. drugs-quiz can offer an urgency system and social competition layer for free, capturing the cost-sensitive student segment (which is most of the market). School leaderboards create the network effect that makes the product defensible — once a school's students are competing with each other, churn drops dramatically.

**Features:**
1. **Exam Countdown Mode** — Users set an exam date. Daily question quota, readiness progress bar, PWA push notification reminders. Positions the app as a structured study companion, not just a random quiz tool.
2. **School-Affiliated Leaderboards** — Users optionally select their pharmacy school. Leaderboard shows global rank and school rank. School rankings become a viral loop: students recruit classmates to improve their school's standing.
3. **Community Seeding Campaign (Ops)** — Timed launch of Reddit and Discord outreach to r/pharmacy, r/PharmacyStudents, and pharmacy school Discord servers, coordinated with the leaderboard feature drop for maximum conversion.

---

### Milestone D: Monetization Foundation
**Goal:** Introduce a sustainable revenue model that funds infrastructure and development without compromising the free experience for cost-sensitive students.
**Market Justification:** The drug-gate API, AWS EC2, and ongoing development have real costs. A Pro tier at $4.99/month is priced well below every incumbent (RxPrep at $25+/month, Kaplan at $300+ one-time). Students who are already investing in exam prep view $5/month as negligible. Monetization also enables paid acquisition in Year 2 — something no free-only product can sustain. The freemium model should launch only after retention (Milestone A) and acquisition (Milestone B) are proven, so there is a real user base to convert.

**Features:**
1. **Pro Tier Paywall + Stripe Integration** — $4.99/month or $29/year. Unlocks: spaced repetition history, exam countdown, advanced session analytics, ad-free. Free tier stays generous (all quiz types, unlimited sessions, no account required for anonymous use).
2. **Advanced Analytics Dashboard (Pro)** — Accuracy trends by drug class, weakest areas, time-per-question, improvement over time. This is the "progress tracking" milestone from the PRD backlog, repositioned as a Pro differentiator rather than a free feature.
3. **Referral Program** — Pro users get a referral link. Successful referral earns one free month. Students who love the app and refer classmates become the most cost-effective acquisition channel available.

---

## Sequencing Rationale

The order is deliberate and non-negotiable from a growth perspective:

**A before B:** Driving traffic to a leaky bucket is the most common mistake in early-stage edtech. Fix retention (daily active use, return visits) before spending any effort on acquisition. The spaced repetition engine and PWA install are the foundation everything else builds on.

**B before C:** Shareable cards and instructor tools seed the user base with high-intent referral traffic. You need a real user base before leaderboards have any meaning. A leaderboard with 50 users is a ghost town; with 5,000, it's a competitive flywheel.

**C before D:** Social competition and school affiliation reduce churn significantly. You want churn as low as possible before introducing a paywall — users who are engaged in school leaderboards and exam countdowns are far more likely to convert to Pro than casual users.

**D last:** Monetization is the harvest, not the seed. Ship it after the product has earned trust and demonstrated daily value. Monetizing too early kills word-of-mouth in a community-driven market.

---

## Competitive Positioning Summary

| Competitor | Weakness | drugs-quiz Advantage |
|------------|----------|----------------------|
| Quizlet | Generic, not pharmacy-specific, no FDA data | Domain-specific, real FDA data, quiz types designed for NAPLEX/PTCE |
| RxPrep | $300+ cost, no interactive quizzing, PDF-heavy | Free, interactive, mobile-first |
| Pharmacy Exam | Static flashcards, no spaced repetition | Active recall quiz formats, spaced repetition (Milestone A) |
| Anki | Generic, requires manual deck creation, steep learning curve | Zero setup, curated drug data, no flashcard creation needed |

The defensible moat is: FDA/DailyMed data + quiz-native design + free tier + community distribution. No incumbent combines all four.
