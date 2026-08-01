RC-006

Goal

Every logical operation either succeeds completely or rolls back completely.

Files

shared/db/withTransaction.ts   (new)

workspace.service.ts

learning.service.ts

concept.service.ts

teacher.service.ts

auth.service.ts (if needed)

Acceptance

□ No partial writes

□ Rollback on failure

□ Existing API unchanged

□ Existing frontend unchanged

□ Regression PASS


# AI Learning Architecture (V1 Final)

## Philosophy

NexusSpace is not an AI content generator.

NexusSpace is an AI-assisted Learning Operating System.

Artificial Intelligence is responsible only for tasks that require reasoning, curriculum design, explanation generation, or semantic evaluation.

All deterministic operations remain the responsibility of the backend.

Examples include:

- Progress calculation
- Unlock logic
- Dependency traversal
- Graph construction
- Ownership verification
- Authorization
- Transactions
- Ordering
- State management

AI is never responsible for application logic.

---

# Learning Pipeline

Every learner progresses through the following immutable pipeline.

Workspace
        ↓
Curriculum Design
        ↓
Concept Expansion
        ↓
Learning Experience
        ↓
Evaluation
        ↓
Reinforcement (if required)
        ↓
Progress Update
        ↓
Next Recommendation

Each stage has exactly one responsibility.

No stage performs the work of another stage.

---

# AI Responsibilities

## Stage 1 — Curriculum Architect

Purpose

Design the complete learning curriculum for a workspace.

Input

Workspace title
Workspace description
Learning goal

Output

A complete curriculum consisting of ordered top-level modules.

Responsibilities

- Identify prerequisites
- Identify major conceptual branches
- Determine logical ordering
- Avoid unnecessary fragmentation
- Avoid missing important foundational concepts

Rules

This stage executes exactly once per workspace.

The generated curriculum becomes the permanent foundation of that workspace.

Curriculum regeneration never occurs automatically.

---

## Stage 2 — Learning Architect

Purpose

Expand one curriculum module into teachable concepts.

Input

Workspace context

Selected module

Output

Ordered concepts belonging only to that module.

Responsibilities

- Break modules into teachable concepts
- Preserve logical dependency order
- Avoid concept duplication
- Produce enough concepts for meaningful learning

Rules

Executed only once per module.

Results are permanently stored.

No regeneration unless explicitly requested.

---

## Stage 3 — Teacher

Purpose

Teach exactly one concept.

Input

Single concept

Workspace context

Output

Lesson Package

Lesson Package consists of

- Learning objective
- Explanation
- Examples
- Analogies
- Illustrations (when useful)
- Common mistakes
- Summary
- Reflection
- Flashcards
- Practice Questions

Rules

Exactly one Lesson Package exists for one concept.

Never regenerate automatically.

---

## Stage 4 — Evaluator

Purpose

Measure learner understanding.

Evaluation should measure reasoning rather than recognition.

Evaluation consists of

Stage A

Quick knowledge verification.

Example

Multiple Choice Questions

Stage B

Concept explanation in learner's own words.

The learner explains the concept.

AI evaluates

- understanding
- misconceptions
- completeness
- confidence

Output

Mastery Score

Weak Areas

Strengths

Improvement Suggestions

Rules

Evaluation never modifies lessons.

Evaluation only measures learning.

---

## Stage 5 — Reinforcement Coach

Purpose

Provide additional help only when required.

Input

Evaluation result

Output

Additional explanation

Additional examples

Additional practice

Alternative analogy

Rules

The original lesson never changes.

Only supplementary learning material is generated.

If mastery is sufficient, this stage is skipped entirely.

---

# Backend Responsibilities

The backend is the source of truth.

The backend is responsible for

- Authentication
- Authorization
- Transactions
- Progress calculation
- Unlock logic
- Graph traversal
- Dependency validation
- Ordering
- Ownership verification
- Caching
- Persistence

No AI call should ever perform deterministic backend work.

---

# AI Pipeline Standard

Every AI service must follow the same lifecycle.

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

Raw AI responses must never be persisted directly.

Every AI response must pass schema validation before reaching business logic.

---

# AI Call Policy

Each AI call has exactly one responsibility.

Large multi-purpose prompts are prohibited.

AI calls must be

- deterministic
- cacheable
- independent
- versioned

---

# Cache Policy

Generated content is permanent.

Curriculum

Generate once.

Store forever.

Module Concepts

Generate once.

Store forever.

Lesson Package

Generate once.

Store forever.

Resources

Generate once.

Store forever.

Regeneration only occurs through an explicit user action.

---

# Prompt Versioning

Every generated artifact stores

- promptVersion
- model
- generatedAt

Future prompt improvements must never silently overwrite existing learner content.

---

# Engineering Principles

1. Cache before Generation.

2. Compute before AI.

3. Validate before Persistence.

4. Persist before Regeneration.

5. One AI Call = One Responsibility.

6. One Stage = One Collection Owner.

7. AI assists learning.
   The backend controls the system.

8. Every stage must be independently testable.

9. Every stage must be independently replaceable.

10. AI should improve understanding, never replace understanding.

---

# V1 Constraints

Target Scale

≤ 200 registered users

≤ 50 concurrent users

Architecture is intentionally optimized for correctness, maintainability, and educational quality rather than enterprise-scale infrastructure.

No Redis.

No Queues.

No Microservices.

No Background Workers.

No Event Bus.

No Distributed Cache.

No Horizontal Scaling.

No unnecessary complexity.

Engineering decisions should remain proportional to V1 requirements.
