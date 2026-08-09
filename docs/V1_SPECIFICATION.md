Next: **`V1_SPECIFICATION.md`**.

This should become the **final product contract**, separate from `PROJECT_STATUS.md`.

Unlike the status document, this one should answer only:

> **What exactly is NexusSpace V1, and what must be true for us to call it complete?**

Replace the old specification with:

````md
# NexusSpace V1 — Release Specification

Status: FINAL
Version: 1.0
Target: V1 Production Release

---

# 1. Product Definition

NexusSpace V1 is an AI-assisted Learning Operating System.

Its purpose is to help learners build structured understanding through an interconnected learning hierarchy.

The core V1 learning journey is:

```text
Learning Request
      ↓
Units
      ↓
Chapters
      ↓
Lesson Nodes
      ↓
Learning Experience
      ↓
Evaluation
      ↓
Progress / Mastery
      ↓
Unlock Logic
      ↓
Next Learning
````

NexusSpace is not merely an AI content generator.

AI generates educational content and performs semantic evaluation.

The backend remains the source of truth for:

* application state
* identity
* authorization
* ownership
* ordering
* dependencies
* progress
* mastery
* unlock logic
* persistence
* transactions

---

# 2. V1 Feature Freeze

No new product features may be introduced during V1 completion.

Allowed work:

* Bug fixes
* Stability improvements
* Security improvements
* Architecture cleanup required for correctness
* UX improvements
* Mobile responsiveness
* Error handling
* Testing
* Performance improvements that do not change architecture

Anything not explicitly required by this specification is V2+.

---

# 3. Learning Architecture

The learning architecture is locked.

```text
Learning Request
│
├── Unit 1
│   ├── Chapter 1
│   │   ├── Lesson Node 1
│   │   ├── Lesson Node 2
│   │   └── Lesson Node 3
│   │
│   └── Chapter 2
│       ├── Lesson Node 1
│       └── Lesson Node 2
│
└── Unit 2
    └── ...
```

The four tiers MUST NOT be collapsed.

---

# 4. Tier 1 — Units

## Purpose

Represent the high-level curriculum structure for a learning request.

## Generation

Generated when the learning request/workspace is created.

## Output

Units/modules only.

## Tier 1 MUST NOT generate

* Chapters
* Lesson Nodes
* Markdown
* Flashcards
* Quizzes
* Learning Experience content

## Rules

* Units are generated once during workspace creation.
* Workspace creation must not trigger a second automatic Tier 1 generation.
* GET requests must never generate Units.
* Explicit Tier 1 regeneration remains a separate capability.
* Destructive Tier 1 curriculum replacement is NOT part of V1.

---

# 5. Tier 2 — Chapters

## Purpose

Expand one selected Unit into its teachable Chapters.

## Generation

Generated Just-In-Time when a learner selects a Unit.

## Output

Chapters belonging only to that Unit.

Each Chapter initially has no generated Lesson Nodes.

## Tier 2 MUST NOT generate

* Markdown
* Flashcards
* Quizzes
* Learning Experience content

## Rules

* Results are cached.
* Existing Chapters are read before generation.
* `forceRefresh` is explicit.
* Ownership is verified.
* AI output is schema validated.
* Obsolete generated descendants are cleaned during safe regeneration.
* Learner history is preserved.
* Manual Resources are preserved.

---

# 6. Tier 3 — Lesson Nodes

## Purpose

Expand one selected Chapter into multiple learnable Lesson Nodes.

## Generation

Generated Just-In-Time when a learner selects a Chapter.

## Output

Metadata only:

```text
id
title
description
order
estimatedMinutes
generationStatus
```

## Tier 3 MUST NOT generate

* Markdown
* Flashcards
* Quiz content

## Rules

* Results are cached.
* Existing Lesson Nodes are read before generation.
* `forceRefresh` is explicit.
* Ownership is verified.
* AI output is schema validated.
* Obsolete generated learning assets are cleaned during safe regeneration.
* Learner history is preserved.
* Manual Resources are preserved.

---

# 7. Tier 4 — Learning Experience

## Purpose

Teach exactly one selected Lesson Node.

## Generation

Triggered only when a learner selects a specific Lesson Node.

## Output

A Learning Experience containing:

* Markdown lesson content
* Flashcards
* Quiz

## Identity

The semantic identity is:

```text
lessonId
```

A Chapter ID MUST NOT be used as the Lesson identity.

The frontend MUST NOT fabricate lesson identities.

Legacy identities such as:

```text
subtopicId: "overview"
```

are prohibited.

## Rules

* JIT generation
* Cached
* `forceRefresh` supported
* Schema validated
* Mapped into application DTOs
* Persisted transactionally where MongoDB supports transactions
* Existing learner history must not be deleted by regeneration

---

# 8. AI Pipeline Contract

Every AI generation endpoint follows:

```text
Prompt
   ↓
