Next is **`SDD.md` / `SDD_V1.md`**. You appear to have duplicate versions; **finalize one as `SDD.md` and archive/delete the duplicate later**.

The current SDD is outdated because it still describes:

```text
Workspace
→ Curriculum Architect
→ Curriculum Blueprint
→ Learning Architect
→ Concept Graph
→ Teacher
→ Learning Package
```

and:

```text
Module Open → Concepts
Concept Open → Learning Package
```

 

That conflicts with our locked implementation:

```text
Learning Request
→ Unit
→ Chapter
→ Lesson Node
→ Learning Experience
```

Replace **`SDD.md`** with this:

````md
# Software Design Document (SDD)

## NexusSpace V1

**Version:** 1.0  
**Status:** Architecture Frozen  
**Target:** V1 Production Release

---

# 1. Purpose

This document defines the technical architecture of NexusSpace V1.

It is the engineering reference for:

- system boundaries
- application responsibilities
- learning architecture
- AI integration
- data ownership
- persistence
- frontend/backend communication
- security
- reliability
- deployment

The architecture is frozen for V1.

Implementation work must preserve this architecture unless a concrete correctness defect requires an explicit architectural decision.

---

# 2. System Overview

NexusSpace is an AI-assisted Learning Operating System.

The system separates responsibilities:

```text
AI
↓
Educational reasoning and content generation

Backend
↓
Application state, identity, authorization,
learning state, dependencies, persistence

Frontend
↓
User interaction and presentation
````

AI does not own deterministic application state.

The backend is the authoritative source of truth for:

* identity
* ownership
* curriculum structure
* ordering
* dependencies
* progress
* mastery
* unlock state
* persistence
* transactions

---

# 3. High-Level Architecture

```text
React Frontend
      ↓
REST API
      ↓
Express Backend
      ↓
Business Services
      ↓
MongoDB
```

AI generation is invoked by backend services through the provider abstraction.

```text
Business Service
      ↓
ProviderFactory
      ↓
IAIProvider
      ↓
Cerebras / Groq / Other Provider
      ↓
OmniRoute
```

MongoDB is accessed through Mongoose.

Production database:

```text
MongoDB Atlas
```

---

# 4. Locked Learning Architecture

The V1 learning architecture is:

```text
Learning Request
      ↓
Tier 1 — Units
      ↓
Tier 2 — Chapters
      ↓
Tier 3 — Lesson Nodes
      ↓
Tier 4 — Learning Experience
      ↓
Evaluation
      ↓
Learning Progress
      ↓
Unlock Logic
      ↓
Learning Planner
```

The four learning tiers MUST NOT be collapsed.

---

# 5. Tier 1 — Units

Tier 1 represents the high-level curriculum structure.

```text
Learning Request
      ↓
Unit 1
Unit 2
Unit 3
...
```

Units are generated during workspace/learning-request creation.

Tier 1 is responsible only for curriculum structure.

Tier 1 MUST NOT generate:

* Chapters
* Lesson Nodes
* Markdown
* Flashcards
* Quizzes
* Learning Experience content

Workspace creation generates the initial Units.

The frontend must not immediately invoke Tier 1 generation again after successful workspace creation.

Explicit Tier 1 regeneration remains a separate backend capability.

Destructive Tier 1 curriculum replacement is outside V1 because the current learning-history model does not yet provide a safe curriculum-version identity.

---

# 6. Tier 2 — Chapters

Tier 2 expands one selected Unit into Chapters.

```text
Unit
├── Chapter 1
├── Chapter 2
└── Chapter 3
```

Tier 2 is generated Just-In-Time.

Trigger:

```text
Learner selects Unit
```

Behavior:

```text
Existing Chapters?
    ↓
YES → return cached Chapters

NO → generate Chapters
     validate
     persist
     return
