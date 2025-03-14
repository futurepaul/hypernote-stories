import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AtSign, StickyNote, File as FileIcon, Flower, Loader2, ShoppingBag, MessageSquareQuote, Timer } from "lucide-react";
import { stickerDefinitions } from "./StickerModal";
import type { StickerParam, FilterBasedSticker, MethodBasedSticker } from "./StickerModal";
import { decodeNostrId, publishFileMetadata, extractHashFromUrl } from "@/lib/nostr";
import { GenericSticker } from "@/components/elements/GenericSticker";
import { BaseModal } from "@/components/ui/base-modal";

// Icon component for sticker types
const StickerIcon = ({ stickerType }: { stickerType: string }) => {
  switch (stickerType) {
    case 'mention':
      return <AtSign className="h-5 w-5 text-blue-500" />;
    case 'note':
      return <StickyNote className="h-5 w-5 text-yellow-600" />;
    case 'prompt':
      return <MessageSquareQuote className="h-5 w-5 text-purple-500" />;
    case 'product':
      return <ShoppingBag className="h-5 w-5 text-purple-600" />;
    case 'blossom':
      return <Flower className="h-5 w-5 text-green-600" />;
    case 'countdown':
      return <Timer className="h-5 w-5 text-blue-600" />;
    default:
      return <StickyNote className="h-5 w-5" />;
  }
};

// Define interface for the component props - keep compatibility with current implementation
interface EnhancedStickerParamModalProps {
  stickerId: string;
  stickerName: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stickerType: string, filter: any, accessors: string[], associatedData?: Record<string, any>, methods?: { 
    [key: string]: {
      description?: string;
      eventTemplate: {
        kind: number;
        tags?: string[][];
        content?: string;
        [key: string]: any;
      };
    } 
  }) => void;
}

