import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

interface ImageUrlModalProps {
  onSave: (imageUrl: string) => void;
}

export function ImageUrlModal({ onSave }: ImageUrlModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isImageModalOpen = useEditorStore((state) => state.editorState.isImageModalOpen);
  const closeImageModal = useEditorStore((state) => state.closeImageModal);

  useEffect(() => {
    if (isImageModalOpen) {
      setImageUrl("");
      setError(null);
    }
  }, [isImageModalOpen]);

  const handleSave = () => {
    if (!imageUrl.trim()) {
      setError("Image URL is required");
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
      onSave(imageUrl);
      closeImageModal();
    } catch (e) {
      setError("Please enter a valid URL");
    }
  };

  if (!isImageModalOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300 }}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Add Image</h3>
          <button onClick={closeImageModal} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4">
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
        </div>
        
        <div className="flex justify-end gap-2">
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
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 