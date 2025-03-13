import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

interface VideoUrlModalProps {
  onSave: (videoUrl: string) => void;
}

export function VideoUrlModal({ onSave }: VideoUrlModalProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isVideoModalOpen = useEditorStore((state) => state.editorState.isVideoModalOpen);
  const closeVideoModal = useEditorStore((state) => state.closeVideoModal);

  useEffect(() => {
    if (isVideoModalOpen) {
      setVideoUrl("");
      setError(null);
    }
  }, [isVideoModalOpen]);

  const handleSave = () => {
    if (!videoUrl.trim()) {
      setError("Video URL is required");
      return;
    }

    // Basic URL validation
    try {
      new URL(videoUrl);
      onSave(videoUrl);
      closeVideoModal();
    } catch (e) {
      setError("Please enter a valid URL");
    }
  };

  if (!isVideoModalOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300 }}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Add Video</h3>
          <button onClick={closeVideoModal} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video URL
          </label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setError(null);
            }}
            className="w-full border border-gray-300 rounded-md p-2"
            autoFocus
            placeholder="https://example.com/video.mp4"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={closeVideoModal}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Video
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 