import { Schema, model, Document, Types } from "mongoose";

export interface IConcept extends Document {
  conceptId: string;
  workspace: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conceptSchema = new Schema<IConcept>(
  {
    conceptId: {
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
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Concept title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure fast lookup of concepts within a workspace
conceptSchema.index({ workspace: 1, title: 1 });

const ConceptModel = model<IConcept>("Concept", conceptSchema);

export default ConceptModel;