Provider
   ↓
Raw Response
   ↓
Schema Validation
   ↓
Mapper
   ↓
DTO
   ↓
Business Validation
   ↓
Transaction
   ↓
Persistence
```

Raw AI responses must never be persisted directly.

AI must never perform deterministic application logic.

AI is responsible for:

* curriculum reasoning
* educational explanations
* examples
* analogies
* generated practice material
* semantic evaluation

Backend code is responsible for:

* state
* identity
* authorization
* ordering
* dependency resolution
* progress
* mastery calculation
* unlocking
* persistence
* transactions

---

# 9. AI Provider Architecture

The backend uses:

```text
ProviderFactory
      ↓
IAIProvider
      ↓
Cerebras
Groq
Other Providers
```

OmniRoute is the external AI gateway/provider routing layer.

The provider abstraction is frozen for V1.

Do not introduce provider-specific logic into business services.

---

# 10. Caching and Generation

Generated educational content is persistent.

The system follows:

```text
Cache / Existing Data
        ↓
If missing
        ↓
Generate
        ↓
Validate
        ↓
Persist
```

AI generation must never occur automatically from GET requests.

Regeneration occurs only through explicit user action.

---

# 11. Regeneration Safety

V1 must not intentionally leave orphaned AI-generated records.

When curriculum content is explicitly regenerated:

### Tier 2

Obsolete generated Lesson/Flashcard/Quiz records belonging to replaced Chapters are cleaned.

### Tier 3

Obsolete generated learning assets belonging to replaced Lesson Nodes are cleaned.

### Never delete automatically during regeneration

* LearningProgress
* Evaluation history
* Quiz attempts
* User submissions
* Scores
* Mastery/history
* Manual Resources
* Unrelated curriculum

Tier 1 destructive replacement is deferred because the current learning-history model does not yet provide a safe curriculum-version identity.

---

# 12. Learning Engine

The backend is authoritative for learning state.

Required V1 capabilities:

## Progress

* Progress is initialized correctly.
* Completion is persisted.
* Mastery is persisted.
* LearningProgress is authoritative.
* State remains internally consistent.

## Unlocking

* Dependencies are validated by the backend.
* Unlock conditions are deterministic.
* Unlock state is persisted.
* Completing required learning can unlock subsequent learning.

## Completion

V1 must define and enforce completion rules for:

* Lesson completion
* Quiz completion
* Flashcard/review completion where applicable

AI must not directly mutate learning state.

---

# 13. Evaluation

Evaluation measures learner understanding.

It must not modify the lesson itself.

The evaluation pipeline is:

```text
Learner Submission
      ↓
Validation
      ↓
AI Evaluation
      ↓
Schema Validation
      ↓
Mastery Result
      ↓
Progress Update
      ↓
