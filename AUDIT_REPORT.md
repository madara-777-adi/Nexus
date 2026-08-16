# NexusSpace: Comprehensive Architectural, Security, and Code Quality Audit

**Date of Audit:** August 17, 2026  
**Audited Repository:** `Nexus` (`/home/aditya/Desktop/Nexus`)  
**Audit Tooling:** CodeGraphContext (CGC) Graph Engine (FalkorDB / Cypher), Ripgrep, TypeScript Compiler (`tsc`), ESLint 9 Engine  
**Codebase Surface Area:** 283 Files | 452 Function Nodes | 68 Class Nodes | 3,302 Call Graph Edges | TypeScript / React / Express / MongoDB  

---

## Executive Summary

NexusSpace is an AI-powered adaptive learning operating system built as a full-stack TypeScript application (Node.js/Express backend + React 19/Vite frontend) utilizing MongoDB for state persistence, FalkorDB/CGC for code graph indexing, and multi-tier LLM inference providers (Groq SDK & Cerebras REST).

This audit provides a comprehensive, end-to-end evaluation covering architecture, dependency health, cryptographic and endpoint security, code smells, concurrency, resilience, and error handling. All findings are prioritized in an actionable matrix with concrete remediation plans.

---

## 1. High-Level Architecture & Dependency Health

```
                                  +---------------------------------------+
                                  |         Client (React 19 / Vite)      |
                                  | - AuthContext (HttpOnly Token Sync)   |
                                  | - TopicPathView & Chapter/Lesson View |
                                  | - TeacherStudio (Katex Markdown / Quiz)|
                                  +-------------------+-------------------+
                                                      |
                                           HTTPS / JSON REST / Cookies
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         Express Gateway (app.ts)      |
                                  | - Helmet & CORS Policy                |
                                  | - Rate Limiters (Auth / API / AI)     |
                                  | - Passport & Auth Middleware          |
                                  +-------------------+-------------------+
                                                      |
                 +-------------------+----------------+-------------------+-------------------+
                 |                   |                                    |                   |
                 v                   v                                    v                   v
     +-------------------+ +-------------------+              +-------------------+ +-------------------+
     |  Identity Module  | | Workspace Module  |              |  Concept & Graph  | |    AI Pipeline    |
     | - Auth Controller | | - Workspace Ctrl  |              | - Concept Module  | | - TeacherService|
     | - Email / Resend  | | - Blueprint Logic |              | - Relationship M. | | - Evaluator Svc |
     | - User / Tokens   | | - Cascade Manager |              | - Learning Svc    | | - Planner Svc   |
     +---------+---------+ +---------+---------+              +---------+---------+ +---------+---------+
               |                     |                                  |                     |
               +---------------------+----------------+-----------------+---------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |           Data & Inference Layer      |
                                  | - MongoDB ReplicaSet / Transactions   |
                                  | - ProviderFactory (Groq / Cerebras)   |
                                  +---------------------------------------+
```

### 1.1 End-to-End Execution Flow

