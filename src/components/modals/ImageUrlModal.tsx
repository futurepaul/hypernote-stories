import { useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { BaseModal } from "@/components/ui/base-modal";

interface ImageUrlModalProps {
  onSave: (imageUrl: string) => void;
}

export function ImageUrlModal({ onSave }: ImageUrlModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const isImageModalOpen = useEditorStore(
    (state) => state.editorState.isImageModalOpen
  );
  const closeImageModal = useEditorStore((state) => state.closeImageModal);

  // Reset state when modal opens
  useEffect(() => {
    if (isImageModalOpen) {
      setImageUrl("");
      setError(null);
    }
  }, [isImageModalOpen]);

  const handleSave = () => {
    if (!imageUrl) {
      setError("Please enter an image URL");
      return;
    }

    // Very basic validation - could be improved
    if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      setError("Please enter a valid image URL (ending with jpg, png, gif, etc.)");
      return;
    }

    onSave(imageUrl);
    closeImageModal();
  };

  // Prepare footer buttons
  const modalFooter = (
    <>
      <button
        onClick={closeImageModal}
        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Add Image
      </button>
    </>
  );

  return (
    <BaseModal 
      title="Add Image"
      isOpen={isImageModalOpen}
      onClose={closeImageModal}
      footer={modalFooter}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Image URL
      </label>
      <input
        type="text"
        value={imageUrl}
        onChange={(e) => {
          setImageUrl(e.target.value);
          setError(null);
        }}
        className="w-full border border-gray-300 rounded-md p-2"
        autoFocus
        placeholder="https://example.com/image.jpg"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </BaseModal>
  );
} 