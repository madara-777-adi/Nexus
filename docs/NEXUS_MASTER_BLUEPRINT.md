══════════════════════════════════════════════════════════════════════
                           NEXUS MASTER BLUEPRINT
══════════════════════════════════════════════════════════════════════

PRODUCT

Knowledge Operating System
        │
        ▼
Build → Connect → Understand → Learn → Grow


══════════════════════════════════════════════════════════════════════
SYSTEM FLOW
══════════════════════════════════════════════════════════════════════

User
 │
 ▼
Authentication
 │
 ▼
Dashboard
 │
 ▼
Workspace
 │
 ▼
Knowledge Graph
 │
 ├──────────────┐
 ▼              ▼
Resources     AI
 │              │
 └──────┬───────┘
        ▼
Learning Engine
        │
        ▼
Knowledge Evolution


══════════════════════════════════════════════════════════════════════
MODULES
══════════════════════════════════════════════════════════════════════

Identity
│
├── User
├── Verification Token
├── Password Reset Token
└── Session

────────────────────────────────────────

Workspace
│
└── Workspace

────────────────────────────────────────

Knowledge
│
├── Concept
├── Relationship
└── Tag

────────────────────────────────────────

Resources
│
└── Resource

────────────────────────────────────────

AI
│
├── Extraction
├── Suggestions
├── Summaries
├── Explanations
└── Recommendations

────────────────────────────────────────

Learning
│
├── Quiz
├── Progress
├── Revision
└── Weak Areas


══════════════════════════════════════════════════════════════════════
ENTITY RELATIONSHIPS
══════════════════════════════════════════════════════════════════════

User
 │ owns
 ▼
Workspace
 │ contains
 ▼
Concept
 │
 ├──────────────┐
 │              │
 │ references   │ connected by
 ▼              ▼
Resource     Relationship
 │
 ▼
Tag


══════════════════════════════════════════════════════════════════════
AUTHENTICATION FLOW
══════════════════════════════════════════════════════════════════════

Register
    │
Duplicate Check
    │
Hash Password
    │
Create User (Unverified)
    │
Generate Verification Token
    │
Resend Email
    │
Verify Email
    │
Account Activated
    │
Login
    │
JWT + Refresh Token
    │
Protected APIs


══════════════════════════════════════════════════════════════════════
WORKSPACE FLOW
══════════════════════════════════════════════════════════════════════

Create Workspace
        │
Update
        │
Archive
        │
Delete
        │
Recycle Bin
        │
Restore
        │
Permanent Delete


══════════════════════════════════════════════════════════════════════
KNOWLEDGE FLOW
══════════════════════════════════════════════════════════════════════

Create Concept
        │
Edit
        │
Attach Resources
        │
Connect Concepts
        │
Tag
        │
AI Suggestions
        │
Learning Ready


══════════════════════════════════════════════════════════════════════
RESOURCE FLOW
══════════════════════════════════════════════════════════════════════

Upload
 │
 ├── PDF
 ├── Image
 ├── Link
 ├── Markdown
 └── Video
 │
 ▼
Attach to Concept


══════════════════════════════════════════════════════════════════════
AI FLOW
══════════════════════════════════════════════════════════════════════

Resource
    │
Extract Concepts
    │
Suggest Relationships
    │
Generate Summary
    │
Explain Concept
    │
Recommend Missing Concepts
    │
Learning Engine


══════════════════════════════════════════════════════════════════════
LEARNING FLOW
══════════════════════════════════════════════════════════════════════

Knowledge Graph
        │
Generate Quiz
        │
Evaluate
        │
Progress
        │
Weak Areas
        │
Revision
        │
Knowledge Growth


══════════════════════════════════════════════════════════════════════
RECYCLE BIN
══════════════════════════════════════════════════════════════════════

Soft Delete
      │
Recycle Bin
      │
7 Days
      │
Restore
      │
Permanent Delete


══════════════════════════════════════════════════════════════════════
SERVICES
══════════════════════════════════════════════════════════════════════

Auth Service

Workspace Service

Knowledge Service

Resource Service

Learning Service

AI Service

Email Service

Search Service


══════════════════════════════════════════════════════════════════════
EXTERNAL SERVICES
══════════════════════════════════════════════════════════════════════

MongoDB Atlas

Resend

Gemini

Cloudinary (Future)

Redis (Future)


══════════════════════════════════════════════════════════════════════
BACKEND STRUCTURE
══════════════════════════════════════════════════════════════════════

src/

config/

modules/
    identity/
    workspace/
    knowledge/
    resource/
    learning/
    ai/

middleware/

services/

utils/

types/

constants/

server.ts


══════════════════════════════════════════════════════════════════════
BUILD ORDER
══════════════════════════════════════════════════════════════════════

1️⃣ Identity
        │
2️⃣ Workspace
        │
3️⃣ Knowledge
        │
4️⃣ Relationship
        │
5️⃣ Resource
        │
6️⃣ AI
        │
7️⃣ Learning
        │
8️⃣ Deployment


══════════════════════════════════════════════════════════════════════
MODULE COMPLETION CHECKLIST
══════════════════════════════════════════════════════════════════════

□ Entity

□ Schema

□ Validation

□ Service

□ Controller

□ Route

□ Middleware

□ Tests

□ Thunder Client

□ Documentation

□ Git Commit


══════════════════════════════════════════════════════════════════════
PRODUCT PRINCIPLES
══════════════════════════════════════════════════════════════════════

Knowledge > Notes

Concepts > Documents

Connections > Collections

Understanding > Memorization

AI Assists, Human Learns

Everything Evolves

Simple > Clever

Build Once. Scale Forever.

══════════════════════════════════════════════════════════════════════