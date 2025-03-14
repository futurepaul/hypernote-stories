import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type ElementType = 'text' | 'sticker' | 'image' | 'video' | 'file'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  font?: string
  size: 'sm' | 'md' | 'lg'
  color: 'black' | 'white' | 'blue'
}

export interface StickerElement extends BaseElement {
  type: 'sticker'
  stickerType: string // Type identifier (mention, note, etc.)
  filter: {
    kinds?: number[]
    authors?: string[]
    ids?: string[]
    '#e'?: string[] // event references
    '#p'?: string[] // profile references
    '#x'?: string[] // x tag references for blossom stickers
    // other potential filter fields
    limit?: number
  } // This matches NDKFilter structure
  accessors: string[] // Fields to extract from the event
  associatedData?: Record<string, any> // Optional object to store additional data (like displayFilename)
}

export interface ImageElement extends BaseElement {
  type: 'image'
  imageUrl: string
  width: number
}

export interface VideoElement extends BaseElement {
  type: 'video'
  videoUrl: string
  width: number
}

export interface FileElement extends BaseElement {
  type: 'file'
  fileUrl: string
  fileName: string
}

export type Element = TextElement | StickerElement | ImageElement | VideoElement | FileElement

// Editor state separate from content
interface EditorState {
  selectedElementId: string | null
  isEditingDisabled: boolean
  isEditModalOpen: boolean
  isPublishModalOpen: boolean
  isImageModalOpen: boolean
  isVideoModalOpen: boolean
  isFileModalOpen: boolean
  isStickerModalOpen: boolean
  isStickerParamModalOpen: boolean
  selectedStickerType: string | null
  editingText: string
}

interface EditorStore {
  // Content (what gets published)
  elements: Element[]
  // Editor state (not for publishing)
  editorState: EditorState
  
  // Element operations
  addTextElement: (text: string, x: number, y: number) => void
  addStickerElement: (
    stickerType: string, 
    filter: {
      kinds?: number[];
      authors?: string[];
      ids?: string[];
      '#e'?: string[];
      '#p'?: string[];
      '#x'?: string[];
      limit?: number;
    }, 
    accessors: string[], 
    x: number, 
    y: number,
    associatedData?: Record<string, any>
  ) => void
  addImageElement: (imageUrl: string, x: number, y: number) => void
  addVideoElement: (videoUrl: string, x: number, y: number) => void
  addFileElement: (fileUrl: string, fileName: string, x: number, y: number) => void
  updateElementPosition: (id: string, x: number, y: number) => void
  deleteElement: (id: string) => void
  updateTextElement: (id: string, text: string) => void
  updateTextElementFont: (id: string, font: string) => void
  updateTextElementSize: (id: string, size: 'sm' | 'md' | 'lg') => void
  updateImageElementWidth: (id: string, width: number) => void
  updateVideoElementWidth: (id: string, width: number) => void
  clearElements: () => void
  updateTextElementColor: (id: string, color: 'black' | 'white' | 'blue') => void
  
  // Editor operations
  selectElement: (id: string | null) => void
  isElementSelected: (id: string) => boolean
  setEditingDisabled: (disabled: boolean) => void
  
  // Modal actions
  openEditModal: () => void
  closeEditModal: () => void
  openPublishModal: () => void
  closePublishModal: () => void
  openImageModal: () => void
  closeImageModal: () => void
  openVideoModal: () => void
  closeVideoModal: () => void
  openFileModal: () => void
  closeFileModal: () => void
  openStickerModal: () => void
  closeStickerModal: () => void
  openStickerParamModal: (stickerId: string) => void
  closeStickerParamModal: () => void
  setEditingText: (text: string) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  elements: [],
  editorState: {
    selectedElementId: null,
    isEditingDisabled: false,
    isEditModalOpen: false,
    isPublishModalOpen: false,
    isImageModalOpen: false,
    isVideoModalOpen: false,
    isFileModalOpen: false,
    isStickerModalOpen: false,
    isStickerParamModalOpen: false,
    selectedStickerType: null,
    editingText: "",
  },
  
  addTextElement: (text: string, x: number, y: number) => {
    const id = uuidv4();
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type: 'text',
          text,
          x,
          y,
          size: 'md', // Default size
          color: 'black', // Default color
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },

  addStickerElement: (
    stickerType: string, 
    filter: {
      kinds?: number[];
      authors?: string[];
      ids?: string[];
      '#e'?: string[];
      '#p'?: string[];
      '#x'?: string[];
      limit?: number;
    }, 
    accessors: string[], 
    x: number, 
    y: number,
    associatedData?: Record<string, any>
  ) => {
    const id = uuidv4();
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type: 'sticker',
          stickerType,
          filter,
          accessors,
          x,
          y,
          associatedData
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },

