import { useState } from "react";
import { workspaceApi } from "../../api/workspace.api";
import type { IWorkspace, WorkspaceVisibility } from "../../types/workspace.types";
import { X, Sparkles } from "lucide-react";

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
        err.response?.data?.message || err.message || "Failed to create workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080A0F]/80 backdrop-blur-md p-4 transition-all">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#12141A] p-6 shadow-2xl flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]">
              Learning Hub
            </span>
            <h2 className="text-base font-medium tracking-tight text-white mt-0.5">
              New Workspace Blueprint
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Workspace Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Workspace Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems Architecture"
              className="w-full rounded-xl border border-gray-800 bg-[#181B22] p-3 text-sm text-white placeholder-gray-600 focus:border-[#00E5FF] focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of concepts covered..."
              rows={3}
              className="w-full rounded-xl border border-gray-800 bg-[#181B22] p-3 text-sm text-white placeholder-gray-600 focus:border-[#00E5FF] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as WorkspaceVisibility)}
              className="w-full rounded-xl border border-gray-800 bg-[#181B22] p-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none transition-colors"
            >
              <option value="PRIVATE">Private (Only you)</option>
              <option value="PUBLIC">Public (Accessible via link)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-800 bg-[#181B22] px-4 py-2.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#BCFF3C] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#aef525] disabled:opacity-50 cursor-pointer"
            >
              {loading && <Sparkles className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? "Initializing..." : "Create Workspace"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}