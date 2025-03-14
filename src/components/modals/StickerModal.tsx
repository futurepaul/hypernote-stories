import { createPortal } from "react-dom";
import { X, AtSign, StickyNote, Bot, Zap } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

interface Sticker {
  id: string;
  name: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const stickers: Sticker[] = [
  {
    id: "mention",
    name: "Mention",
    icon: <AtSign className="w-6 h-6" />,
  },
  {
    id: "note",
    name: "Note",
    icon: <StickyNote className="w-6 h-6" />,
  },
  {
    id: "dvmcp",
    name: "DVMCP",
    icon: <Bot className="w-6 h-6" />,
    disabled: true,
  },
  {
    id: "zap",
    name: "Zap",
    icon: <Zap className="w-6 h-6" />,
    disabled: true,
  },
];

// This defines the sticker filter templates and accessors
export const stickerDefinitions = {
  mention: {
    name: "Mention",
    filterTemplate: (pubkey: string) => ({ 
      kinds: [0], 
      authors: [pubkey], 
      limit: 1 
    }),
    accessors: ["content", "name", "picture", "nip05", "about"],
    params: [
      {
        key: "pubkey",
        label: "Nostr Public Key",
        placeholder: "Hex pubkey or npub...",
        helpText: "Enter a valid npub1... or hex public key",
      }
    ]
  },
  note: {
    name: "Note",
    filterTemplate: (id: string) => ({ 
      kinds: [1], 
      ids: [id], 
      limit: 1 
    }),
    accessors: ["content", "pubkey", "created_at"],
    params: [
      {
        key: "id",
        label: "Note ID",
        placeholder: "Hex ID or note1/nevent1...",
        helpText: "Enter a note1/nevent1 ID or 64-character hex event ID",
      }
    ]
  }
};

export function StickerModal() {
  const isStickerModalOpen = useEditorStore((state) => state.editorState.isStickerModalOpen);
  const closeStickerModal = useEditorStore((state) => state.closeStickerModal);
  const openStickerParamModal = useEditorStore((state) => state.openStickerParamModal);

  if (!isStickerModalOpen) return null;

  const handleStickerSelect = (stickerId: string) => {
    openStickerParamModal(stickerId);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300}}>
      <div className="bg-white rounded-md p-4 shadow-lg w-full max-w-md relative" style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Add Sticker</h3>
          <button onClick={closeStickerModal} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {stickers.map((sticker) => (
            <button
              key={sticker.id}
              disabled={sticker.disabled}
              className={cn(
                "group rounded-xl",
                sticker.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50"
              )}
              onClick={() => {
                if (!sticker.disabled) {
                  handleStickerSelect(sticker.id);
                }
              }}
            >
              <div className="flex gap-2 items-center p-4 border border-gray-200 rounded-xl">
                <div>
                  {sticker.icon}
                </div>
                <span className="text-sm font-bold">{sticker.name}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          disabled
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Your Own
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 