1. **Authentication & Identity Flow:**
   - Entry points: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/google`, `GET /api/v1/auth/github`.
   - Security Boundary: Protected routes use `authMiddleware` which verifies the Bearer JWT from `Authorization` header and hydrates `req.user` via `User.findOne({ userId: payload.sub })`.
   - Token Lifecycle: Access tokens (in-memory on frontend, short-lived) + Refresh tokens (HttpOnly cookies, hashed with SHA-256 in MongoDB `RefreshToken` collection).

2. **Workspace Creation & AI Blueprint Orchestration:**
   - Entry point: `POST /api/v1/workspaces`.
   - Execution Flow: `WorkspaceController.create` $\rightarrow$ `WorkspaceService.createWorkspace` $\rightarrow$ `PlannerService.generateBlueprint` (executed outside DB transactions to prevent lock contention) $\rightarrow$ Atomic MongoDB transaction committing `Workspace`, `Concept` nodes, and `Relationship` dependency edges.

3. **3-Tier Just-In-Time (JIT) Pedagogical Generation Flow:**
   - **Tier 1 (Pillars):** Generated upon workspace creation or via `POST /api/v1/ai/teacher/tier1-modules`.
   - **Tier 2 (Chapters):** JIT loaded upon expanding a Unit via `POST /api/v1/ai/teacher/tier2-subtopics`. Populates `concept.topics`.
   - **Tier 3 (Lesson Nodes):** JIT loaded upon expanding a Chapter via `POST /api/v1/ai/teacher/tier3-lessons`. Populates `topics.$.lessons` and unlocks the first lesson.
   - **Learning Experience (Pillar 3 Content):** JIT generated via `POST /api/v1/ai/teacher/lesson-experience`. Atomically creates `Lesson` (markdown), `Flashcard` set, and `Quiz` questions.

4. **Submission Evaluation & Unlock Progression Cascade:**
   - Entry point: `POST /api/v1/ai/evaluator/evaluate`.
   - Flow: Pre-flight permission check $\rightarrow$ AI evaluation (`EvaluatorService`) $\rightarrow$ Server-side mastery score calculation $\rightarrow$ `LearningService.recordLessonEvaluationResult` $\rightarrow$ Unlocks next lesson $\rightarrow$ If chapter mastered $\rightarrow$ Unlocks next chapter $\rightarrow$ If unit mastered $\rightarrow$ Traverses `Relationship` DAG (`DEPENDS_ON`) and unlocks downstream concept units.

---

### 1.2 Architectural Health & Coupling Analysis

- **Bidirectional Domain Coupling (`Concept` $\longleftrightarrow$ `AI/Teacher`):**
  - `ConceptService` directly imports and calls `TeacherService` (`generateTopicsForConcept`).
  - `TeacherService` imports and manages `ConceptModel`, `LessonModel`, `FlashcardModel`, `QuizModel`, `LessonProgressModel`, and `LearningService`.
  - *Risk:* Creates a cyclical architectural coupling where domain data services depend on AI services and AI services directly execute raw DB transactions on core domain tables.
  - *Remediation:* Establish an explicit Application Orchestration Layer (Mediator Pattern) or Event-Driven pattern where `TeacherService` acts purely as an inference and domain-mapping engine, while persistence is coordinated by a dedicated domain command handler.

- **Inconsistent AI Provider Routing (ECR-001 Fragmentation):**
  - While `TeacherService` utilizes `ProviderFactory.getInstance().getTier...Provider()` to allow dynamic switching between Groq and Cerebras based on environment variables (`AI_TIER1_PROVIDER`, `AI_TIER2_PROVIDER`, `AI_TIER3_PROVIDER`), other AI services (`PlannerService`, `EvaluatorService`, `QuizGeneratorService`, `ResourceGeneratorService`) completely bypass `ProviderFactory` and directly import `groqProvider`.
  - *Remediation:* Refactor all AI services to obtain their providers from `ProviderFactory.getInstance()`.

- **Unused Heavy External Dependencies:**
  - `@google/genai` (`^2.13.0`) and `@google/generative-ai` (`^0.24.1`) are declared in `backend/package.json` but are completely obsolete following the migration to Groq/Cerebras. They are only referenced in dead schema files (`planner.schema.ts`, `teacher.schema.ts`).
  - *Remediation:* Remove unused Google AI packages from `backend/package.json` to reduce bundle weight and supply chain attack surface.

---

### 1.3 Dead Code, Orphan Functions & Unreferenced Exports (Verified via CGC)

The CGC Graph analysis (`find_dead_code`, `execute_cypher_query`) and workspace AST scanning identified the following dead code components:

| Category | File Path | Identifier / Node | Status & Impact |
| :--- | :--- | :--- | :--- |
| **Backend Service** | `backend/src/modules/ai/stream/sse.service.ts` | `SSEService` (`initStream`, `sendChunk`, `endStream`, `handleDisconnect`) | **Orphaned Class** (0 incoming call graph edges; SSE streaming was deferred). |
| **Backend Helper** | `backend/src/modules/ai/planner/planner.prompt.ts` | `buildExpandNodePrompt` | **Orphaned Function** (0 callers in entire backend). |
| **Backend Schemas** | `backend/src/modules/ai/teacher/teacher.schema.ts`<br>`backend/src/modules/ai/planner/planner.schema.ts`<br>`backend/src/modules/ai/evaluator/evaluator.schema.ts` | `TeacherTopicSchema`, `TeacherLessonSchema`, `PlannerSchema`, `BlueprintSchema`, `Tier3ExpansionSchema`, `EvaluationResultSchema` | **Unused Legacy Schemas** (Google Generative AI schema types not used by Groq/Cerebras JSON mode). |
| **Backend Validators**| `backend/src/modules/identity/validators/logout.validator.ts`<br>`backend/src/modules/identity/validators/refresh-token.validator.ts` | `logoutSchema`, `refreshTokenRequestSchema` | **Unreferenced Exports** (Auth routes parse cookies/body dynamically in controllers). |
| **Frontend Component**| `frontend/src/components/workspace/WorkspaceGraph.tsx` | `WorkspaceGraph` (Cyclomatic Complexity 38) | **Dead Component** (Unreferenced; replaced by `TopicPathView`). |
| **Frontend Component**| `frontend/src/components/workspace/SubtopicsDrawer.tsx` | `SubtopicsDrawer` | **Dead Component** (Unreferenced). |
| **Frontend Component**| `frontend/src/components/workspace/ModuleNode.tsx` | `ModuleNode` | **Dead Component** (Unreferenced). |
| **Frontend Component**| `frontend/src/components/workspace/ConceptNode.tsx` | `ConceptNode` | **Dead Component** (Only imported by dead `WorkspaceGraph.tsx`). |
| **Workspace Root** | `backend (copy)/`, `backend (copy).zip` | Directory & 142KB zip archive | **Stale Backup Leftovers** polluting workspace indexing. |

---

## 2. Security & Vulnerability Scan

### 2.1 Injection & Data Sanitization Scan
- **NoSQL Injection:** Parameter and request body validations are enforced using Zod across most endpoints. However:
  - `concept.routes.ts`: `GET /concepts/:conceptId`, `DELETE /concepts/:conceptId`, and `PATCH /concepts/:conceptId` missing parameter validation middleware (`validate(conceptParamsSchema, "params")`).
  - *Risk:* Malformed or object-injected parameter types could bypass strict string lookups if express query parsers are abused.
- **Cross-Site Scripting (XSS):**
  - Dynamic user-supplied values in HTML email templates (`firstName`) are passed through `escapeHtml()` in `shared/utils/escapeHtml.ts`.
  - Frontend markdown rendering in `TeacherStudio.tsx` uses `react-markdown` without `rehype-raw`, safely preventing script tag execution from unvalidated AI outputs.
- **Command / OS Injection:** No `child_process.exec`, `eval()`, or dynamic shell execution was found in application runtime code.

### 2.2 Authentication, Authorization & Session Management
- **Authorization Flow Integrity:**
  - Workspace, Concept, Relationship, and Resource CRUD services consistently enforce ownership checks:
    ```typescript
    if (!doc.owner.equals(userObjectId)) {
      throw new ForbiddenError("Access denied.");
    }
    ```
  - Pre-flight authorization check is implemented in `AIController.evaluateSubmission` via `learningService.assertLessonEvaluationAccess(...)` prior to invoking external AI inference, preventing resource exhaustion from unauthorized learners.
- **Rate Limiter Configuration:**
  - Multi-tier rate limiting using `express-rate-limit`:
    - `authLimiter`: 15 requests / 15 min.
    - `heavyAiLimiter`: 10 requests / 15 min.
    - `fastAiLimiter`: 30 requests / 1 min.
    - `standardApiLimiter`: 100 requests / 15 min.
  - *Vulnerability:* `/api/v1/auth/me` is not covered by `authLimiter` or `standardApiLimiter`.

### 2.3 Cryptography, Tokens & Secrets Management
- **Password Hashing:** Uses `bcrypt` with work factor `12`. Correctly checks password history to prevent reuse of the last 5 passwords.
- **Token Cryptography:**
  - Verification & Reset Tokens: 32 random bytes (`crypto.randomBytes(32).toString('hex')`) hashed with SHA-256 before storage in MongoDB.
  - Refresh Tokens: 64-character hex strings hashed with SHA-256 before DB insertion.
- **Environment Schema Strictness (`backend/src/config/env.ts`):**
  - Strict minimum lengths (32 chars) on `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
  - Required URL validation on `FRONTEND_URL`, `GOOGLE_CALLBACK_URL`, and `GITHUB_CALLBACK_URL`.