```

Tier 2 generates Chapters only.

It does not generate Lesson Nodes or Learning Experience content.

Tier 2 supports:

* caching
* explicit `forceRefresh`
* ownership validation
* schema validation
* safe regeneration
* stale-write protection

---

# 7. Tier 3 — Lesson Nodes

Tier 3 expands one selected Chapter into Lesson Nodes.

```text
Chapter
├── Lesson Node 1
├── Lesson Node 2
└── Lesson Node 3
```

Lesson Nodes contain metadata only:

```text
id
title
description
order
estimatedMinutes
generationStatus
```

Tier 3 does not generate:

* Markdown
* Flashcards
* Quiz content

Trigger:

```text
Learner selects Chapter
```

Behavior:

```text
Existing Lesson Nodes?
    ↓
YES → return cached Lesson Nodes

NO → generate Lesson Nodes
     validate
     persist
     return
```

Tier 3 supports:

* caching
* explicit `forceRefresh`
* ownership validation
* schema validation
* safe regeneration
* stale-write protection

---

# 8. Tier 4 — Learning Experience

Tier 4 represents the actual teaching experience for one Lesson Node.

Trigger:

```text
Learner selects Lesson Node
```

The system generates or loads:

```text
Markdown
Flashcards
Quiz
```

The semantic identity is:

```text
lessonId
```

A Chapter ID MUST NOT be used as the lesson identity.

The system must never fabricate lesson identity through values such as:

```text
subtopicId = "overview"
```

The Learning Experience endpoint supports:

* JIT generation
* caching
* forceRefresh
* schema validation
* DTO mapping
* transactional persistence where supported

---

# 9. AI Responsibility Boundary

AI is responsible for:

* curriculum reasoning
* educational content generation
* explanations
* examples
* analogies
* practice material
* semantic evaluation
* educational recommendations

AI is NOT responsible for:

* authentication
* authorization
* ownership
* identifiers
* database relationships
* ordering
* progress state
* mastery state
* unlock state
* transactions
* deterministic business rules

The backend must never delegate deterministic application state to an AI model.

---

# 10. AI Provider Architecture

The provider architecture is:

```text
ProviderFactory
      ↓
IAIProvider
      ↓
Provider Implementation
```

Supported/available providers include:

* Cerebras
* Groq
* Other compatible providers

OmniRoute acts as the external AI gateway/provider routing layer.

Provider-specific implementation details must remain behind the provider abstraction.

Business services must not become coupled to a specific provider.

---

# 11. AI Pipeline

Every AI generation path follows:

```text
Prompt
   ↓
Provider
   ↓
Raw AI Response
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

Schema validation must occur before persistence.

Business validation must occur before committing application state.

---

# 12. Lazy Generation

NexusSpace uses Just-In-Time generation.

The fundamental rule is:

```text
Do not generate downstream learning content
until the learner requests it.
```

Therefore:

```text
Workspace creation
→ Units

Unit selection
→ Chapters

Chapter selection
→ Lesson Nodes

Lesson Node selection
→ Learning Experience
```

GET requests are pure reads.

No GET endpoint may silently invoke AI generation.

Generated content is persisted and reused.

---

# 13. Caching

Generated educational artifacts are cached in persistent storage.

The general flow is:

```text
Request
   ↓
Check existing data
   ↓
Exists?
 ┌───────┴───────┐
YES              NO
 ↓                ↓
Return          Generate
cached          ↓
data            Validate
                ↓
                Persist
                ↓
                Return
```

`forceRefresh` is explicit.

Normal reads must not regenerate content.

---

# 14. Regeneration Safety

Regeneration must not intentionally leave orphaned AI-generated records.

Tier 2 regeneration cleans obsolete generated descendants belonging to replaced Chapters.

Tier 3 regeneration cleans obsolete generated learning assets belonging to replaced Lesson Nodes.

Regeneration MUST preserve:

* LearningProgress
* evaluation history
* attempts/submissions
* scores
* mastery/history
* manual Resources
* unrelated curriculum

Tier 1 destructive replacement is not implemented in V1.

---

# 15. Concurrency and Transaction Safety

