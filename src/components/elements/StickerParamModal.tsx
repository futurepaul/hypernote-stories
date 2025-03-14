import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { AtSign, StickyNote, File as FileIcon, Flower, X } from "lucide-react";
import { useNostrProfileQuery, useNostrNoteQuery, useNostrFileMetadataQuery } from "@/queries/nostr";

// Define interface for the component props
interface StickerParamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: any; // Simplified type to avoid dependency issues
  stickerType?: string;
}

// Icons for different sticker types
const StickerIcon = ({ stickerType }: { stickerType: string }) => {
  switch (stickerType) {
    case "mention":
      return <AtSign className="w-5 h-5 text-blue-500" />;
    case "note":
      return <StickyNote className="w-5 h-5 text-yellow-600" />;
    case "blossom":
      return <Flower className="w-5 h-5 text-green-600" />;
    default:
      return <FileIcon className="w-5 h-5 text-gray-600" />;
  }
};

// Get readable label for sticker type
const getStickerLabel = (stickerType: string): string => {
  switch (stickerType) {
    case "mention":
      return "Mention";
    case "note":
      return "Note";
    case "blossom":
      return "Blossom File";
    default:
      return "Sticker";
  }
};

// Function to get the filter template for a specific sticker type
function getFilterTemplate(stickerType: string, values: Record<string, any>) {
  switch (stickerType) {
    case "mention":
      return { kinds: [0], authors: [values.npub] };
    case "note":
      return { kinds: [1], ids: [values.noteId] };
    case "blossom":
      return { 
        kinds: [1063], 
        "#x": [values.hash]
      };
    default:
      return {};
  }
}

export default function StickerParamModal({
  open,
  onOpenChange,
  editor,
  stickerType = "mention",
}: StickerParamModalProps) {
  const filterSchema = z.object({
    // Mention filter
    npub: z.string().optional(),
    
    // Note filter
    noteId: z.string().optional(),
    
    // Blossom (file) filter
    hash: z.string().optional(),
    filename: z.string().optional(),
  });

  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      npub: "",
      noteId: "",
      hash: "",
      filename: "",
    },
  });

  const watchedFields = form.watch();
  const currentFilter = getFilterTemplate(stickerType, watchedFields);
  const hasRequiredFields = Object.entries(currentFilter).some(
    ([key, value]) => Array.isArray(value) && value.length > 0 && value[0]?.length > 0
  );

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof filterSchema>) => {
    if (!editor) return;
    
    // Insert the sticker into the editor
    const filter = getFilterTemplate(stickerType, values);
    
    // Use accessors from StickerModal's definitions
    let accessors: string[] = [];
    if (stickerType === 'mention') {
      accessors = ["content", "name", "picture", "nip05", "about"];
    } else if (stickerType === 'note') {
      accessors = ["content", "pubkey", "created_at"];
    } else if (stickerType === 'blossom') {
      accessors = ["url", "thumb", "filename", "pubkey", "created_at"];
    }
    
    // Create associatedData for any non-filter properties
    const associatedData: Record<string, any> = {};
    
    // Add display parameters that aren't part of the Nostr filter
    if (stickerType === 'blossom' && values.filename) {
      associatedData.displayFilename = values.filename;
    }
    
    // Insert the sticker element at the current cursor position
    editor.commands.insertContent({
      type: "stickerElement",
      attrs: {
        stickerType,
        filter,
        accessors,
        associatedData: Object.keys(associatedData).length > 0 ? associatedData : undefined
      }
    });
    
    // Close the modal
    onOpenChange(false);
  };

  // Preview queries - these will only be enabled when we have enough data
  const profilePreview = useNostrProfileQuery(
    currentFilter as any,
    { 
      enabled: stickerType === 'mention' && 
        !!currentFilter.authors?.length && 
        !!currentFilter.authors[0]
    }
  );
  
  const notePreview = useNostrNoteQuery(
    currentFilter as any,
    { 
      enabled: stickerType === 'note' && 
        !!currentFilter.ids?.length && 
        !!currentFilter.ids[0]
    }
  );
  
  const filePreview = useNostrFileMetadataQuery(
    currentFilter as any,
    { 
      enabled: stickerType === 'blossom' && 
        !!currentFilter['#x']?.length && 
        !!currentFilter['#x'][0]
    }
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <StickerIcon stickerType={stickerType} />
            <h3 className="text-lg font-semibold">
              Add {getStickerLabel(stickerType)} Sticker
            </h3>
          </div>
          <button 
            onClick={() => onOpenChange(false)} 
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Fields specific to each sticker type */}
            {stickerType === "mention" && (
              <FormField
                control={form.control}
                name="npub"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-1.5">
                        <AtSign className="w-4 h-4 text-blue-500" />
                        <span>Nostr Public Key (npub)</span>
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="npub1..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {stickerType === "note" && (
              <FormField
                control={form.control}
                name="noteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-1.5">
                        <StickyNote className="w-4 h-4 text-yellow-600" />
                        <span>Note ID</span>
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="note1... or the hex ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {stickerType === "blossom" && (
              <>
                <FormField
                  control={form.control}
                  name="hash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-1.5">
                          <Flower className="w-4 h-4 text-green-600" />
                          <span>File Hash</span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hash value from the x tag (#x)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="filename"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-1.5">
                          <FileIcon className="w-4 h-4 text-gray-600" />
                          <span>Filename (optional)</span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="example.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Preview section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Preview</h3>
              
              <div className="min-h-24 flex items-center justify-center">
                {hasRequiredFields ? (
                  <div className="w-full max-w-[250px]">
                    {/* For now, we'll use a simplified preview */}
                    <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden text-center">
                      {stickerType === 'mention' && profilePreview.isLoading && (
                        <div>Loading profile...</div>
                      )}
                      {stickerType === 'note' && notePreview.isLoading && (
                        <div>Loading note...</div>
                      )}
                      {stickerType === 'blossom' && filePreview.isLoading && (
                        <div>Loading file metadata...</div>
                      )}
                      
                      {stickerType === 'mention' && profilePreview.data && (
                        <div className="flex items-center gap-2">
                          <AtSign className="w-5 h-5 text-blue-500" />
                          <span>{profilePreview.data.name || profilePreview.data.pubkey.slice(0, 8)}</span>
                        </div>
                      )}
                      
                      {stickerType === 'note' && notePreview.data && (
                        <div className="flex items-center gap-2">
                          <StickyNote className="w-5 h-5 text-yellow-600" />
                          <span>Note: {notePreview.data.content?.slice(0, 20)}...</span>
                        </div>
                      )}
                      
                      {stickerType === 'blossom' && filePreview.data && (
                        <div className="flex items-center gap-2">
                          <Flower className="w-5 h-5 text-green-600" />
                          <span>{filePreview.data.filename || "File"}</span>
                        </div>
                      )}
                      
                      {((stickerType === 'mention' && !profilePreview.isLoading && !profilePreview.data) || 
                         (stickerType === 'note' && !notePreview.isLoading && !notePreview.data) ||
                         (stickerType === 'blossom' && !filePreview.isLoading && !filePreview.data)) && (
                        <div className="text-sm text-gray-500">
                          {getStickerLabel(stickerType)} Preview
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Enter required fields to see preview
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!hasRequiredFields}>
                Insert Sticker
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 