---

## 3. Code Smells & Technical Debt

### 3.1 DRY Violations & Duplicated Logic

1. **Standalone Mongo Transaction Fallback Boilerplate:**
   - The method `executeWithTransactionFallback` (approx. 35 lines) is copy-pasted identically across **5 different backend services**:
     - `backend/src/modules/identity/services/auth.service.ts`
     - `backend/src/modules/workspace/services/workspace.service.ts`
     - `backend/src/modules/concept/services/concept.service.ts`
     - `backend/src/modules/learning/services/learning.service.ts`
     - `backend/src/modules/ai/teacher/teacher.service.ts`
   - *Impact:* High maintenance overhead; bug fixes to transaction retry logic must be repeated in 5 locations.
   - *Fix:* Extract into a shared utility `shared/database/transactionRunner.ts`.

2. **Custom ID Generation:**
   - Handled via `generateUserId()` which randomly picks an adjective, noun, and 4-digit number. While human-readable, doing a `do { ... } while (await Model.exists({ ... }))` in application loops creates multiple round-trips under high concurrency.

### 3.2 God Classes & Complex Functions

| Function / Component | File Path | Cyclomatic Complexity | Lines of Code | Concerns |
| :--- | :--- | :---: | :---: | :--- |
| `WorkspacePage` | `frontend/src/pages/workspace/WorkspacePage.tsx` | **100** | 550 | Manages 14 pieces of state, 4 ref locks, toast notifications, layout rendering, URL params, navigation, and JIT AI triggers. |
| `recordLessonEvaluationResult` | `backend/src/modules/learning/services/learning.service.ts` | **44** | 160 | Handles multi-level progression: lesson scoring, chapter mastery check, next chapter unlocking, concept mastery check, and downstream DAG traversal. |
| `TeacherStudio` | `frontend/src/components/workspace/TeacherStudio.tsx` | **40** | 350 | Houses tab management, markdown rendering, quiz state, active recall modal, and submission evaluation. |
| `WorkspaceGraph` | `frontend/src/components/workspace/WorkspaceGraph.tsx` | **38** | 220 | Dead component containing complex React Flow graph rendering and edge layout calculations. |
| `generateLessonExperience` | `backend/src/modules/ai/teacher/teacher.service.ts` | **32** | 180 | Intertwines prompt creation, AI calls, multi-document cleanup, and 3-collection transactional upserts. |
| `createWorkspace` | `backend/src/modules/workspace/services/workspace.service.ts` | **25** | 170 | Coordinates ID generation, prompt invocation, fallback roadmapping, concept bulk-inserts, and relationship mapping. |

