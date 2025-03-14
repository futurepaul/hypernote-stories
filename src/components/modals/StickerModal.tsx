import { X, AtSign, StickyNote, Bot, Zap, Flower, ShoppingBag, MessageSquareQuote } from "lucide-react";
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
    id: "prompt",
    name: "Prompt",
    icon: <MessageSquareQuote className="w-6 h-6" />,
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

// Define interface for stickers with filters
export interface FilterBasedSticker {
  id: string;
  name: string;
  icon: React.ReactNode;
  filterTemplate: (mainParam: string, secondaryParam?: string) => Record<string, any>;
  accessors: string[];
  params: StickerParam[];
  methods?: undefined;
}

// Define interface for stickers with methods
export interface MethodBasedSticker {
  id: string;
  name: string;
  icon: React.ReactNode;
  methods: {
    [key: string]: {
      description?: string;
      eventTemplate: {
        [key: string]: any;
        kind: number;
        tags?: string[][];
        content?: string;
      };
    };
  };
  paramAccessors: string[];
}

// This defines the sticker filter templates and accessors
export const stickerDefinitions: (FilterBasedSticker | MethodBasedSticker)[] = [
  {
    id: "mention",
    name: "Mention",
    icon: <AtSign className="w-6 h-6" />,
    filterTemplate: (pubkey: string, _unused?: string) => ({ 
      kinds: [0], 
      authors: [pubkey] 
    }),
    accessors: ["profile.name", "profile.displayName", "profile.image", "profile.picture"],
    params: [
      {
        key: "pubkey",
        label: "Public Key",
        placeholder: "npub...",
        helpText: "Public key, npub, nprofile, etc. of the user",
        required: true
      }
    ] as StickerParam[]
  },
  {
    id: "note",
    name: "Note",
    icon: <StickyNote className="w-6 h-6" />,
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
  {
    id: "prompt",
    name: "Prompt",
    icon: <MessageSquareQuote size={24} />,
    methods: {
      comment: {
        eventTemplate: {
          kind: 1111, // NIP-22 comment
          content: "${content}", // Will be replaced with user input
          tags: [
            // Root event reference (uppercase for root scope per NIP-22)
            ["E", "${eventId}", "", "${pubkey}"],
            ["K", "${eventKind}"],
            ["P", "${pubkey}"],
            
            // Parent scope (same as root for top-level comments, lowercase per NIP-22)
            ["e", "${eventId}", "", "${pubkey}"],
            ["k", "${eventKind}"],
            ["p", "${pubkey}"]
          ]
        }
      }
    },
    paramAccessors: []
  },
  {
    id: "product",
    name: "Product",
    icon: <ShoppingBag className="w-6 h-6" />,
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
  {
    id: "blossom",
    name: "Blossom",
    icon: <Flower className="w-6 h-6" />,
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
];

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