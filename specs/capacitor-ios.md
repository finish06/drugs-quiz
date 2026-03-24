# Spec: Capacitor iOS Native App

**Version:** 0.1.0
**Created:** 2026-03-23
**PRD Reference:** docs/prd.md M6 (Compete + Go Native)
**Status:** Draft

## 1. Overview

Wrap the existing React SPA in a Capacitor native shell for iOS. The app bundles all frontend assets in the binary for fast load and offline-capable UI, while hitting the remote BFF API for live quiz data. Light native touches (haptics, share sheet, app badge) give it a native feel. Ship via TestFlight first, then submit to App Store for v1.0.0.

### User Story

As a pharmacy student, I want to install Rx Quiz from the App Store so that I can study on the go with a native app experience, including offline access to recently-used quiz data.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | Capacitor is initialized in the project with an `ios/` directory containing a valid Xcode project | Must |
| AC-002 | The app bundle ID is `com.calebdunn.rxquiz` and display name is "Rx Quiz" | Must |
| AC-003 | `npx cap sync` copies the Vite build output (`dist/`) into the iOS project | Must |
| AC-004 | The app loads and renders the full quiz UI in the iOS Simulator | Must |
| AC-005 | All API requests route to the production BFF (`https://drug-quiz.calebdunn.tech/api/*`) | Must |
| AC-006 | Google OAuth works via deep link: `com.calebdunn.rxquiz://auth/callback` handles the OAuth redirect | Must |
| AC-007 | The BFF `/api/auth/google` route generates the correct redirect URI based on the requesting platform (web vs native) | Must |
| AC-008 | Haptic feedback fires on correct answer (success) and incorrect answer (error) via Capacitor Haptics plugin | Should |
| AC-009 | The native share sheet is available for sharing score cards (via Capacitor Share plugin) | Should |
| AC-010 | App icon badge shows streak count (via Capacitor Badge plugin) | Should |
| AC-011 | Recently-used quiz data is cached locally for offline access (~50 drugs, last-used classes) | Must |
| AC-012 | When offline, the app shows cached quiz data with a "You're offline — using cached data" indicator | Must |
| AC-013 | When back online, the app syncs fresh data from the API silently | Must |
| AC-014 | The app icon uses the existing Rx logo assets (light/dark variants) | Must |
| AC-015 | A splash screen displays the Rx logo during app launch | Should |
| AC-016 | The app builds successfully with `npx cap build ios` for release | Must |
| AC-017 | The app is uploaded to TestFlight via Xcode or `xcrun altool` | Must |
| AC-018 | App Store listing assets are generated: 3 screenshots (6.7" iPhone), description, keywords | Must |
| AC-019 | A privacy policy page is published at `https://drug-quiz.calebdunn.tech/privacy` | Must |
| AC-020 | The app is submitted to App Store review | Must |
| AC-021 | v1.0.0 is tagged in git after App Store approval | Must |
| AC-022 | The `capacitor.config.ts` points the WebView at the bundled assets (not a remote URL) | Must |
| AC-023 | Status bar and safe area insets are handled correctly on notched iPhones | Must |
| AC-024 | Apple Developer Program enrollment is complete ($99/year) | Must |

## 3. User Test Cases

### TC-001: Fresh install and first quiz

**Precondition:** App installed from TestFlight on a physical iPhone
**Steps:**
1. Open Rx Quiz app
2. Splash screen appears briefly
3. App loads the quiz config screen
4. Start a "Name the Class" quiz with 5 questions
5. Answer all questions
6. View results
**Expected Result:** Full quiz flow works identically to web. Haptic feedback on each answer. Results display correctly.
**Screenshot Checkpoint:** tests/screenshots/capacitor-ios/step-01-home-screen.png
**Maps to:** TBD

### TC-002: Google OAuth login in native app

**Precondition:** App installed, user has a Google account
**Steps:**
1. Tap "Sign in" in the header
2. System browser (ASWebAuthenticationSession) opens Google consent screen
3. Approve access
4. App receives deep link callback
5. Header shows user avatar and name
**Expected Result:** OAuth completes without leaving the app. JWT cookie is set. User is authenticated.
**Screenshot Checkpoint:** tests/screenshots/capacitor-ios/step-02-oauth-flow.png
**Maps to:** TBD

### TC-003: Offline quiz with cached data

**Precondition:** User has completed at least one quiz while online (data cached)
**Steps:**
1. Enable airplane mode
2. Open app
3. Start a quiz
4. Answer questions
**Expected Result:** App loads cached quiz data. Offline indicator banner appears. Quiz is playable. Results are stored locally and synced when back online.
**Screenshot Checkpoint:** tests/screenshots/capacitor-ios/step-03-offline-mode.png
**Maps to:** TBD

### TC-004: Share score card via native share sheet

**Precondition:** User is logged in, has completed a quiz
**Steps:**
1. Complete a quiz
2. Tap "Share" on the results screen
3. Native iOS share sheet appears
4. Select Messages or another share target
**Expected Result:** Share sheet shows the score card image/link. Sharing completes successfully.
**Screenshot Checkpoint:** tests/screenshots/capacitor-ios/step-04-share-sheet.png
**Maps to:** TBD

### TC-005: App Store listing review

**Precondition:** App is uploaded to App Store Connect
**Steps:**
1. View the listing in App Store Connect
2. Check screenshots (3x 6.7" iPhone)
3. Check description, keywords, category
4. Check privacy policy URL
**Expected Result:** All required fields are populated. Screenshots show key app flows. Privacy policy is accessible.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-006: Haptic feedback on answers

**Precondition:** App running on physical iPhone (simulator has no haptics)
**Steps:**
1. Start a Name the Class quiz
2. Select the correct answer
3. Select an incorrect answer on the next question
**Expected Result:** Correct answer triggers a light success haptic. Incorrect answer triggers an error haptic. Haptics are distinct.
**Screenshot Checkpoint:** N/A (haptic — no visual)
**Maps to:** TBD

## 4. Data Model

### Offline Cache (Capacitor Preferences or SQLite)

| Field | Type | Description |
|-------|------|-------------|
| cachedClasses | JSON | Array of EPC class names recently used |
| cachedDrugs | JSON | Map of class name → drug array (last ~50 drugs) |
| cacheTimestamp | string (ISO 8601) | When the cache was last updated |
| pendingResults | JSON | Quiz results completed offline, pending sync |

### Capacitor Config

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: "com.calebdunn.rxquiz",
  appName: "Rx Quiz",
  webDir: "dist",
  server: {
    // Bundled assets, not remote URL
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};
```

## 5. API Contract

### Deep Link OAuth Redirect

The BFF must detect when the OAuth request originates from the native app and use the appropriate redirect URI:

**Web redirect:** `https://drug-quiz.calebdunn.tech/api/auth/google/callback`
**Native redirect:** `com.calebdunn.rxquiz://auth/callback`

Detection: The native app passes a `?platform=ios` query parameter when initiating `/api/auth/google`. The BFF uses this to select the redirect URI registered in Google Cloud Console.

### Offline Sync Endpoint

**POST /api/v1/sessions/sync**

Syncs quiz results completed while offline.

**Request:**
```json
{
  "sessions": [
    {
      "quizType": "name-the-class",
      "questionCount": 5,
      "correctCount": 3,
      "percentage": 60.0,
      "completedAt": "2026-04-01T10:00:00Z",
      "answersJson": [...]
    }
  ]
}
```

**Response (200):**
```json
{
  "synced": 1,
  "errors": []
}
```

## 6. UI Behavior

### States

- **Splash:** Rx logo on white/dark background (matches theme), 1.5s duration
- **Online:** Normal app experience, identical to web
- **Offline:** Banner at top: "You're offline — using cached data". Quiz works with cached drugs. Session history shows but can't sync.
- **Syncing:** After coming back online, brief "Syncing..." indicator, then banner dismisses

### Native Touches

| Touch | Plugin | Behavior |
|-------|--------|----------|
| Haptic on correct | @capacitor/haptics | `Haptics.impact({ style: ImpactStyle.Light })` |
| Haptic on incorrect | @capacitor/haptics | `Haptics.notification({ type: NotificationType.Error })` |
| Share sheet | @capacitor/share | `Share.share({ title, text, url, dialogTitle })` |
| App badge | @capacitor/badge | `Badge.set({ count: streakDays })` |

### Safe Area

- Status bar: light content on dark bg, dark content on light bg (matches theme)
- Bottom safe area: content padded above home indicator
- Notch: header content doesn't overlap Dynamic Island / notch

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| No internet on first launch (no cache) | Show "Connect to the internet to start your first quiz" message |
| Cache is stale (>7 days) | Show cached data with "Data may be outdated" warning, refresh on next online session |
| OAuth deep link received when app is backgrounded | App foregrounds and completes the OAuth flow |
| User denies OAuth in native browser | Returns to app in unauthenticated state, no error |
| App Store review rejection | Address feedback, resubmit (TestFlight unaffected) |
| Large answer history pending sync | Batch sync in groups of 50, retry on failure |
| Haptics on device without Taptic Engine | Graceful no-op (Capacitor handles this) |
| Dark mode in native app | Follows system theme, same as web implementation |

## 8. Dependencies

- M5 complete (accounts, shareable scores, database) — OAuth and score sharing must work on web first
- Apple Developer Program enrollment ($99/year)
- Google Cloud Console — add native redirect URI (`com.calebdunn.rxquiz://auth/callback`)
- BFF — platform-aware OAuth redirect (AC-007)
- Xcode installed on macOS development machine
- Physical iPhone for haptic testing and TestFlight

### Capacitor Plugins

| Plugin | Purpose |
|--------|---------|
| @capacitor/haptics | Haptic feedback on answers |
| @capacitor/share | Native share sheet for score cards |
| @capacitor/badge | App icon badge for streaks |
| @capacitor/splash-screen | Launch splash screen |
| @capacitor/preferences | Local key-value storage for offline cache |
| @capacitor/network | Detect online/offline state |
| @capacitor/app | Deep link handling for OAuth |

### App Store Listing Assets

| Asset | Source |
|-------|--------|
| App icon (1024x1024) | Generated from Rx logo |
| Screenshots (3x 6.7" iPhone) | Simulator captures of: home screen, quiz in progress, results |
| Description | Derived from PRD problem statement + feature list |
| Keywords | pharmacy, drug quiz, NAPLEX, PTCE, pharmacology, study, exam prep |
| Category | Education |
| Privacy policy | Published at `https://drug-quiz.calebdunn.tech/privacy` |

## 9. Build & Release Pipeline

```
Vite build (dist/)
  → npx cap sync (copies to ios/)
    → Xcode archive
      → Upload to App Store Connect
        → TestFlight (internal testing)
          → App Store submission (external review)
            → v1.0.0 tag on approval
```

Future: automate with `fastlane` for CI-driven builds and uploads.

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-23 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