### 3.3 Type Safety & Overuse of `any`

- **Backend:** 33 explicit `: any` and 38 `as any` type assertions found in `backend/src`.
  - Example: `(req as any).user` used across controllers despite `types/express.d.ts` extending `Express.Request`.
  - Example: `toSafeUserDTO(user: any)` in `shared/utils/toSafeUserDTO.ts`.
- **Frontend:** ESLint flagged 28 errors and 1 warning:
  - 14 instances of `@typescript-eslint/no-explicit-any` (e.g. `IParsedLesson.assessment` in `types/learning.types.ts`, `DashboardPage.tsx`, `ProfilePage.tsx`, `CreateWorkspaceModal.tsx`).
  - 4 ESLint violations for `react-hooks/set-state-in-effect` (calling synchronous `setState` in `useEffect` causing cascading re-renders in `WorkspacePage.tsx`, `TeacherStudio.tsx`, `VerifyEmailPage.tsx`, `LoginForm.tsx`).

---

## 4. Error Handling, Concurrency & Resilience

### 4.1 Cascade Deletion Data Integrity Gap
- In `WorkspaceService.deleteWorkspace` (`backend/src/modules/workspace/services/workspace.service.ts`):
  ```typescript
  await Concept.deleteMany({ workspace: workspace._id }, options);
  await Relationship.deleteMany({ workspace: workspace._id }, options);
  await ResourceModel.deleteMany({ workspace: workspace._id }, options);
  await LearningProgressModel.deleteMany({ workspace: workspace._id }, options);
  await LessonModel.deleteMany({ workspace: workspace._id }, options);
  await FlashcardModel.deleteMany({ workspace: workspace._id }, options);
  await QuizModel.deleteMany({ workspace: workspace._id }, options);
  await Workspace.deleteOne({ _id: workspace._id }, options);
  ```
  - *Bug:* `LessonProgressModel` (`lesson-progress.model.ts`) is **omitted** from the deletion cascade.
  - *Impact:* When a workspace is deleted, all `LessonProgress` records remain orphaned in MongoDB forever.
