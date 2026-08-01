# Software Design Document (SDD)
## NexusSpace V1

**Version:** 1.0 (Architecture Freeze)

## 1. Purpose
This document defines the technical design of NexusSpace V1 and serves as the engineering reference during implementation.

## 2. System Overview
NexusSpace is an AI-assisted Learning Operating System. AI designs curriculum and educational content while the backend controls deterministic behavior, persistence, progress and security.

## 3. High-Level Architecture
Frontend (React)
→ REST API
→ Express Backend
→ Business Services
→ MongoDB

AI is invoked only for reasoning or content generation.

## 4. Learning Engine
Workspace
→ Curriculum Architect
→ Curriculum Blueprint
→ Learning Architect
→ Concept Graph
→ Teacher
→ Learning Package
→ Evaluator
→ Reinforcement Coach (optional)
→ Learning Progress
→ Backend Unlock Engine
→ Learning Planner

## 5. AI Responsibilities
- Curriculum Architect: Generate curriculum once per workspace.
- Learning Architect: Generate concept graph once per module.
- Teacher: Generate one learning package per concept.
- Evaluator: Evaluate understanding and reasoning.
- Reinforcement Coach: Generate supplementary learning only when required.
- Learning Planner: Explain why the next concept should be learned.

## 6. Backend Responsibilities
Authentication, Authorization, Progress, Unlock Logic, Transactions, Dependency Resolution, Persistence, Ownership Validation and Caching.

## 7. Frontend Responsibilities
Authentication flow, Dashboard, Workspace, Graph Visualization, Learning Interface, Progress Display and Mobile-first UI.

## 8. AI Pipeline
Prompt
→ Provider
→ Schema Validation
→ Mapper
→ DTO
→ Business Validation
→ Transaction
→ Persistence

Raw AI output is never persisted directly.

## 9. Lazy Generation
Workspace → Curriculum only.
Module Open → Concepts only.
Concept Open → Learning Package only.
Evaluation → Feedback only.

Generated artifacts are cached and reused.

## 10. Learning Profiles
Casual
Intermediate
Serious

Profiles modify depth, not architecture.

## 11. Security
JWT, OAuth, Validation, Ownership Checks, Helmet, CORS, Rate Limiting, Transactions.

## 12. Performance
- Lazy AI generation
- Cache generated artifacts
- Compute before AI
- Prompt versioning
- Monolithic architecture
- Target ≤200 users

## 13. Engineering Principles
1. One AI stage = One responsibility.
2. Backend owns deterministic logic.
3. Cache before generation.
4. Compute before AI.
5. Validate before persistence.
6. Persist before regeneration.
7. One collection = One owner.
8. Every patch must preserve existing functionality.

## 14. Deployment
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas

## 15. Future Scope
Spaced repetition, collaboration, analytics, organizations, mobile app.

## 16. Definition of Done
- RC patches complete.
- Regression passes.
- Mobile-first UI complete.
- No critical or high severity defects.
- V1 specification satisfied.