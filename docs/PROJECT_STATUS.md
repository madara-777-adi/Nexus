Start with **`PROJECT_STATUS.md`**. This is the document that has drifted the most from reality, so we should make it the operational source of truth first.

Replace its contents with this:

````md
# NexusSpace V1 — Project Status

## Status

Architecture: **Frozen**
Implementation: **In Progress**
Current Phase: **Frontend Integration**
Target: **Production-Ready V1**

Last Updated: August 2026

---

# 1. V1 Architecture

NexusSpace is an AI-assisted Learning Operating System.

The locked learning architecture is:

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
Unlock / Next Learning
````

### Tier 1 — Units

High-level curriculum structure.

Generated when creating/planning a learning request.

Tier 1 MUST NOT generate:

* Chapters
* Lesson Nodes
* Lesson content
* Flashcards
* Quizzes

---

### Tier 2 — Chapters

Chapters belonging to a selected Unit.

Generated Just-In-Time when the learner opens a Unit.

Each Chapter initially contains:

```text
lessons: []
```

Tier 2 MUST NOT generate actual lesson content.

---

### Tier 3 — Lesson Nodes

Multiple learnable lessons belonging to a selected Chapter.

Generated Just-In-Time when the learner opens a Chapter.

Lesson Nodes contain metadata only:

```text
id
title
description
order
estimatedMinutes
generationStatus
```

Tier 3 MUST NOT generate:

* Markdown
* Flashcards
* Quiz content

---

### Tier 4 — Learning Experience

Triggered only when the learner selects a specific Lesson Node.

Generates or loads:

* Markdown content
* Flashcards
* Quiz

The semantic identity of the learning experience is:

```text
lessonId
```

Chapter ID MUST NEVER be used as the lesson identity.

---

# 2. Backend Status

The backend architecture is implemented and frozen.

Architecture:

```text
Unit
  ↓
Chapter
  ↓
LessonNode
  ↓
Learning Experience
```

Provider architecture:

```text
ProviderFactory
      ↓
IAIProvider
      ↓
Cerebras / Groq / Other Providers
```

OmniRoute is used as the external AI gateway/provider routing layer.

MongoDB Atlas is the application database.

Mongoose is the MongoDB ODM.

---

## Backend Foundation

### Implemented

* Authentication
* Workspace CRUD
* Concept/Unit CRUD
* Relationship system
* Resource system
* AI provider abstraction
* Tier 1 generation
* Tier 2 JIT generation
* Tier 3 JIT generation
* Learning Experience JIT generation
* Backend-owned identifiers
* Ownership validation
* AI schema validation
* AI caching
* Transactional persistence where supported
* Deployment configuration

---

# 3. Backend AI Endpoints

## Tier 1

```text
POST /api/v1/ai/teacher/tier1-modules
```

Generates Unit-level curriculum structure.

No automatic downstream generation.

---

## Tier 2

```text
POST /api/v1/ai/teacher/tier2-subtopics
```

Behavior:

* JIT
* Cached
* forceRefresh supported
* difficulty support exists at the backend contract level
* generates Chapters only
* obsolete generated descendants are cleaned during explicit regeneration

---

## Tier 3

```text
POST /api/v1/ai/teacher/tier3-lessons
```

Behavior:

* JIT
* Cached
* forceRefresh supported
* difficulty support exists at the backend contract level
* generates Lesson Node metadata only
* obsolete generated descendants are cleaned during explicit regeneration

---

## Learning Experience

```text
POST /api/v1/ai/teacher/lesson-experience
```

Behavior:

* JIT
* Cached by semantic lesson identity
* forceRefresh supported
* transactional persistence when MongoDB supports transactions
* generates Markdown + Flashcards + Quiz

The request must use:

```text
conceptId
chapterId
lessonId
workspaceId
workspaceTitle
moduleTitle
chapterTitle
lessonTitle
difficulty
forceRefresh
```

The frontend MUST use the actual `lessonId`.

Legacy fabricated identities such as:

```text
subtopicId: "overview"
```

are prohibited.

---

# 4. Backend Reliability Status

The regeneration/reliability sprint is complete.

### Verified

* Tier 1 duplicate generation issue fixed
* Tier 2 obsolete descendant cleanup
* Tier 3 obsolete descendant cleanup
* LearningProgress preserved
* Evaluation/history preserved
* Manual Resources preserved
* Unrelated curriculum preserved
* Race-condition protection
* Transaction-safe sequential persistence
* Standalone MongoDB transaction fallback
* No orphan generated learning records in tested regeneration paths

### Verification

```text
Integration tests: 8/8 PASS
Second integration run: 8/8 PASS
Backend build: PASS
```