export function EnhancedStickerParamModal({
  stickerId,
  stickerName,
  isOpen,
  onClose,
  onAdd,
}: EnhancedStickerParamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get definition for this sticker type
  const definition = Array.isArray(stickerDefinitions) 
    ? stickerDefinitions.find(def => def.id === stickerId)
    : stickerDefinitions[stickerId as keyof typeof stickerDefinitions];
    
  if (!isOpen || !definition) {
    return null;
  }

  // Check if it's a filter-based or method-based sticker
  const isFilterBased = (def: any): def is FilterBasedSticker => 
    'filterTemplate' in def && 'accessors' in def && 'params' in def;
  
  const isMethodBased = (def: any): def is MethodBasedSticker => 
    'methods' in def && 'paramAccessors' in def;

  // Create a dynamic schema based on sticker type
  const createSchemaForStickerType = () => {
    const schemaFields: Record<string, any> = {};
    
    // For method-based stickers with special parameters
    if (isMethodBased(definition)) {
      if (stickerId === 'prompt') {
        schemaFields.promptText = z.string().min(1, { message: "Prompt text is required" });
      }
      return z.object(schemaFields);
    }
    
    // For filter-based stickers with params
    if (isFilterBased(definition)) {
      definition.params.forEach(param => {
        const isRequired = param.required !== false;
        const baseField = z.string();
        
        // Special handling for the countdown duration field
        if (stickerId === 'countdown' && param.key === 'duration') {
          schemaFields[param.key] = isRequired ?
            baseField
              .min(1, { message: `${param.label} is required` })
              .refine(val => !isNaN(parseInt(val)), { message: "Duration must be a number" }) :
            baseField.optional();
        } else {
          schemaFields[param.key] = isRequired ? 
            baseField.min(1, { message: `${param.label} is required` }) : 
            baseField.optional();
        }
      });
    }
    
    return z.object(schemaFields);
  };

  // Create form with the dynamic schema
  const formSchema = createSchemaForStickerType();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: (() => {
      const defaults: Record<string, string> = {};
      
      // For method-based stickers with special parameters
      if (isMethodBased(definition)) {
        if (stickerId === 'prompt') {
          defaults.promptText = "";
        }
        return defaults;
      }
      
      // For filter-based stickers with params
      if (isFilterBased(definition)) {
        definition.params.forEach(param => {
          defaults[param.key] = "";
        });
      }
      
      return defaults;
    })()
  });

  // Watch form values for preview
  const watchedValues = form.watch();

  // Build filter for preview
  const buildFilterForPreview = () => {
    // Function to get a processed value (handle decoding if needed)
    const getProcessedValue = (value: string) => {
      if (!value) return "";
      
      // Simple check for bech32 IDs
      if (/^(npub|note|nevent)1[0-9a-z]+$/i.test(value)) {
        try {
          const decoded = decodeNostrId(value);
          return decoded?.data || value;
        } catch {
          return value;
        }
      }
      
      return value;
    };
    
    // Create the filter based on sticker type
    let mainFilter: Record<string, any> = {};
    
    // For method-based stickers like prompt, we don't need a filter
    if (isMethodBased(definition)) {
      return {};
    }
    
    // Handle filter-based stickers
    if (isFilterBased(definition)) {
      if (stickerId === 'mention' && watchedValues.pubkey) {
        const pubkey = getProcessedValue(watchedValues.pubkey);
        mainFilter = definition.filterTemplate(pubkey, "");
      }
      else if ((stickerId === 'note' || stickerId === 'product') && watchedValues.id) {
        const id = getProcessedValue(watchedValues.id);
        mainFilter = definition.filterTemplate(id, "");
      }
      else if (stickerId === 'blossom' && watchedValues.url) {
        const hash = extractHashFromUrl(watchedValues.url);
        if (hash) {
          mainFilter = definition.filterTemplate(hash, watchedValues.filename || "");
        }
      }
    }
    
    return mainFilter;
  };
  
  const previewFilter = buildFilterForPreview();
  
  // Check if we have required fields for preview
  const hasPreviewData = Object.entries(previewFilter).some(
    ([key, value]) => Array.isArray(value) && value.length > 0 && value[0]?.length > 0
  );

  // Create the associatedData object for previews
  const previewAssociatedData: Record<string, any> = {};
  if (stickerId === 'blossom' && watchedValues.filename) {
    previewAssociatedData.displayFilename = watchedValues.filename;
  }
  if (stickerId === 'prompt' && watchedValues.promptText) {
    previewAssociatedData.promptText = watchedValues.promptText;
  }
  
  // For method-based stickers, create a methods object for preview
  const previewMethods = isMethodBased(definition) ? {
    ...definition.methods
  } : undefined;

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Handle method-based stickers (like prompt)
      if (isMethodBased(definition)) {
        // For prompt stickers, handle promptText
        if (stickerId === 'prompt') {
          const associatedData = {
            promptText: values.promptText
          };
          
          // Convert methods to the format expected by StickerElement
          // We need to include description even if it's optional in the definition
          const methodsForSticker: { 
            [key: string]: {
              description: string;
              eventTemplate: {
                kind: number;
                tags?: string[][];
                content?: string;
                [key: string]: any;
              };
            } 
          } = {};
          
          Object.entries(definition.methods).forEach(([key, value]) => {
            methodsForSticker[key] = {
              description: value.description || key, // Use key as fallback if description is missing
              eventTemplate: value.eventTemplate
            };
          });
          
          onAdd(stickerId, {}, definition.paramAccessors || [], associatedData, methodsForSticker);
          onClose();
          return;
        }
      }
      
      // Handle filter-based stickers
      if (isFilterBased(definition)) {
        // Process values (decode Nostr IDs as needed)
        const processedParams: Record<string, string> = {};
        
        for (const param of definition.params) {
          const value = values[param.key];
          
          // Skip empty optional parameters
          if (!value && param.required === false) {
            continue;
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
        }
        
        // Special handling for countdown stickers
        if (stickerId === 'countdown') {
          console.log("[Debug Countdown] Creating countdown sticker with duration:", values.duration);
          const filter = definition.filterTemplate(""); // Empty filter
          const associatedData = {
            duration: values.duration
          };
          
          console.log("[Debug Countdown] Final sticker data:", { filter, accessors: definition.accessors, associatedData });
          
          onAdd(stickerId, filter, definition.accessors, associatedData);
          onClose();
          return;
        }
        
        // Special handling for blossom stickers - publish file metadata
        if (stickerId === 'blossom') {
          const url = processedParams.url;
          const hash = extractHashFromUrl(url);
          
          if (!hash) {
            throw new Error('Could not find a valid SHA-256 hash in the URL');
          }
          
          // Publish the file metadata event
          setError('Publishing file metadata...');

          const eventId = await publishFileMetadata(
            url, 
            hash,
            { 
              filename: processedParams.filename,
              // Could extract MIME type from file extension if needed
            }
          );
          
          if (!eventId) {
            throw new Error('Failed to publish file metadata. Please ensure you have a Nostr extension enabled.');
          }
          
          // Create the filter using the hash
          const filter = definition.filterTemplate(hash, processedParams.filename || "");
          
          // Set up the associated data
          const associatedData: Record<string, any> = {};
          if (processedParams.filename) {
            associatedData.displayFilename = processedParams.filename;
          }
          
          // Call onAdd with the new sticker parameters
          onAdd(stickerId, filter, definition.accessors, associatedData);
          onClose();
          return;
        }
        
        // Handle other filter-based sticker types (mention, note, product)
        let filter;
        
        if (stickerId === 'mention') {
          filter = definition.filterTemplate(processedParams.pubkey, "");
        } else if (stickerId === 'note' || stickerId === 'product') {
          filter = definition.filterTemplate(processedParams.id, "");
        } else {
          // Generic fallback
          const firstParam = Object.values(processedParams)[0];
          filter = definition.filterTemplate(firstParam, "");
        }
        
        // Create associatedData object for non-filter properties
        const associatedData: Record<string, any> = {};
        
        // Add display parameters that aren't part of the Nostr filter
        if (stickerId === 'blossom' && processedParams.filename) {
          associatedData.displayFilename = processedParams.filename;
        }
        
        // Call onAdd with the new sticker parameters
        onAdd(stickerId, filter, definition.accessors, associatedData);
        onClose();
        return;
      }
      
      // Fallback for unknown sticker types
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare footer buttons
  const modalFooter = (
    <div className="flex justify-end space-x-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        form="sticker-form" // Connect to the form
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add'
        )}
      </Button>
    </div>
  );

  // Create modal title with icon
  const modalTitle = (
    <div className="flex items-center gap-2">
      <StickerIcon stickerType={stickerId} />
      <span>Add {stickerName}</span>
    </div>
  );

  return (
    <BaseModal
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      footer={modalFooter}
    >
      <Form {...form}>
        <form 
          id="sticker-form" 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-4"
        >
          {/* Dynamically generate form fields based on sticker type */}
          {isMethodBased(definition) && stickerId === 'prompt' && (
            <FormField
              control={form.control}
              name="promptText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4 text-purple-500" />
                      <span>Prompt Text</span>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., What's your favorite color?" 
                      {...field} 
                      required={true}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">The question or prompt to display to users</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Form fields for filter-based stickers */}
          {isFilterBased(definition) && definition.params.map((param) => (
            <FormField
              key={param.key}
              control={form.control}
              name={param.key}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="flex items-center gap-1.5">
                      {param.key === 'pubkey' && <AtSign className="w-4 h-4 text-blue-500" />}
                      {param.key === 'id' && stickerId === 'note' && <StickyNote className="w-4 h-4 text-yellow-600" />}
                      {param.key === 'id' && stickerId === 'product' && <ShoppingBag className="w-4 h-4 text-purple-600" />}
                      {param.key === 'url' && <Flower className="w-4 h-4 text-green-600" />}
                      {param.key === 'filename' && <FileIcon className="w-4 h-4 text-gray-600" />}
                      {param.key === 'duration' && stickerId === 'countdown' && <Timer className="w-4 h-4 text-blue-600" />}
                      <span>{param.label}</span>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={param.placeholder} 
                      {...field} 
                      required={param.required !== false}
                      type={param.key === 'duration' && stickerId === 'countdown' ? 'number' : 'text'}
                      min={param.key === 'duration' && stickerId === 'countdown' ? '1' : undefined}
                    />
                  </FormControl>
                  {param.helpText && (
                    <p className="text-xs text-gray-500">{param.helpText}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {/* Preview section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Preview</h3>
              
            <div className="flex items-center justify-center">
              {hasPreviewData || (isMethodBased(definition) && watchedValues.promptText) ? (
                <div className="w-full max-w-[250px]">
                  {/* Special handling for prompt stickers */}
                  {isMethodBased(definition) && stickerId === 'prompt' && watchedValues.promptText && (
                    <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
                      <GenericSticker
                        stickerType={stickerId}
                        filter={{}}
                        accessors={[]}
                        scaleFactor={1}
                        associatedData={{ promptText: watchedValues.promptText }}
                        methods={previewMethods}
                        // Pass placeholder values for prompt stickers
                        eventId="placeholder-event-id"
                        pubkey="placeholder-pubkey"
                        eventKind={31337}
                      />
                    </div>
                  )}
                  
                  {/* Special handling for blossom stickers since their events aren't published yet */}
                  {isFilterBased(definition) && stickerId === 'blossom' && watchedValues.url && (
                    <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
                      {extractHashFromUrl(watchedValues.url) ? (
                        <GenericSticker
                          stickerType={stickerId}
                          filter={previewFilter}
                          accessors={definition.accessors}
                          scaleFactor={1}
                          associatedData={previewAssociatedData}
                        />
                      ) : (
                        <div className="text-sm text-gray-500 text-center">
                          Could not extract hash from URL
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Preview section for countdown sticker */}
                  {isFilterBased(definition) && stickerId === 'countdown' && watchedValues.duration && (
                    <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
                      <GenericSticker
                        stickerType={stickerId}
                        filter={{}} // Empty filter as we don't need to query
                        accessors={[]}
                        scaleFactor={1}
                        associatedData={{ duration: watchedValues.duration }}
                      />
                    </div>
                  )}
                  
                  {/* For mention, note, and product stickers, use GenericSticker directly */}
                  {isFilterBased(definition) && (stickerId === 'mention' || stickerId === 'note' || stickerId === 'product') && (
                    <GenericSticker
                      stickerType={stickerId}
                      filter={previewFilter}
                      accessors={definition.accessors}
                      scaleFactor={1}
                      associatedData={previewAssociatedData}
                    />
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4">
                  Enter required fields to see preview
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (error !== 'Publishing file metadata...') && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
            
          {/* Status message */}
          {error === 'Publishing file metadata...' && (
            <div className="p-3 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Publishing file metadata...
            </div>
          )}
        </form>
      </Form>
    </BaseModal>
  );
} 