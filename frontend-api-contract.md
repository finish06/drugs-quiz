# drug-gate API Contract — Frontend Developer Handoff

**Version:** v0.4.0
**Date:** 2026-03-15
**Swagger UI:** `{BASE_URL}/swagger/index.html`
**OpenAPI JSON:** `{BASE_URL}/openapi.json`

## Overview

drug-gate is a REST API that provides drug information (names, therapeutic classes, brand/generic mappings) sourced from FDA/DailyMed data. It is designed for frontend consumption — all data is public, responses are JSON, and the API handles pagination, filtering, and search.

The API is ideal for building quiz/study tools for pharmacy and technician exam prep: matching drugs to classes, identifying brand/generic pairs, and browsing drug catalogs.

## Authentication

All `/v1/*` endpoints require an API key via header:

```
X-API-Key: pk_your_key_here
```

Keys are provisioned by an admin. Each key is scoped to allowed origins (CORS) and has a per-key rate limit. Contact the API admin for a key.

**Error responses:**

| Status | Meaning |
|--------|---------|
| `401` | Missing, invalid, or inactive API key |
| `429` | Rate limit exceeded — check `Retry-After` header |

Rate limit headers are included on every response:
```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710500000
```

---

## Endpoints

### 1. List Drug Names

Browse or search the full DailyMed drug name catalog (~104K entries).

```
GET /v1/drugs/names
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | No | — | Case-insensitive substring search (e.g. `q=simva`) |
| `type` | string | No | all | Filter: `generic`, `brand`, or `all` |
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 50 | Results per page (max: 100) |

**Response:**
```json
{
  "data": [
    { "name": "Simvastatin", "type": "generic" },
    { "name": "Zocor", "type": "brand" }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "total_pages": 1
  }
}
```

**Quiz use:** Fetch random drug names for "name the class" questions. Use `type=generic` to get only generic names for matching exercises.

---

### 2. List Drug Classes

Browse pharmacological drug classes from DailyMed (~1.2K entries).

```
GET /v1/drugs/classes
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | string | No | epc | Filter: `epc`, `moa`, `pe`, `cs`, or `all` |
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 50 | Results per page (max: 100) |

**Class types:**

| Code | Meaning | Example |
|------|---------|---------|
| `epc` | Established Pharmacologic Class | "HMG-CoA Reductase Inhibitor" |
| `moa` | Mechanism of Action | "Hydroxymethylglutaryl-CoA Reductase Inhibitors" |
| `pe` | Physiologic Effect | "Decreased Cholesterol Synthesis" |
| `cs` | Chemical Structure | — |

**Response:**
```json
{
  "data": [
    { "name": "HMG-CoA Reductase Inhibitor", "type": "epc" },
    { "name": "ACE Inhibitor", "type": "epc" }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1200,
    "total_pages": 24
  }
}
```

**Quiz use:** Fetch EPC classes as answer choices. EPC is the most useful type for pharmacy exam prep — it's what pharmacists use to categorize drugs clinically.

---

### 3. Look Up Drug Class by Name

Given a drug name (generic or brand), return its pharmacological classes.

```
GET /v1/drugs/class?name={drug_name}
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Drug name — generic (e.g. `simvastatin`) or brand (e.g. `Zocor`) |

The API tries generic name first, then falls back to brand name automatically.

**Response:**
```json
{
  "query_name": "simvastatin",
  "generic_name": "simvastatin",
  "brand_names": ["Zocor"],
  "classes": [
    { "name": "HMG-CoA Reductase Inhibitor", "type": "EPC" },
    { "name": "Hydroxymethylglutaryl-CoA Reductase Inhibitors", "type": "MoA" }
  ]
}
```

**Error responses:**

| Status | Meaning |
|--------|---------|
| `400` | Missing or empty `name` parameter |
| `404` | Drug not found |
| `502` | Upstream data service unavailable |

**Quiz use:** Verify a user's answer — look up the drug and check if the selected class matches. Also useful for building the "correct answer" when generating questions.

---

### 4. List Drugs in a Class

Given a pharmacological class, return all drugs that belong to it.

```
GET /v1/drugs/classes/drugs?class={class_name}
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `class` | string | Yes | — | Pharmacological class name (e.g. `HMG-CoA Reductase Inhibitor`) |
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 100 | Results per page (max: 500) |

**Response:**
```json
{
  "data": [
    { "generic_name": "simvastatin", "brand_name": "Zocor" },
    { "generic_name": "atorvastatin calcium", "brand_name": "Lipitor" },
    { "generic_name": "rosuvastatin calcium", "brand_name": "Crestor" }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 12,
    "total_pages": 1
  }
}
```

Returns empty `data: []` (not 404) for unknown classes.

**Quiz use:** Get all drugs in a class to generate "which drug belongs to this class?" questions. Also powers the answer key for matching exercises.

---

### 5. Look Up Drug by NDC

Given an NDC (National Drug Code), return drug details.

```
GET /v1/drugs/ndc/{ndc}
```

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `ndc` | string | Product NDC with dashes (e.g. `00069-3150`, `58151-158`) |