Multi-document writes must be atomic where required.

MongoDB transactions are used when supported.

The system must also provide a safe fallback for MongoDB deployments that do not support transactions.

Concurrent generation must not allow stale curriculum state to overwrite newer state.

The implementation must avoid concurrent operations on the same MongoDB transaction session where MongoDB does not support them.

When a transaction is used:

```text
Start Session
      ↓
Start Transaction
      ↓
Perform dependent writes safely
      ↓
Commit
```

On failure:

```text
Rollback
```

No partially generated learning state may be committed.

---

# 16. Learning Engine

The learning engine is backend-owned.

```text
Learning Experience
      ↓
Evaluation
      ↓
Progress / Mastery
      ↓
Unlock Logic
      ↓
Next Learning
```

The backend determines:

* whether learning is complete
* mastery state
* whether dependencies are satisfied
* what becomes unlocked

AI may provide educational reasoning but does not directly mutate learning state.

---

# 17. Evaluation

Evaluation is responsible for measuring learner understanding.

The intended flow is:

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

Evaluation must not rewrite the lesson.

The current evaluator is concept/unit scoped.

Lesson-level evaluator identity is not introduced as part of the current architecture unless explicitly required.

Prompt-injection defenses must be applied to learner-controlled input sent to AI evaluation.

---

# 18. Progress

`LearningProgress` is the authoritative learning-state record.

Progress is backend-owned.

The system must maintain:

* completion
* mastery
* review state where supported
* unlock state
* learning history

AI-generated output must not directly overwrite authoritative progress.

---

# 19. Unlock Engine

Unlock logic is deterministic.

The backend evaluates:

```text
Current Progress
+
Prerequisites
+
Mastery
+
Dependency State
```

and determines what learning is available next.

AI must not bypass unlock requirements.

---

# 20. Learning Planner

The Planner operates after deterministic learning state has been established.

Its responsibility is to recommend the next useful learning step.

```text
Backend State
      ↓
Valid Learning Options
      ↓
Planner
      ↓
Recommendation
```

The Planner may use:

* graph state
* progress
* mastery
* dependencies

The Planner must not override backend unlock rules.

---

# 21. Resources

Resources are workspace-owned learning assets.

Resources must support appropriate:

* creation
* attachment
* retrieval
* update
* deletion
* ownership validation

Manual Resources must survive curriculum regeneration.

---

# 22. Frontend Architecture

Frontend stack:

```text
React 19
TypeScript
Vite
Tailwind CSS v4
React Router
Axios
```

The frontend is responsible for:

* authentication UI
* dashboard
* workspace navigation
* learning navigation
* Learning Experience presentation
* quiz interaction
* progress presentation
* loading/error/retry states
* responsive UI

The frontend does not own authoritative learning state.

---

# 23. Frontend Learning State Machine

`WorkspacePage` is the primary learning navigation state machine.

State:

```text
selectedUnit
selectedChapter
selectedLesson
```

Navigation:

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
```

Only Lesson Node selection opens TeacherStudio.

Selecting a Unit must not directly open TeacherStudio.

Selecting a Chapter must not directly open TeacherStudio.

---

# 24. Frontend API Responsibilities

The frontend API client must expose the current learning endpoints:

```text
getTier2Subtopics()
getTier3Lessons()
getLearningExperience()
```

Legacy lesson-generation clients must not be used by the current learning flow.

The Learning Experience request must contain the actual:

```text
lessonId
```

---

# 25. Difficulty

Difficulty selection is not part of V1 frontend UX.

There is no user-facing difficulty selector.

The backend may retain difficulty as an API capability.

V1 should target a consistent medium/balanced instructional depth.

Prompt refinement may occur after core V1 functionality is complete.

---

# 26. Security

Security responsibilities include:

* authentication
* authorization
* ownership validation
* request validation
* AI input validation
* prompt injection mitigation for learner-controlled AI inputs
* CORS
* security headers
* rate limiting where configured
* safe error handling

Every protected resource must verify ownership server-side.

The frontend must never be trusted to enforce authorization.

---

# 27. Data Integrity

The following invariants are mandatory:

```text
No cross-user data access.

