import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

interface FileUrlModalProps {
  onSave: (fileUrl: string, fileName: string) => void;
}

export function FileUrlModal({ onSave }: FileUrlModalProps) {
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isFileModalOpen = useEditorStore((state) => state.editorState.isFileModalOpen);
  const closeFileModal = useEditorStore((state) => state.closeFileModal);

  useEffect(() => {
    if (isFileModalOpen) {
      setFileUrl("");
      setFileName("");
      setError(null);
    }
  }, [isFileModalOpen]);

  const handleSave = () => {
    if (!fileUrl.trim()) {
      setError("File URL is required");
      return;
    }

    if (!fileName.trim()) {
      setError("File name is required");
      return;
    }

    // Basic URL validation
    try {
      new URL(fileUrl);
      onSave(fileUrl, fileName);
      closeFileModal();
    } catch (e) {
      setError("Please enter a valid URL");
    }
  };

  if (!isFileModalOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300 }}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Add File</h3>
          <button onClick={closeFileModal} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File URL
          </label>
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => {
              setFileUrl(e.target.value);
              setError(null);
            }}
            className="w-full border border-gray-300 rounded-md p-2"
            autoFocus
            placeholder="https://example.com/file.pdf"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Name
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              setError(null);
            }}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Document.pdf"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={closeFileModal}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add File
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 