export type WorkspaceVisibility = "PUBLIC" | "PRIVATE";

export interface IWorkspace {
  _id: string;
  workspaceId: string;
  title: string;
  description?: string;
  visibility: WorkspaceVisibility;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspacePayload {
  title: string;
  description?: string;
  visibility?: WorkspaceVisibility;
}

export interface UpdateWorkspacePayload {
  title?: string;
  description?: string;
  visibility?: WorkspaceVisibility;
}