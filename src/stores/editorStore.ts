import { create } from 'zustand'

type ElementType = 'text' | 'sticker' | 'image'

interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
}

interface TextElement extends BaseElement {
  type: 'text'
  text: string
}

interface StickerElement extends BaseElement {
  type: 'sticker'
  stickerId: string
}

interface ImageElement extends BaseElement {
  type: 'image'
  imageUrl: string
  width: number
}

type Element = TextElement | StickerElement | ImageElement

// Editor state separate from content
interface EditorState {
  selectedElementId: string | null
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
  clearElements: () => void
  
  // Editor operations
  selectElement: (id: string | null) => void
  isElementSelected: (id: string) => boolean
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  elements: [],
  editorState: {
    selectedElementId: null
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
  
  clearElements: () => {
    set(() => ({
      elements: [],
      editorState: {
        selectedElementId: null
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
  }
})) 