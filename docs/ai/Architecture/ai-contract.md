Here is the design for **ECR-001.5: Freeze Topic Generation AI Contract**.

---

## 1. AI Input Contract

The AI receives only the necessary context required to break down a Tier 1 Concept into Tier 2 Topics without leaking internal application state.

```typescript
interface TopicGenerationInput {
  conceptTitle: string;
  conceptDescription?: string;
  learningProfile: "Casual" | "Intermediate" | "Serious";
  workspaceContext?: {
    workspaceTitle: string;
    workspaceDescription?: string;
  };
}

```

* **`conceptTitle`**: The title of the Tier 1 Concept being expanded.


* **`conceptDescription`**: Semantic details of the Concept to align focus.


* **`learningProfile`**: Controls the granularity and depth of topic decomposition without altering system architecture.


* **`workspaceContext`**: High-level domain context to ensure topics fit the broader subject area.



---

## 2. AI Output Contract

The raw output returned by the LLM contains strictly educational metadata. The AI does **not** supply database IDs, generation flags, or unlock rules.

```json
{
  "topics": [
    {
      "title": "string",
      "description": "string",
      "estimatedMinutes": "number"
    }
  ]
}

```

---

## 3. Backend-Owned Fields

The backend decorates and owns all operational application state before database persistence. The AI is forbidden from supplying or mutating these fields:

| Field Name | Ownership Authority | Purpose / Logic |
| --- | --- | --- |
| `id` | **Backend Service** | Deterministically generated UUID/Slug (`crypto.randomUUID()`) during DTO mapping. |
| `order` | **Backend Service** | Set deterministically based on array index position (`index + 1`). |
| `generationStatus` | **Backend Service** | Managed by backend state machine (`PENDING` $\rightarrow$ `GENERATING` $\rightarrow$ `COMPLETED` / `FAILED`). |
| `unlockRequirements` | **Backend Service** | Defaulted to structured rule objects (`{}`) owned by backend unlock engine. |

---

## 4. DTO Design

The DTO acts as the boundary transformer between raw AI output and domain model persistence, enforcing single responsibility.

```typescript
// Raw payload validated from AI response
export interface RawTopicAIOutputDTO {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface RawTopicResponseDTO {
  topics: RawTopicAIOutputDTO[];
}

// Internal Domain DTO populated after backend transformation
export interface PersistableTopicDTO {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  generationStatus: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  unlockRequirements: Record<string, unknown>;
}

```

---

## 5. JSON Schema (For Provider Enforcement / Structured Output)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "topics": {
      "type": "array",
      "minItems": 1,
      "maxItems": 10,
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "minLength": 3,
            "maxLength": 150
          },
          "description": {
            "type": "string",
            "minLength": 10,
            "maxLength": 500
          },
          "estimatedMinutes": {
            "type": "integer",
            "minimum": 1,
            "maximum": 120
          }
        },
        "required": ["title", "description", "estimatedMinutes"],
        "additionalProperties": false
      }
    }
  },
  "required": ["topics"],
  "additionalProperties": false
}

```

---

## 6. Validation Rules

Following the mandatory AI pipeline (`Prompt` $\rightarrow$ `Provider` $\rightarrow$ `Schema.parse()` $\rightarrow$ `Mapper` $\rightarrow$ `DTO` $\rightarrow$ `Business Validation` $\rightarrow$ `Transaction` $\rightarrow$ `Persistence`):

1. **Schema Parsing (`Zod` / JSON Schema):**
* Response must parse successfully against the JSON Schema.


* `topics` array must contain between $1$ and $10$ items.


2. **Business Rules:**
* `title` must be non-empty after trimming and under $150$ characters.
* `description` must provide meaningful educational context ($10$–$500$ characters).
* `estimatedMinutes` must be an integer between $1$ and $120$.


3. **Uniqueness:**
* Case-insensitive duplicate check on topic titles within the same concept array.



---

## 7. Failure & Retry Strategy

1. **Schema Validation Failure (Malformed AI Response):**
* **Retry:** Up to $1$ automated retry with corrected prompt instructions.
* **Fallback:** If validation fails twice, abort transaction, log error, and set status to `FAILED`. No partial topics saved.




2. **Provider Timeout / API Error:**
* Immediate rollback. No partial array modifications permitted.




3. **Atomic Guarantees:**
* Generation occurs inside an isolated state wrapper. The parent Concept document is updated in a single atomic database operation only after full validation and DTO transformation.





---