- In `ConceptService.deleteConcept`: `LessonProgressModel` is likewise omitted from concept cascade cleanup.

### 4.2 AI Provider Client Instantiation Overhead
- In `backend/src/modules/ai/providers/groq.provider.ts`:
  ```typescript
  export const groqProvider = {
    generateJSON<T = any>(
      prompt: string,
      systemInstruction?: string,
      role: "organizer" | "teacher" = "teacher",
      options?: AIRequestOptions,
    ): Promise<T> {
      const provider =
        role === "organizer" ? GroqProvider.forTier1() : GroqProvider.forTier2();

      return provider.generate<T>(prompt, systemInstruction, options);
    },
  };
  ```
  - *Issue:* `GroqProvider.forTier1()` and `forTier2()` instantiate `new Groq({ apiKey, timeout: 30000 })` on **every single request**.
  - *Impact:* Bypasses internal HTTP keep-alive connection reuse of the `groq-sdk`, causing unnecessary socket allocations and latency spikes under load.

### 4.3 Database Connection Pool Configuration
- In `backend/src/config/database.ts`:
  - `mongoose.connect(env.MONGO_URI)` provides no connection pool options (`maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS`). Under production concurrent request spikes, default driver settings may cause connection exhaustion or timeouts.

### 4.4 Variable Hoisting in Loop Scope
- In `backend/src/modules/learning/services/learning.service.ts` (lines 304 & 431):
  - `var existsResult = await existsQuery;` is used inside a `do { ... } while (existsResult)` loop instead of `let existsResult;`.

---

## 5. Prioritized Action Matrix