The backend regeneration area is now considered **closed** unless a new defect is discovered.

Do not redesign or revisit this area without a concrete failing requirement.

---

# 5. Frontend Status

Frontend stack:

* React 19
* TypeScript
* Vite
* Tailwind CSS v4
* React Router
* Axios

The frontend is currently being migrated from the legacy learning flow to the locked four-tier architecture.

---

## Current Legacy Flow

The previous frontend flow was approximately:

```text
Dashboard
  ↓
Workspace
  ↓
Units
  ↓
TeacherStudio
  ↓
Legacy Lesson Experience
```

This is no longer the target architecture.

---

## Target Frontend Flow

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

Only a Lesson Node can open the actual learning experience.

---

# 6. Frontend Work Completed

### Types

Implemented:

```text
ILessonNode
```

Extended:

```text
IConceptTopic.lessons
IConceptTopic.unlockRequirements
```

Added:

```text
LessonDifficulty
LearningExperiencePayload
```

---

# 7. Frontend Work Remaining

## Phase 1 — API Client

Required:

```text
getTier2Subtopics()
getTier3Lessons()
getLearningExperience()
```

Remove the legacy:

```text
getTier3Lesson()
```

The API client must match the current backend contracts.

---

## Phase 2 — Workspace State Machine

WorkspacePage must use:

```text
selectedUnit
selectedChapter
selectedLesson
```

instead of the legacy:

```text
selectedConcept
```

WorkspacePage must retrieve the real workspace title through:

```text
getWorkspaceById()
```

Existing:

* refreshKey
* toast system
* loading state
* error state

must be preserved.

---

## Phase 3 — Unit UI

`TopicPathView` becomes the Unit selector.

Selecting a Unit MUST open the Chapter level.

It MUST NOT directly open TeacherStudio.

---

## Phase 4 — Chapter UI

Create:

```text
ChapterListView.tsx
```

Behavior:

```text
Unit selected
    ↓
existing chapters?
    ├── yes → display
    └── no  → POST tier2-subtopics
```

Generated Chapters must remain cached.

---

## Phase 5 — Lesson UI

Create:

```text
LessonListView.tsx
```

Behavior:

```text
Chapter selected
    ↓
existing lessons?
    ├── yes → display
    └── no  → POST tier3-lessons
```

Generated Lesson Nodes contain metadata only.

---

## Phase 6 — Learning Experience

TeacherStudio must request:

```text
POST /api/v1/ai/teacher/lesson-experience
```

using the actual:

```text
lessonId
```

TeacherStudio remains responsible for displaying:

* Markdown
* Flashcards
* Quiz

Existing `ActiveRecallModal` may be reused.

---

# 8. Difficulty

Difficulty selection is **NOT part of V1 frontend UX**.

The current V1 decision is:

```text
No difficulty selector
```

Do not add difficulty UI.

Do not redesign backend persistence for difficulty.

If the backend contract currently accepts difficulty, the frontend may use the backend's established default behavior.

Prompt refinement for a consistent medium/balanced learning depth will be handled separately after the core product is complete.

---

# 9. Learning Engine — Remaining

The learning engine is not yet considered complete.

Remaining work:

```text
Progress Engine
Unlock Engine
Lesson Completion
Quiz Completion Rules
Flashcard Review Flow
AI Failure UX
```

The backend remains authoritative for:

* Progress
* Mastery
* Unlock logic
* Dependency resolution
* Persistence
* Learning state

---

# 10. Evaluation — Remaining Verification

The evaluator must eventually support:

```text
Submission
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

The current evaluator is concept/unit scoped.

It accepts:

```text
conceptId
conceptTitle
```

and does not currently accept `lessonId`.

This is intentionally NOT being redesigned during the current V1 completion phase.

Future evaluator identity refinement is an explicit architectural decision.

---

# 11. Planner — Remaining

The Learning Planner is a later V1 task.

Required behavior:

```text
Backend determines WHAT comes next
        ↓
Planner explains WHY
```

Planner output must consider:

* graph state
* mastery/progress
* dependency state

No planner redesign should occur before the learning/progress engine is functional.

---

# 12. Frontend Hardening — Remaining

After the complete learning flow works:

* Loading states
* Error states
* Retry actions
* Progress UI
* Mobile responsiveness
* Touch accessibility
* Empty states
* Regeneration UX
* Final UX polish

No feature expansion is permitted during V1.

---

# 13. Testing — Remaining

Final V1 verification must cover:

## Backend

* Authentication
* Workspace lifecycle
* Unit generation
* Chapter generation
* Lesson Node generation
* Learning Experience generation
* Evaluation
* Progress
* Unlocking
* Resource behavior
* Ownership
* Failure handling
* Regeneration
* Transaction behavior

## Frontend

* Authentication flow
* Dashboard
* Workspace
* Unit navigation
* Chapter navigation
* Lesson navigation
* TeacherStudio
* Quiz
* Evaluation
* Progress
* Error handling
* Retry
* Mobile layout

## End-to-End

The complete learning journey must work:

```text
Register/Login
      ↓
