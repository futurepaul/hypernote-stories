import { create } from 'zustand'

export type ElementType = 'text' | 'sticker' | 'image'

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
}

export interface StickerElement extends BaseElement {
  type: 'sticker'
  stickerId: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  imageUrl: string
  width: number
}

export type Element = TextElement | StickerElement | ImageElement

// Editor state separate from content
interface EditorState {
  selectedElementId: string | null
  isEditingDisabled: boolean
}

interface EditorStore {
  // Content (what gets published)
  elements: Element[]
  // Editor state (not for publishing)
  editorState: EditorState
  
  // Element operations
  addTextElement: (text: string, x: number, y: number) => void
  addStickerElement: (stickerId: string, x: number, y: number) => void
  addImageElement: (imageUrl: string, x: number, y: number) => void
  updateElementPosition: (id: string, x: number, y: number) => void
  deleteElement: (id: string) => void
  updateTextElement: (id: string, text: string) => void
  updateTextElementFont: (id: string, font: string) => void
  updateTextElementSize: (id: string, size: 'sm' | 'md' | 'lg') => void
  updateImageElementWidth: (id: string, width: number) => void
  clearElements: () => void
  
  // Editor operations
  selectElement: (id: string | null) => void
  isElementSelected: (id: string) => boolean
  setEditingDisabled: (disabled: boolean) => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  elements: [],
  editorState: {
    selectedElementId: null,
    isEditingDisabled: false
  },
  
  addTextElement: (text: string, x: number, y: number) => {
    const id = crypto.randomUUID();
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
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },

  addStickerElement: (stickerId: string, x: number, y: number) => {
    const id = crypto.randomUUID();
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id,
          type: 'sticker',
          stickerId,
          x,
          y,
        },
      ],
    }))
    // Select the newly added element
    get().selectElement(id);
  },

  addImageElement: (imageUrl: string, x: number, y: number) => {
    const id = crypto.randomUUID();
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
  
  clearElements: () => {
    set(() => ({
      elements: [],
      editorState: {
        selectedElementId: null,
        isEditingDisabled: false
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
  }
})) 