import { Schema, model, Document, Types } from "mongoose";

export enum RelationshipType {
  DEPENDS_ON = "DEPENDS_ON", // Prerequisite (e.g., Recursion depends on Call Stack)
  USES = "USES", // Functional usage (e.g., TCP uses IP)
  EXTENDS = "EXTENDS", // Inheritance / Specialization
  PART_OF = "PART_OF", // Composition / Sub-concept
  RELATED_TO = "RELATED_TO", // Associative connection
  CONTRADICTS = "CONTRADICTS", // Opposing ideas (e.g., Mutex vs Semaphore)
}

export interface IRelationship extends Document {
  relationshipId: string;
  workspace: Types.ObjectId;
  sourceConcept: Types.ObjectId;
  targetConcept: Types.ObjectId;
  type: RelationshipType;
  description?: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const relationshipSchema = new Schema<IRelationship>(
  {
    relationshipId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    sourceConcept: {
      type: Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
      index: true,
    },
    targetConcept: {
      type: Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(RelationshipType),
      default: RelationshipType.RELATED_TO,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Relationship context cannot exceed 300 characters"],
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate edge of same type between exact same concepts in a workspace
relationshipSchema.index(
  { workspace: 1, sourceConcept: 1, targetConcept: 1, type: 1 },
  { unique: true },
);

// Bidirectional graph lookup index for target concepts
// Note: { workspace: 1, sourceConcept: 1 } is already covered by the unique compound index prefix above.
relationshipSchema.index({ workspace: 1, targetConcept: 1 });

const RelationshipModel = model<IRelationship>(
  "Relationship",
  relationshipSchema,
);

export default RelationshipModel;