import { Schema, model, Document, Types } from "mongoose";

export enum WorkspaceVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export interface IWorkspace extends Document {
  workspaceId: string;
  title: string;
  description?: string;
  visibility: WorkspaceVisibility;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    workspaceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Workspace title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    visibility: {
      type: String,
      enum: Object.values(WorkspaceVisibility),
      default: WorkspaceVisibility.PRIVATE,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Workspace = model<IWorkspace>("Workspace", workspaceSchema);

export default Workspace;