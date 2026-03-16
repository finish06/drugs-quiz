# Sequence Diagrams

Mermaid sequence diagrams for the key flows in drugs-quiz.

## 1. Quiz Session Flow (Full Lifecycle)

The end-to-end flow from user configuration through question generation, answering, and results.

```mermaid
sequenceDiagram
    actor User
    participant App
    participant QuizConfig as QuizConfig Component
    participant Hook as useQuizSession
    participant Gen as quiz-generators
    participant API as api-client
    participant Proxy as Vite /api Proxy
    participant DrugGate as drug-gate API

    User->>QuizConfig: Select quiz type & question count
    User->>QuizConfig: Click "Start Quiz"
    QuizConfig->>App: onStart(config)
    App->>Hook: startQuiz(config)
    Hook->>Hook: setSession({ status: "loading" })
    App-->>User: Show loading spinner

    Hook->>Gen: generateQuestions(type, count)
    loop For each question (1..count)
        Gen->>API: [API calls per quiz type recipe]
        API->>Proxy: fetch("/api/v1/drugs/...")
        Proxy->>DrugGate: GET /v1/drugs/... + X-API-Key header
        DrugGate-->>Proxy: JSON response
        Proxy-->>API: JSON response
        API-->>Gen: Typed response
    end
    Gen-->>Hook: Question[]

    Hook->>Hook: setSession({ status: "in-progress", questions })
    App-->>User: Render first question (MultipleChoice or MatchingQuiz)

    loop For each question
        User->>App: Answer question
        App->>Hook: submitAnswer(correct)
        Hook->>Hook: Append Answer to session.answers
        User->>App: Click "Next Question"
        App->>Hook: nextQuestion()
        Hook->>Hook: Increment currentIndex (or set status: "complete")
    end

    App->>QuizResults: Render results (percentage, breakdown)
    User-->>App: Click "Retry" or "New Quiz"
    alt Retry
        App->>Hook: startQuiz(same config)
    else New Quiz
        App->>Hook: resetQuiz()
        Hook->>Hook: setSession(null)
        App-->>User: Show QuizConfig
    end
```

## 2. Name the Class Question Generation

Implements the "Name the Class" recipe from `frontend-api-contract.md`.

```mermaid
sequenceDiagram
    participant Gen as generateNameTheClassQuestion
    participant API as api-client
    participant DrugGate as drug-gate API

    Note over Gen: Step 1 - Get total page count for random selection
    Gen->>API: getDrugNames({ type: "generic", limit: 1 })
    API->>DrugGate: GET /v1/drugs/names?type=generic&limit=1
    DrugGate-->>API: { data: [...], pagination: { total_pages: N } }
    API-->>Gen: PaginatedResponse<DrugName>

    Note over Gen: Step 2 - Pick a random drug with an EPC class (retry up to 5x)
    loop Attempt 1..5 (until drug with EPC class found)
        Gen->>Gen: randomInt(1, totalPages)
        Gen->>API: getDrugNames({ type: "generic", limit: 1, page: random })
        API->>DrugGate: GET /v1/drugs/names?type=generic&limit=1&page={random}
        DrugGate-->>API: { data: [{ name, type }] }
        API-->>Gen: drug name

        Gen->>API: getDrugClass(drug.name)
        API->>DrugGate: GET /v1/drugs/class?name={drug_name}
        alt Drug has EPC class
            DrugGate-->>API: { classes: [{ name, type: "EPC" }, ...] }
            API-->>Gen: DrugClassLookup
            Note over Gen: Found! correctClass = EPC class name
        else Drug not found or no EPC class
            DrugGate-->>API: 404 or classes without EPC
            Note over Gen: Continue to next attempt
        end
    end

    Note over Gen: Step 3 - Fetch distractor classes
    Gen->>API: getDrugClasses({ type: "epc", limit: 100 })
    API->>DrugGate: GET /v1/drugs/classes?type=epc&limit=100
    DrugGate-->>API: { data: [{ name, type }, ...] }
    API-->>Gen: PaginatedResponse<DrugClass>

    Gen->>Gen: Filter out correctClass, shuffle, take 3 distractors
    Gen->>Gen: Shuffle [correctClass + 3 distractors]
    Gen-->>Gen: Return MultipleChoiceQuestion
```

## 3. Match Drug to Class Question Generation

Implements the "Match Drug to Class" recipe from `frontend-api-contract.md`.