Unlock Cascade
```

Evaluation should measure:

* understanding
* misconceptions
* completeness
* confidence where supported

Output may include:

* mastery score
* weak areas
* strengths
* improvement suggestions

The current evaluator remains concept/unit scoped.

Lesson-level evaluator identity refinement is deferred unless required for V1 correctness.

Prompt injection defenses must be present where learner input is sent to AI evaluation.

---

# 14. Learning Planner

The Planner determines the next recommended learning step using deterministic learning state and graph information.

The intended responsibility is:

```text
Backend
    ↓
determines valid next learning options
    ↓
Planner
    ↓
recommends the next learning step
```

The Planner must consider available graph state and mastery/progress where supported.

The Planner must not bypass backend dependency or unlock rules.

Planner work is required only after the learning/progress engine is functional.

---

# 15. Resources

V1 Resources must support:

* creation
* attachment
* retrieval
* update where supported
* deletion
* ownership verification

Manual Resources must not be deleted by curriculum regeneration.

---

# 16. Authentication and Authorization

V1 authentication must support the capabilities already implemented by the application.

Required security properties:

* protected routes
* authentication validation
* authorization
* workspace ownership enforcement
* resource ownership enforcement
* invalid credentials rejected
* consistent authentication state

Any authentication feature not currently implemented must be treated as a release requirement only if it is part of the actual V1 user journey.

Do not introduce new authentication providers merely to satisfy an outdated document.

---

# 17. Frontend V1

The frontend must implement the locked learning hierarchy.

Required flow:

```text
Dashboard
    ↓
Workspace
    ↓
Unit List
    ↓
Chapter List
    ↓
Lesson Node List
    ↓
TeacherStudio
    ↓
Learning Experience
```

### Rules

Selecting a Unit MUST NOT directly open TeacherStudio.

Selecting a Chapter MUST NOT directly open TeacherStudio.

Only selecting a Lesson Node opens the Learning Experience.

TeacherStudio displays:

* Markdown
* Flashcards
* Quiz

---

# 18. Frontend State

WorkspacePage is the primary learning navigation state machine.

It must track:

```text
selectedUnit
selectedChapter
selectedLesson
```

not the legacy single-level `selectedConcept` flow.

Workspace identity and title must come from the actual workspace.

The frontend must preserve:

* loading state
* error state
* retry
* navigation
* refresh behavior
* toast/feedback behavior where already implemented

---

# 19. Difficulty

Difficulty selection is NOT a V1 product feature.

There is no V1 difficulty selector.

The backend may retain difficulty as an API capability, but V1 does not expose difficulty selection to learners.

The V1 learning experience should target a consistent medium/balanced instructional depth.

Prompt refinement may be performed later without changing the learning architecture.

---

# 20. Error Handling

Every AI-driven learning stage must have:

* loading state
* success state
* failure state
* retry capability where appropriate
* no silent failure
* no duplicate generation from repeated UI actions

AI failure must not corrupt persisted learning state.

---

# 21. Data Integrity

The following are mandatory:

* No orphaned AI-generated curriculum records from supported regeneration paths.
* No accidental deletion of learner history.
* No accidental deletion of manual Resources.
* No cross-workspace data leakage.
* No cross-user ownership violations.
* No duplicate automatic Tier 1 generation.
* No stale generation overwriting newer curriculum state.
* Multi-document writes are atomic where required.
* GET endpoints remain pure reads.

---

# 22. API Rules

Backend API contracts are frozen unless a concrete V1 correctness defect requires a change.

Do not:

* redesign endpoints unnecessarily
* introduce new service layers without need
* collapse tiers
* move deterministic logic into AI prompts
* make GET endpoints perform generation
* fabricate identifiers

---

# 23. Mobile and UX Requirements

Every V1 page must work on:

* Desktop
* Tablet
* Mobile

Requirements:

* No horizontal scrolling.
* No inaccessible touch interactions.
* Learning navigation remains understandable on small screens.
* Loading and error states remain usable on mobile.

Visual polish is secondary to functional correctness.

---

# 24. V1 Out of Scope

The following are explicitly V2+:

* Collaboration
* Organizations
* Social learning
* Notifications
* Streaks
* Achievements
* Gamification expansion
* Marketplace
* Plugins
* Chat as a standalone product feature
* Desktop application
* Native mobile application
* Advanced analytics
* External integrations
* RAG
* Embeddings
* Voice learning
* Advanced adaptive learning
* Autonomous learning agents
* Redis
* Queues
* Background workers
* WebSockets
* Microservices
* Distributed caching
* Enterprise infrastructure
* Horizontal scaling

---

# 25. V1 Release Acceptance

NexusSpace V1 cannot be declared complete until the following end-to-end journey works:

```text
Register / Login
      ↓
