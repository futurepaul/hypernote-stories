import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface BaseModalProps {
  title: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function BaseModal({
  title,
  isOpen,
  onClose,
  children,
  footer,
  maxWidth = "md"
}: BaseModalProps) {
  if (!isOpen) return null;

  // Map maxWidth to the appropriate Tailwind class
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full"
  }[maxWidth] || "max-w-md";

  const modalContent = (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 300 }}>
      <div className={`bg-white rounded-md p-4 shadow-lg w-full ${maxWidthClass} relative`} style={{ zIndex: 310 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="mb-4">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 