```mermaid
sequenceDiagram
    participant Gen as generateMatchDrugToClassQuestion
    participant API as api-client
    participant DrugGate as drug-gate API

    Note over Gen: Step 1 - Fetch a pool of EPC classes
    Gen->>API: getDrugClasses({ type: "epc", limit: 100 })
    API->>DrugGate: GET /v1/drugs/classes?type=epc&limit=100
    DrugGate-->>API: { data: [class1, class2, ...] }
    API-->>Gen: PaginatedResponse<DrugClass>

    Gen->>Gen: Shuffle all classes randomly

    Note over Gen: Step 2 - For each class, try to get a drug (need 4 pairs)
    loop For each shuffled class (until 4 pairs found)
        Gen->>API: getDrugsInClass({ class: cls.name, limit: 5 })
        API->>DrugGate: GET /v1/drugs/classes/drugs?class={name}&limit=5
        DrugGate-->>API: { data: [{ generic_name, brand_name }, ...] }
        API-->>Gen: PaginatedResponse<DrugInClass>
        alt Class has drugs
            Gen->>Gen: Add pair { drug: generic_name, className: cls.name }
        else Empty class
            Note over Gen: Skip, try next class
        end
    end

    Note over Gen: Step 3 - Build matching question
    Gen->>Gen: Build correctPairs map (drug -> className)
    Gen->>Gen: Shuffle leftItems (drug names)
    Gen->>Gen: Shuffle rightItems (class names)
    Gen-->>Gen: Return MatchingQuestion
```

## 4. Brand/Generic Match Question Generation

Implements the "Brand/Generic Match" recipe from `frontend-api-contract.md`.

```mermaid
sequenceDiagram
    participant Gen as generateBrandGenericMatchQuestion
    participant API as api-client
    participant DrugGate as drug-gate API

    Note over Gen: Uses hardcoded POPULAR_CLASSES list (10 exam-relevant EPC classes)
    Gen->>Gen: Shuffle POPULAR_CLASSES randomly

    loop For each popular class (until one yields 4+ drugs with brands)
        Gen->>API: getDrugsInClass({ class: className, limit: 20 })
        API->>DrugGate: GET /v1/drugs/classes/drugs?class={className}&limit=20
        DrugGate-->>API: { data: [{ generic_name, brand_name }, ...] }
        API-->>Gen: PaginatedResponse<DrugInClass>

        Gen->>Gen: Filter to drugs where brand_name is non-empty
        alt 4+ drugs with brand names
            Gen->>Gen: Shuffle filtered drugs, take 4
            Gen->>Gen: Build correctPairs (generic -> brand)
            Gen->>Gen: Shuffle leftItems (generic names)
            Gen->>Gen: Shuffle rightItems (brand names)
            Gen-->>Gen: Return MatchingQuestion
        else Fewer than 4
            Note over Gen: Try next popular class
        end
    end
```

## 5. Error Handling Flow

How API failures propagate from the network layer up to the user.

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Hook as useQuizSession
    participant Gen as quiz-generators
    participant API as api-client
    participant Proxy as Vite /api Proxy
    participant DrugGate as drug-gate API

    User->>App: Start quiz
    App->>Hook: startQuiz(config)
    Hook->>Hook: setSession({ status: "loading" })
    Hook->>Gen: generateQuestions(type, count)

    Gen->>API: [API call]
    API->>Proxy: fetch("/api/v1/drugs/...")

    alt Network error / proxy failure
        Proxy--xAPI: Connection refused / timeout
        API--xGen: TypeError: Failed to fetch
        Gen--xHook: Error thrown
    else API returns error status
        Proxy->>DrugGate: GET /v1/drugs/...
        DrugGate-->>Proxy: HTTP 401/429/502 { error, message }
        Proxy-->>API: Error response
        API->>API: throw new DrugApiError(status, { error, message })
        API--xGen: DrugApiError thrown
        Gen--xHook: Error propagated
    else Generator-level failure (e.g., no EPC class found after 5 retries)
        Gen->>Gen: throw new Error("Failed to find a drug with an EPC class...")
        Gen--xHook: Error thrown
    end

    Hook->>Hook: catch: setError(err.message)
    Hook->>Hook: setSession(null)
    App-->>User: Show error message + "Back" button

    User->>App: Click "Back"
    App->>Hook: resetQuiz()
    Hook->>Hook: setError(null), setSession(null)
    App-->>User: Show QuizConfig screen
```
