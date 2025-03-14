import { useState, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { BaseModal } from "@/components/ui/base-modal";

interface FileUrlModalProps {
  onSave: (fileUrl: string, fileName: string) => void;
}

export function FileUrlModal({ onSave }: FileUrlModalProps) {
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const isFileModalOpen = useEditorStore(
    (state) => state.editorState.isFileModalOpen
  );
  const closeFileModal = useEditorStore((state) => state.closeFileModal);

  // Reset state when modal opens
  useEffect(() => {
    if (isFileModalOpen) {
      setFileUrl("");
      setFileName("");
      setError(null);
    }
  }, [isFileModalOpen]);

  const handleSave = () => {
    if (!fileUrl) {
      setError("Please enter a file URL");
      return;
    }

    if (!fileName) {
      setError("Please enter a file name");
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

  // Prepare footer buttons
  const modalFooter = (
    <>
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
    </>
  );

  return (
    <BaseModal 
      title="Add File"
      isOpen={isFileModalOpen}
      onClose={closeFileModal}
      footer={modalFooter}
    >
      <div>
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
      <div className="mt-4">
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
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </BaseModal>
  );
} 