**Response:**
```json
{
  "ndc": "00069-3150",
  "name": "Lipitor",
  "generic_name": "atorvastatin calcium",
  "classes": [
    "HMG-CoA Reductase Inhibitor [EPC]",
    "Hydroxymethylglutaryl-CoA Reductase Inhibitors [MoA]"
  ]
}
```

---

## Quiz Recipe: "Match Drug to Class"

Step-by-step API calls to generate a 4-option matching quiz:

```
1. GET /v1/drugs/classes?type=epc&limit=4&page={random}
   → Pick 4 EPC classes

2. For each class:
   GET /v1/drugs/classes/drugs?class={name}&limit=1
   → Get one drug from each class

3. Present to user:
   Left column: 4 drug names (shuffled)
   Right column: 4 class names (shuffled)
   Task: Match each drug to its class
```

## Quiz Recipe: "Name the Class"

```
1. GET /v1/drugs/names?type=generic&limit=1&page={random}
   → Pick a random generic drug

2. GET /v1/drugs/class?name={drug_name}
   → Get the correct class (EPC entry)

3. GET /v1/drugs/classes?type=epc&limit=3&page={random}
   → Get 3 distractor classes

4. Present to user:
   Question: "What class does {drug_name} belong to?"
   Options: [correct class + 3 distractors] (shuffled)
```

## Quiz Recipe: "Brand/Generic Match"

```
1. GET /v1/drugs/classes/drugs?class={popular_class}&limit=20
   → Get drugs with both generic and brand names

2. Pick 4 drugs that have non-empty brand_name

3. Present to user:
   Left column: 4 generic names (shuffled)
   Right column: 4 brand names (shuffled)
   Task: Match generic to brand
```

## Popular Classes for Exam Prep

These EPC classes appear frequently on pharmacy exams. Use them as seeds:

| Class Name | Example Drugs |
|------------|---------------|
| HMG-CoA Reductase Inhibitor | simvastatin, atorvastatin |
| ACE Inhibitor | lisinopril, enalapril |
| Proton Pump Inhibitor | omeprazole, pantoprazole |
| Beta Adrenergic Blocker | metoprolol, atenolol |
| Angiotensin 2 Receptor Blocker | losartan, valsartan |
| Selective Serotonin Reuptake Inhibitor | sertraline, fluoxetine |
| Calcium Channel Blocker | amlodipine, diltiazem |
| Benzodiazepine | lorazepam, diazepam |
| Thiazide Diuretic | hydrochlorothiazide |
| Opioid Agonist | oxycodone, hydrocodone |

---

## Pagination

All list endpoints return paginated responses. The shape is consistent:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1200,
    "total_pages": 24
  }
}
```

- `page` beyond `total_pages` returns empty `data: []` with correct metadata
- `limit` is clamped to the endpoint's maximum (100 for names/classes, 500 for drugs-by-class)
- Use `total` to generate random page numbers for quiz randomization

## Error Handling

All errors follow a consistent shape:

```json
{
  "error": "error_code",
  "message": "Human-readable description"
}
```

| Code | Status | Meaning |
|------|--------|---------|
| `unauthorized` | 401 | Missing/invalid API key |
| `rate_limited` | 429 | Too many requests |
| `validation_error` | 400 | Missing required parameter |
| `not_found` | 404 | Drug not found |
| `upstream_error` | 502 | Backend data service unavailable |

## Caching Behavior

Data is cached server-side in Redis with a 60-minute sliding TTL. First request after cache expiry may be slightly slower (~200-500ms) as it fetches fresh data from upstream. Subsequent requests serve from cache (~5-20ms).

The frontend does not need to manage caching — the API handles it transparently.

## CORS

API keys are origin-locked. Your frontend domain must be in the key's allowed origins list. If you get CORS errors, contact the API admin to add your domain.

## Rate Limits

Each API key has a per-minute rate limit (configured at key creation). Default is typically 100 req/min. Monitor `X-RateLimit-Remaining` headers. On `429`, wait for the `Retry-After` seconds before retrying.

For a quiz app with reasonable usage, you're unlikely to hit limits.

---

## Quick Start

```bash
# Health check
curl https://{BASE_URL}/health

# List first 10 generic drug names
curl -H "X-API-Key: pk_your_key" \
  "https://{BASE_URL}/v1/drugs/names?type=generic&limit=10"

# Look up simvastatin's class
curl -H "X-API-Key: pk_your_key" \
  "https://{BASE_URL}/v1/drugs/class?name=simvastatin"

# Get all statins
curl -H "X-API-Key: pk_your_key" \
  "https://{BASE_URL}/v1/drugs/classes/drugs?class=HMG-CoA+Reductase+Inhibitor"

# Browse EPC classes
curl -H "X-API-Key: pk_your_key" \
  "https://{BASE_URL}/v1/drugs/classes?type=epc&limit=20"
```

## Contact

- **API Admin:** Request API keys and origin configuration
- **Swagger UI:** `{BASE_URL}/swagger/index.html` — interactive API explorer
- **OpenAPI spec:** `{BASE_URL}/openapi.json` — import into Postman, Insomnia, etc.
