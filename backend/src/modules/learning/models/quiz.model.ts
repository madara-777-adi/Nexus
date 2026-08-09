import { Schema, model, Document, Types } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[]; // Exactly 4 options
  answerIndex: number; // 0, 1, 2, or 3 representing the correct option
}

export interface IQuiz extends Document {
  subtopicId: string; // Links directly to the 'id' of the ISubtopic in Layer 2
  lessonId: string; // Tier 4 identity: links to the 'id' of the ILessonNode in Layer 3
  concept: Types.ObjectId; // Parent Concept reference
  workspace: Types.ObjectId; // Parent Workspace reference
  owner: Types.ObjectId; // User who generated/owns this quiz
  questions: IQuizQuestion[];
  
  // Progression Tracking
  passed: boolean;
  score?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: {
      type: String,
      required: [true, "Quiz question is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length === 4,
        "A quiz question must have exactly 4 options",
      ],
    },
    answerIndex: {
      type: Number,
      required: true,
      min: [0, "Answer index must be between 0 and 3"],
      max: [3, "Answer index must be between 0 and 3"],
    },
  },
  { _id: false } // Prevent Mongoose from creating separate ObjectIds for each question in the array
);

const quizSchema = new Schema<IQuiz>(
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
    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: [
        (val: IQuizQuestion[]) => val.length > 0,
        "A quiz must contain at least one question",
      ],
    },
    passed: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: A specific lesson should only have one master quiz payload
quizSchema.index({ concept: 1, lessonId: 1 }, { unique: true });

const QuizModel = model<IQuiz>("Quiz", quizSchema);

export default QuizModel;