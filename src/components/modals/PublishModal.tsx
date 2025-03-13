import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Copy, Check } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { NDKEvent } from "@nostr-dev-kit/ndk";

export function PublishModal() {
  const [name, setName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const elements = useEditorStore((state) => state.elements);
  const isPublishModalOpen = useEditorStore((state) => state.editorState.isPublishModalOpen);
  const closePublishModal = useEditorStore((state) => state.closePublishModal);

  useEffect(() => {
    if (isPublishModalOpen) {
      setName("");
      setError(null);
      setIsPublishing(false);
      setPublishedEventId(null);
      setIsCopied(false);
    }
  }, [isPublishModalOpen]);

  const handleCopyEventId = async () => {
    if (publishedEventId) {
      try {
        await navigator.clipboard.writeText(publishedEventId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy event ID:", err);
      }
    }
  };

  const handlePublish = async () => {
    // Validate name is in kebab-case
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!kebabCaseRegex.test(name)) {
      setError("Name must be in kebab-case (lowercase letters, numbers, hyphens)");
      return;
    }

    setIsPublishing(true);
    try {
      // Get the nostr service
      const { nostrService } = await import("@/lib/nostr");
      
      // Check if NIP-07 signer is available
      const hasNip07Signer = await nostrService.checkNip07Signer();
      
      if (!hasNip07Signer) {
        throw new Error("No NIP-07 signer available. Please install a Nostr extension like nos2x or Alby.");
      }
      
      // Create the content object with the elements
      const content = JSON.stringify({
        elements: elements,
        version: "0.1-alpha"
      });
      
      // Create tags for the event
      const tags = [
        ["d", name], // Unique identifier for the hypernote
        ["t", "hypernote"],
        ["hypernote", "0.1-alpha"]
      ];
      
      // Create and publish the event
      const event = new NDKEvent(nostrService.ndkInstance);
      event.kind = 30078; // NIP-78 for application-specific data
      event.content = content;
      event.tags = tags;
      
      const success = await nostrService.publishEvent(event);
      
      if (!success) {
        throw new Error("Failed to publish hypernote");
      }
      
      // Store the event ID and show success state
      setPublishedEventId(event.id);
    } catch (err) {
      console.error("Error publishing hypernote:", err);
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isPublishModalOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300 }}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">
            {publishedEventId ? "Hypernote Published!" : "Publish Hypernote"}
          </h3>
          <button onClick={closePublishModal} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        {publishedEventId ? (
          // Success state
          <div className="mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <Check size={24} />
              </div>
            </div>
            
            <p className="text-center text-green-600 font-medium mb-4">
              Your Hypernote was published successfully!
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event ID
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={publishedEventId}
                  readOnly
                  className="w-full border border-gray-300 rounded-l-md p-2 bg-gray-50 text-sm font-mono overflow-hidden text-ellipsis"
                />
                <button
                  onClick={handleCopyEventId}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200 flex items-center justify-center"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={closePublishModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Publish form
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hypernote Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="my-awesome-hypernote"
                className="w-full border border-gray-300 rounded-md p-2"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Use kebab-case: lowercase letters, numbers, and hyphens
              </p>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={closePublishModal}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
                disabled={isPublishing}
              >
                {isPublishing ? "Publishing..." : "Publish"}
                {!isPublishing && <Send size={14} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 