Create Workspace
      ↓
Generate Units
      ↓
Open Unit
      ↓
Generate Chapters
      ↓
Open Chapter
      ↓
Generate Lesson Nodes
      ↓
Open Lesson Node
      ↓
Generate Learning Experience
      ↓
Study
      ↓
Flashcards
      ↓
Quiz
      ↓
Evaluation
      ↓
Progress Update
      ↓
Unlock / Next Learning
```

---

# 14. V1 Release Gates

NexusSpace V1 is complete only when:

```text
Feature Complete              PASS
Regression Tests              PASS
Security                       PASS
Mobile                         PASS
Engineering Quality            PASS
Learning Flow                  PASS
No Critical Bugs               PASS
No High Severity Bugs          PASS
```

The complete learning flow must work without manual intervention.

---

# 15. V2 — Explicitly Deferred

The following are NOT V1 work:

* Adaptive learning
* Learning Coach Agent
* Advanced agentic learning
* RAG
* Embeddings
* Voice
* Collaboration
* Organizations
* Social features
* Gamification
* Analytics
* Search expansion
* Integrations
* Mobile application
* Desktop application
* Redis
* Queues
* Background workers
* Microservices
* Enterprise infrastructure

V1 must be completed before V2 begins.

---

# 16. Current Execution Order

The remaining work must proceed in this order:

```text
1. Complete frontend 4-tier integration
        ↓
2. Verify Learning Experience end-to-end
        ↓
3. Complete Evaluation flow
        ↓
4. Complete Progress Engine
        ↓
5. Complete Unlock Engine
        ↓
6. Complete Lesson / Quiz / Flashcard completion rules
        ↓
7. Complete Planner
        ↓
8. Frontend loading/error/retry/progress UX
        ↓
9. Mobile verification
        ↓
10. Full regression testing
        ↓
11. Production verification
        ↓
12. V1 RELEASE
```

---

# 17. Engineering Rules

These rules remain locked:

1. Backend owns application state.
2. AI owns educational content.
3. One AI stage = one responsibility.
4. Generate lazily.
5. Cache generated artifacts.
6. Validate AI output before persistence.
7. Every multi-document persistence operation must be atomic.
8. No orphan generated records.
9. GET requests are pure reads.
10. GET requests must never silently invoke AI generation.
11. Backend owns identifiers.
12. Lesson identity is `lessonId`.
13. Do not collapse the four learning tiers.
14. Do not introduce speculative abstractions.
15. Do not redesign frozen backend architecture.
16. Prefer small vertical slices.
17. Verify every implementation slice with build/tests.
18. V1 before V2.
19. Correctness over cleverness.
20. No feature expansion during V1.

---

# 18. Current Status Summary

```text
Architecture                     FROZEN
Backend Foundation              IMPLEMENTED
AI Provider Layer               IMPLEMENTED
Tier 1                          IMPLEMENTED
Tier 2                          IMPLEMENTED
Tier 3                          IMPLEMENTED
Learning Experience             IMPLEMENTED
Regeneration Reliability        VERIFIED
Orphan Prevention               VERIFIED
Transaction Reliability         VERIFIED
Backend Build                   PASS
Backend Integration Tests       8/8 PASS

Frontend 4-Tier Flow             IN PROGRESS
Learning Engine                  IN PROGRESS
Evaluation                       IN PROGRESS
Planner                          NOT COMPLETE
Frontend Hardening               NOT COMPLETE
Final Integration Testing        NOT COMPLETE
Production V1 Release            NOT COMPLETE
```

---

# V1 Completion Definition

NexusSpace V1 is complete when the learner can enter the system and complete the entire journey:

```text
Workspace
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
Mastery / Progress
   ↓
Unlock
   ↓
Next Learning
```

with correct persistence, no orphan generated records, reliable failure handling, and a usable desktop/mobile frontend.

Until that journey works end-to-end, V1 remains **IN PROGRESS**.

```

**This should become the operational status document.** It deliberately does not pretend the old roadmap is still accurate.

After you paste/update this one, send me the result or just say **next**. Then we'll finalize **`V1_SPECIFICATION.md`**—one document at a time.
```
