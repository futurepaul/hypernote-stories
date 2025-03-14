import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { stickerDefinitions } from "./StickerModal";
import { decodeNostrId } from "@/lib/nostr";

interface StickerParamModalProps {
  stickerId: string;
  stickerName: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stickerType: string, filter: any, accessors: string[]) => void;
}

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
    const definition = stickerDefinitions[stickerId as keyof typeof stickerDefinitions];
    
    if (definition?.params) {
      definition.params.forEach((field) => {
        params[field.key] = "";
      });
    }
    return params;
  };

  const [params, setParams] = useState<{ [key: string]: string }>(initParams());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Get definition for this sticker type
  const definition = stickerDefinitions[stickerId as keyof typeof stickerDefinitions];
  if (!definition) {
    return null;
  }

  const handleChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setError(null); // Clear error on change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const processedParams: { [key: string]: string } = {};
      
      // Process each parameter based on its type (decode NIPs as needed)
      definition.params.forEach((param) => {
        const value = params[param.key];
        
        if (!value) {
          throw new Error(`${param.label} is required`);
        }
        
        // Process value (decode Nostr IDs if needed)
        let processedValue = value;
        
        // If it looks like a bech32 id (npub1, note1, etc.)
        if (/^(npub|note|nevent)1[0-9a-z]+$/i.test(value)) {
          try {
            const decoded = decodeNostrId(value);
            if (!decoded || !decoded.data) {
              throw new Error(`Invalid ${param.label} format`);
            }
            processedValue = decoded.data;
          } catch (e) {
            throw new Error(`Failed to decode ${param.label}: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }
        
        processedParams[param.key] = processedValue;
      });
      
      // Build the filter using the filterTemplate function
      const filterParams = Object.values(processedParams)[0]; // Most stickers just have one parameter
      const filter = definition.filterTemplate(filterParams);
      
      // Call onAdd with the new sticker parameters
      onAdd(stickerId, filter, definition.accessors);
      
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
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
          {definition.params.map((field) => (
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

          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

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