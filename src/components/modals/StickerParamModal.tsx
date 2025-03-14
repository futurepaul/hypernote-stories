import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";

interface StickerParamModalProps {
  stickerId: string;
  stickerName: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (params: { [key: string]: string }) => void;
}

// Define parameter requirements for each sticker type
const stickerRequirements: Record<string, {
  label: string, 
  placeholder: string, 
  key: string,
  helpText?: string
}[]> = {
  mention: [
    {
      label: "Nostr Public Key (npub)",
      placeholder: "npub1...",
      key: "npub",
      helpText: "Enter a valid npub1... ID of a Nostr profile"
    },
  ],
  note: [
    {
      label: "Note ID",
      placeholder: "note1... or nevent1... or raw hex ID",
      key: "noteId",
      helpText: "Enter a note1/nevent1 ID or 64-character hex event ID"
    },
  ],
};

export function StickerParamModal({
  stickerId,
  stickerName,
  isOpen,
  onClose,
  onAdd,
}: StickerParamModalProps) {
  // Initialize state with empty values for each parameter
  const initParams = () => {
    const params: { [key: string]: string } = {};
    if (stickerRequirements[stickerId]) {
      stickerRequirements[stickerId].forEach((field) => {
        params[field.key] = "";
      });
    }
    return params;
  };

  const [params, setParams] = useState<{ [key: string]: string }>(initParams());

  if (!isOpen) return null;

  // Get fields for this sticker type
  const fields = stickerRequirements[stickerId] || [];

  const handleChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(params);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 400 }}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 410 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Add {stickerName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.key} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type="text"
                value={params[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-md p-2"
                required
              />
              {field.helpText && (
                <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 