import { useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { BaseModal } from "@/components/ui/base-modal";

interface VideoUrlModalProps {
  onSave: (videoUrl: string) => void;
}

export function VideoUrlModal({ onSave }: VideoUrlModalProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const isVideoModalOpen = useEditorStore(
    (state) => state.editorState.isVideoModalOpen
  );
  const closeVideoModal = useEditorStore((state) => state.closeVideoModal);

  // Reset state when modal opens
  useEffect(() => {
    if (isVideoModalOpen) {
      setVideoUrl("");
      setError(null);
    }
  }, [isVideoModalOpen]);

  const handleSave = () => {
    if (!videoUrl) {
      setError("Please enter a video URL");
      return;
    }

    // Very basic validation - could be improved
    if (!videoUrl.match(/^https?:\/\/.+\.(mp4|webm|ogv|mov)(\?.*)?$/i)) {
      setError("Please enter a valid video URL (ending with mp4, webm, etc.)");
      return;
    }

    onSave(videoUrl);
    closeVideoModal();
  };

  // Prepare footer buttons
  const modalFooter = (
    <>
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
    </>
  );

  return (
    <BaseModal 
      title="Add Video"
      isOpen={isVideoModalOpen}
      onClose={closeVideoModal}
      footer={modalFooter}
    >
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
    </BaseModal>
  );
} 