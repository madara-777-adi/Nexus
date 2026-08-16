import { Schema, model, Document, Types } from "mongoose";

export interface IFlashcard extends Document {
  subtopicId: string; // Links directly to the 'id' of the ISubtopic in Layer 2
  lessonId: string; // Tier 4 identity: links to the 'id' of the ILessonNode in Layer 3
  concept: Types.ObjectId; // Parent Concept reference
  workspace: Types.ObjectId; // Parent Workspace reference
  owner: Types.ObjectId; // User who generated/owns this flashcard
  front: string; // Active recall question/prompt
  back: string; // Detailed technical answer
  
  // Future-proofing for Spaced Repetition (SRS)
  isMastered: boolean; 
  
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    subtopicId: {
      type: String,
      required: true,
      index: true,
    },
    lessonId: {
      type: String,
      required: true,
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
    front: {
      type: String,
      required: [true, "Flashcard front prompt is required"],
      trim: true,
    },
    back: {
      type: String,
      required: [true, "Flashcard back answer is required"],
      trim: true,
    },
    isMastered: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index: Quickly fetch all flashcards for a specific lesson
flashcardSchema.index({ concept: 1, lessonId: 1 });

// Index for future feature: Fetching all non-mastered flashcards for a user's workspace
flashcardSchema.index({ workspace: 1, owner: 1, isMastered: 1 });

const FlashcardModel = model<IFlashcard>("Flashcard", flashcardSchema);

export default FlashcardModel;