Create Workspace
      ↓
Generate Units
      ↓
Select Unit
      ↓
Generate / Load Chapters
      ↓
Select Chapter
      ↓
Generate / Load Lesson Nodes
      ↓
Select Lesson Node
      ↓
Generate / Load Learning Experience
      ↓
Study Lesson
      ↓
Use Flashcards
      ↓
Complete Quiz
      ↓
Submit Evaluation
      ↓
Update Progress / Mastery
      ↓
Unlock Next Learning
      ↓
Receive Next Recommendation
```

The journey must work without manual database manipulation.

---

# 26. Release Gates

Every V1 module must satisfy:

```text
Feature Complete
        ↓
Regression PASS
        ↓
Security PASS
        ↓
Mobile PASS
        ↓
Engineering PASS
        ↓
Documentation PASS
```

Release is blocked by:

* Critical bugs
* High-severity correctness bugs
* Data corruption
* Unauthorized data access
* Broken core learning flow
* Failed regression tests
* Broken production build

---

# 27. Definition of Done

NexusSpace V1 is complete when:

1. The complete learning journey works end-to-end.
2. Units → Chapters → Lesson Nodes → Learning Experience works correctly.
3. Evaluation works.
4. Progress and mastery work.
5. Unlock logic works.
6. Planner works.
7. Authentication and ownership are secure.
8. Regeneration does not create orphaned generated content.
9. Learner history survives supported regeneration.
10. Desktop, tablet and mobile flows work.
11. Regression tests pass.
12. Production builds pass.
13. No known Critical bugs remain.
14. No known High-severity bugs remain.
15. No V1 feature remains partially implemented.
16. No new feature is being added during the release phase.

---

# 28. V1 Demo Journey

A successful V1 demonstration must be possible in one continuous user journey:

```text
1. Login
2. Create a learning workspace
3. View generated Units
4. Select a Unit
5. Generate/load Chapters
6. Select a Chapter
7. Generate/load Lesson Nodes
8. Select a Lesson Node
9. Open the Learning Experience
10. Study the lesson
11. Review flashcards
12. Complete the quiz
13. Submit evaluation
14. View updated mastery/progress
15. Unlock or receive the next learning recommendation
16. Continue learning
```

If this journey works reliably, NexusSpace has demonstrated its V1 product promise.

---

# 29. V1 Engineering Principle

The guiding rule for all remaining work:

```text
Do not build more.

Finish what already exists.
```

Correctness > feature count.

Learning quality > AI novelty.

Deterministic backend state > AI-controlled application logic.

Small vertical slices > large rewrites.

V1 completion > V2 experimentation.

```

### Why this version is the one to freeze

The old specification had several contradictions with the architecture we've actually locked:

- `Module → Concept → Learning Package` terminology is replaced by **Unit → Chapter → Lesson Node → Learning Experience**.
- Tier 3 is explicitly metadata-only.
- Lesson identity is explicitly `lessonId`.
- Difficulty is removed from V1 UX.
- Regeneration semantics now reflect the backend behavior we've actually verified.
- Planner comes after the learning state engine.
- The release criterion is the **complete learner loop**, not merely individual backend modules.

The critical distinction is that this document describes **what V1 must be**, while `PROJECT_STATUS.md` describes **where we currently are**. Don't merge those two responsibilities again.
```