No cross-workspace curriculum access.

No orphan AI-generated records from supported regeneration paths.

No learner-history deletion during regeneration.

No manual-resource deletion during regeneration.

No duplicate automatic Tier 1 generation.

No stale curriculum overwriting newer curriculum.

No fabricated Lesson identity.

No AI generation from GET requests.
```

---

# 28. Performance Strategy

V1 performance is based on simplicity and lazy generation.

Primary techniques:

* Just-In-Time AI generation
* persistent caching
* avoid unnecessary AI calls
* deterministic backend computation before AI
* provider abstraction
* bounded V1 monolithic architecture

V1 does not introduce:

* Redis
* queues
* background workers
* microservices
* distributed caches
* event buses

unless a concrete V1 correctness requirement requires reconsideration.

---

# 29. Deployment

Production architecture:

```text
Frontend
   ↓
Vercel

Backend
   ↓
Render

Database
   ↓
MongoDB Atlas

AI Gateway
   ↓
OmniRoute
```

The backend communicates with MongoDB through Mongoose.

---

# 30. Engineering Principles

1. One AI stage = one responsibility.
2. Backend owns deterministic state.
3. AI generates educational content, not application state.
4. Generate lazily.
5. Cache before generating.
6. Validate before persistence.
7. Persist generated artifacts for reuse.
8. No GET-triggered generation.
9. No fabricated identifiers.
10. Lesson identity is `lessonId`.
11. Preserve learner history during regeneration.
12. Do not intentionally leave orphan generated records.
13. Prefer small vertical changes.
14. Preserve working functionality.
15. Do not introduce speculative infrastructure.
16. Correctness takes priority over cleverness.
17. V1 must be completed before V2 expansion.

---

# 31. Architecture Freeze

The following are frozen for V1:

### Backend

* Express
* Mongoose
* MongoDB Atlas
* ProviderFactory
* IAIProvider
* existing AI provider integrations
* REST API
* service-oriented backend structure

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios

### Learning hierarchy

```text
Unit
→ Chapter
→ Lesson Node
→ Learning Experience
```

No tier may be removed or collapsed.

---

# 32. Explicitly Deferred

The following are outside the current V1 architecture:

* curriculum versioning
* destructive Tier 1 curriculum replacement
* progress migration between curriculum versions
* advanced adaptive learning
* RAG
* embeddings
* autonomous learning agents
* collaboration
* organizations
* social features
* analytics expansion
* native mobile application
* desktop application
* Redis
* queues
* background workers
* microservices
* enterprise infrastructure
* advanced distributed caching

---

# 33. Architecture Definition of Done

The architecture is considered implemented when:

1. The four-tier learning hierarchy works.
2. JIT generation works at each appropriate tier.
3. Generated content is persisted and reused.
4. GET endpoints remain pure reads.
5. Lesson identity is consistently represented by `lessonId`.
6. AI output is validated before persistence.
7. Backend owns deterministic learning state.
8. Regeneration does not create known orphan generated records.
9. Learner history survives supported regeneration.
10. Ownership is enforced.
11. Multi-document writes are safely persisted.
12. Provider abstraction remains intact.
13. Frontend and backend contracts are aligned.
14. The complete learning flow can be built on top of this architecture without architectural changes.

---

# 34. Final Architectural Principle

NexusSpace V1 is intentionally simple:

```text
AI
↓
Generate educational intelligence

Backend
↓
Own truth and state

Frontend
↓
Present the learning experience
```

The product becomes valuable through the interaction of:

```text
Structured Curriculum
        +
JIT Learning
        +
Persistent Learning Experience
        +
Evaluation
        +
Mastery
        +
Unlocking
        +
Next-Learning Recommendation
```

V1 optimizes for correctness, learning flow, and maintainability rather than premature scale.

```


