import { useState } from "react";
import { workspaceApi } from "../../api/workspace.api";
import type { IWorkspace, WorkspaceVisibility } from "../../types/workspace.types";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: (workspace: IWorkspace) => void;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onWorkspaceCreated,
}: CreateWorkspaceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>("PRIVATE");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await workspaceApi.createWorkspace({
        title,
        description,
        visibility,
      });

      onWorkspaceCreated(response.data);
      setTitle("");
      setDescription("");
      setVisibility("PRIVATE");
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to create workspace.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-surface-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-neovision text-xl text-white tracking-wider">
            NEW WORKSPACE
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              Workspace Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Architecture Notes"
              className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workspace..."
              rows={3}
              className="bg-surface-border/30 border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as WorkspaceVisibility)}
              className="bg-[#0d1117] border border-surface-border text-white text-sm rounded-xl p-3 focus:outline-none focus:border-neon-lime transition-colors"
            >
              <option value="PRIVATE">Private (Only you)</option>
              <option value="PUBLIC">Public (Accessible to anyone with link)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-surface-border text-xs text-gray-300 font-semibold hover:bg-surface-border/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-neon-lime text-midnight font-bold px-5 py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}