| Severity | Module / File & Line | Issue Description | Recommended Fix |
| :--- | :--- | :--- | :--- |
| **HIGH** | `backend/src/modules/workspace/services/workspace.service.ts:300-315` | **Data Leak / Orphaned Records:** `deleteWorkspace` omits `LessonProgressModel.deleteMany({ workspace: workspace._id })` during cascade deletion. | Add `await LessonProgressModel.deleteMany({ workspace: workspace._id }, options)` to the transaction. |
| **HIGH** | `backend/src/modules/concept/services/concept.service.ts:165-185` | **Data Leak / Orphaned Records:** `deleteConcept` omits `LessonProgressModel.deleteMany({ concept: concept._id })` during cascade deletion. | Add `LessonProgressModel.deleteMany({ concept: concept._id }, options)` to `Promise.all`. |
| **HIGH** | `backend/src/modules/concept/routes/concept.routes.ts:32, 34, 40` | **Missing Parameter Validation:** `GET`, `PATCH`, and `DELETE` on `/concepts/:conceptId` do not apply `validate(conceptParamsSchema, "params")`. | Attach `validate(conceptParamsSchema, "params")` to all concept param routes. |
| **MEDIUM** | `backend/src/modules/ai/providers/groq.provider.ts:60-72` | **Socket / Allocation Waste:** `groqProvider.generateJSON` instantiates a `new Groq()` client on every function call. | Reuse persistent singleton instances of `GroqProvider` rather than instantiating per call. |
| **MEDIUM** | `backend/src/modules/ai/planner/planner.service.ts`<br>`backend/src/modules/ai/evaluator/evaluator.service.ts`<br>`backend/src/modules/ai/generator/*` | **Architectural Inconsistency:** Hardcoded direct imports of `groqProvider` bypass `ProviderFactory` and tier selection settings (`AI_TIER1_PROVIDER`, etc.). | Refactor services to obtain AI providers from `ProviderFactory.getInstance()`. |
| **MEDIUM** | `backend/src/modules/*/services/*.ts` | **DRY Violation:** `executeWithTransactionFallback` is identically duplicated across 5 service classes. | Extract into a shared `runTransactionWithFallback` utility function in `src/shared/database/`. |
| **MEDIUM** | `frontend/src/pages/workspace/WorkspacePage.tsx:150-160`<br>`frontend/src/components/forms/LoginForm.tsx:30`<br>`frontend/src/pages/auth/VerifyEmailPage.tsx:26` | **React Anti-Pattern:** Synchronous `setState` inside `useEffect` causes cascading re-renders and ESLint failures. | Refactor state initialization to derive values or schedule state updates in event handlers. |
| **LOW** | `frontend/src/components/workspace/WorkspaceGraph.tsx`<br>`frontend/src/components/workspace/SubtopicsDrawer.tsx`<br>`frontend/src/components/workspace/ModuleNode.tsx`<br>`frontend/src/components/workspace/ConceptNode.tsx` | **Dead UI Code:** Legacy visual graph and drawer components are unreferenced and unused. | Safely delete these orphaned components to reduce frontend bundle size. |
| **LOW** | `backend/src/modules/ai/stream/sse.service.ts`<br>`backend/src/modules/ai/planner/planner.prompt.ts:101` | **Dead Backend Code:** `SSEService` and `buildExpandNodePrompt` have 0 callers in the codebase. | Remove or archive unused SSE service and prompt builders. |
| **LOW** | `backend/package.json` | **Unused Dependencies:** `@google/genai` and `@google/generative-ai` are installed but obsolete. | Run `npm uninstall @google/genai @google/generative-ai` in `backend`. |
| **LOW** | `backend (copy)/`, `backend (copy).zip` | **Workspace Clutter:** Stale directory backup and zip archive in workspace root. | Delete `backend (copy)` and `backend (copy).zip`. |
| **LOW** | `backend/src/modules/learning/services/learning.service.ts:304, 431` | **Code Smell:** `var existsResult` used inside loop scope. | Replace `var` with `let` declared outside the loop. |
| **LOW** | `backend/src/config/database.ts` | **Missing Connection Tuning:** MongoDB connection does not specify pool size or timeout configurations. | Add `maxPoolSize: 50`, `minPoolSize: 5`, `serverSelectionTimeoutMS: 5000` to `mongoose.connect`. |
| **LOW** | `backend/src/app.ts:113` | **Code Hygiene:** Commented-out duplicate route `// app.use("/api/v1/ai", aiRoutes);`. | Remove commented-out line. |

---

## 6. Verification and Validation Guidelines

1. **Compilation & Build Validation:**
   ```bash
   cd backend && npx tsc --noEmit
   cd ../frontend && npx tsc --noEmit
   ```
2. **Linting Check:**
   ```bash
   cd frontend && npm run lint
   ```
3. **Graph Reconciliation:**
   ```bash
   cgc index --force
   ```