  addImageElement: (imageUrl: string, x: number, y: number) => {
    const id = uuidv4();
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type: 'image',
          imageUrl,
          x,
          y,
          width: 540,
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },

  addVideoElement: (videoUrl: string, x: number, y: number) => {
    const id = uuidv4();
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type: 'video',
          videoUrl,
          x,
          y,
          width: 540,
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },

  addFileElement: (fileUrl: string, fileName: string, x: number, y: number) => {
    const id = uuidv4();
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type: 'file',
          fileUrl,
          fileName,
          x,
          y,
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },
  
  updateElementPosition: (id: string, x: number, y: number) => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id ? { ...element, x, y } : element
      )
    }))
  },
  
  deleteElement: (id: string) => {
    set((state) => ({
      elements: state.elements.filter(element => element.id !== id),
      editorState: {
        ...state.editorState,
        selectedElementId: null // Deselect when deleting
      }
    }))
  },
  
  updateTextElement: (id: string, text: string) => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id && element.type === 'text' 
          ? { ...element, text } 
          : element
      )
    }))
  },
  
  updateTextElementFont: (id: string, font: string) => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id && element.type === 'text' 
          ? { ...element, font } 
          : element
      )
    }))
  },
  
  updateTextElementSize: (id: string, size: 'sm' | 'md' | 'lg') => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id && element.type === 'text' 
          ? { ...element, size } 
          : element
      )
    }))
  },
  
  updateImageElementWidth: (id: string, width: number) => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id && element.type === 'image' 
          ? { ...element, width } 
          : element
      )
    }))
  },
  
  updateVideoElementWidth: (id: string, width: number) => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id && element.type === 'video' 
          ? { ...element, width } 
          : element
      )
    }))
  },
  
  clearElements: () => {
    set(() => ({
      elements: [],
      editorState: {
        selectedElementId: null,
        isEditingDisabled: false,
        isEditModalOpen: false,
        isPublishModalOpen: false,
        isImageModalOpen: false,
        isVideoModalOpen: false,
        isFileModalOpen: false,
        isStickerModalOpen: false,
        isStickerParamModalOpen: false,
        selectedStickerType: null,
        editingText: "",
      }
    }))
  },
  
  selectElement: (id: string | null) => {
    set((state) => ({
      editorState: {
        ...state.editorState,
        selectedElementId: id
      }
    }))
  },
  
  isElementSelected: (id: string) => {
    return get().editorState.selectedElementId === id;
  },
  
  setEditingDisabled: (disabled: boolean) => {
    set((state) => ({
      editorState: {
        ...state.editorState,
        isEditingDisabled: disabled
      }
    }))
  },
  
  openEditModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isEditModalOpen: true },
    }))
  },
  
  closeEditModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isEditModalOpen: false },
    }))
  },
  
  openPublishModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isPublishModalOpen: true },
    }))
  },
  
  closePublishModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isPublishModalOpen: false },
    }))
  },
  
  openImageModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isImageModalOpen: true },
    }))
  },
  
  closeImageModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isImageModalOpen: false },
    }))
  },
  
  openVideoModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isVideoModalOpen: true },
    }))
  },
  
  closeVideoModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isVideoModalOpen: false },
    }))
  },
  
  openFileModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isFileModalOpen: true },
    }))
  },
  
  closeFileModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isFileModalOpen: false },
    }))
  },
  
  openStickerModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isStickerModalOpen: true },
    }))
  },
  
  closeStickerModal: () => {
    set((state) => ({
      editorState: { ...state.editorState, isStickerModalOpen: false },
    }))
  },
  
  openStickerParamModal: (stickerId: string) => {
    set((state) => ({
      editorState: { 
        ...state.editorState, 
        isStickerParamModalOpen: true,
        selectedStickerType: stickerId,
        isStickerModalOpen: false, // Close sticker modal when param modal opens
      },
    }))
  },
  
  closeStickerParamModal: () => {
    set((state) => ({
      editorState: { 
        ...state.editorState, 
        isStickerParamModalOpen: false,
        selectedStickerType: null,
      },
    }))
  },
  
  setEditingText: (text: string) => {
    set((state) => ({
      editorState: { ...state.editorState, editingText: text },
    }))
  },

  updateTextElementColor: (id: string, color: 'black' | 'white' | 'blue') => {
    set((state) => ({
      elements: state.elements.map(element => 
        element.id === id && element.type === 'text' 
          ? { ...element, color } 
          : element
      )
    }))
  },
})) 