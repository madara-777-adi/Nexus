import { useState } from "react";
import { isAxiosError } from "axios";
import { workspaceApi } from "../../api/workspace.api";
import type { IWorkspace } from "../../types/workspace.types";
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
      });
      onWorkspaceCreated(response.data);
      setTitle("");
      setDescription("");
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "Failed to create workspace.",
        );
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to create workspace.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080A0F]/80 backdrop-blur-md p-4 transition-all">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-[#12141A] p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 modal-enter">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00E5FF]">
              Learning Hub
            </p>
            <h2 className="mt-1 font-neovision text-xl tracking-wide text-white">
              New Skill Blueprint
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl border border-gray-800 bg-[#181B22] p-2 text-gray-400 transition-all hover:border-gray-700 hover:text-white cursor-pointer flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs font-medium text-red-400 break-words">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Workspace Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Skill / Workspace Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems Architecture"
              className="w-full min-h-[44px] rounded-xl border border-gray-800 bg-[#181B22] p-3 text-sm text-white placeholder-gray-600 focus:border-[#00E5FF] focus:outline-none transition-colors"
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
              placeholder="Brief summary of topics covered in this blueprint..."
              rows={3}
              className="w-full min-h-[44px] rounded-xl border border-gray-800 bg-[#181B22] p-3 text-sm text-white placeholder-gray-600 focus:border-[#00E5FF] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800/80">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-gray-800 bg-[#181B22] px-4 py-2.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-neon-lime px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-midnight transition-all hover:bg-[#aef525] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>
                {loading ? "Initializing..." : "Create Skill Blueprint"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
