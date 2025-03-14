import { X, AtSign, StickyNote, Bot, Zap, Flower, ShoppingBag } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";
import { BaseModal } from "@/components/ui/base-modal";

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
    id: "blossom",
    name: "Blossom",
    icon: <Flower className="w-6 h-6" />,
  },
  {
    id: "product",
    name: "Product",
    icon: <ShoppingBag className="w-6 h-6" />,
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

// Define a type for the sticker parameter
export interface StickerParam {
  key: string;
  label: string;
  placeholder: string;
  helpText: string;
  required?: boolean;
}

// This defines the sticker filter templates and accessors
export const stickerDefinitions = {
  mention: {
    name: "Mention",
    filterTemplate: (pubkey: string, _unused?: string) => ({ 
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
        required: true
      }
    ] as StickerParam[]
  },
  note: {
    name: "Note",
    filterTemplate: (id: string, _unused?: string) => ({ 
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
        required: true
      }
    ] as StickerParam[]
  },
  product: {
    name: "Product",
    filterTemplate: (id: string, _unused?: string) => ({
      kinds: [30402],
      ids: [id],
      limit: 1
    }),
    accessors: ["content", "pubkey", "created_at", "tags"],
    params: [
      {
        key: "id",
        label: "Product Event ID",
        placeholder: "Hex ID or nevent1...",
        helpText: "Enter a product event ID (kind 30402)",
        required: true
      }
    ] as StickerParam[]
  },
  blossom: {
    name: "Blossom",
    filterTemplate: (hash: string, filename: string) => ({ 
      kinds: [1063], 
      '#x': [hash],
      limit: 1 
    }),
    accessors: ["url", "thumb", "filename", "pubkey", "created_at"],
    params: [
      {
        key: "url",
        label: "File URL",
        placeholder: "e.g. https://cdn.satellite.earth/e5f7aecd459ed76f5f4aca2ab218ca0336f10f99921385a96835ed8006a6411e.png",
        helpText: "Enter the URL of the file (must contain a SHA-256 hash)",
        required: true
      },
      {
        key: "filename",
        label: "Custom Filename (Optional)",
        placeholder: "e.g. my_image.png",
        helpText: "Custom filename for display purposes",
        required: false
      }
    ] as StickerParam[]
  }
};

export function StickerModal() {
  const isStickerModalOpen = useEditorStore((state) => state.editorState.isStickerModalOpen);
  const closeStickerModal = useEditorStore((state) => state.closeStickerModal);
  const openStickerParamModal = useEditorStore((state) => state.openStickerParamModal);

  const handleStickerSelect = (stickerId: string) => {
    openStickerParamModal(stickerId);
  };

  // Footer with Create Your Own button (disabled for now)
  const modalFooter = (
    <button
      disabled
      className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Create Your Own
    </button>
  );

  return (
    <BaseModal
      title="Add Sticker"
      isOpen={isStickerModalOpen}
      onClose={closeStickerModal}
      footer={modalFooter}
    >
      <div className="grid grid-cols-2 gap-4">
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
    </BaseModal>
  );
} 