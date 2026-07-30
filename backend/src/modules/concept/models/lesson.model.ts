import { Schema, model, Document, Types } from "mongoose";

export interface ILesson extends Document {
  subtopicId: string; // Links directly to the 'id' of the ISubtopic in Layer 2
  concept: Types.ObjectId; // Parent Concept reference
  workspace: Types.ObjectId; // Parent Workspace reference
  owner: Types.ObjectId; // User who generated/owns this lesson
  markdownContent: string; // The high-density JIT generated content
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    subtopicId: {
      type: String,
      required: true,
      index: true,
    },
    concept: {
      type: Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
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
    markdownContent: {
      type: String,
      required: [true, "Markdown content is required for a lesson"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: A specific subtopic within a concept should only have one lesson payload
lessonSchema.index({ concept: 1, subtopicId: 1 }, { unique: true });

const LessonModel = model<ILesson>("Lesson", lessonSchema);

export default LessonModel;