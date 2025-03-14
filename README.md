# Hypernote Stories

A flexible, responsive editor for creating visual stories.

## Getting Started

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

## Element Positioning and Scaling System

The editor uses a sophisticated positioning and scaling system that maintains consistent element placement and sizing across different screen sizes.

### Design Space Concept

All positioning and sizing calculations are based on a virtual "design space" with fixed dimensions:
- Width: 1080px
- Height: 1920px

This provides a consistent coordinate system regardless of the actual rendered size of the editor.

### Element Positioning

Elements are positioned using absolute coordinates within the design space:

1. When an element is added or moved in the editor, its position is stored as (x, y) coordinates in the virtual 1080x1920 design space.

2. For rendering, these coordinates are converted to percentage-based positions relative to the container:
   ```typescript
   const xPercent = (element.x / 1080) * 100;
   const yPercent = (element.y / 1920) * 100;
   ```

3. These percentages are then applied to the element using CSS:
   ```jsx
   style={{
     left: `${xPercent}%`,
     top: `${yPercent}%`,
     transform: 'translate(-50%, -50%)', // Center on the coordinates
   }}
   ```

This ensures that elements maintain their relative positions regardless of the actual size of the editor container.

### Element Scaling

For elements with dimensions (like images), a similar scaling approach is used:

1. Element dimensions are stored in the design space (e.g., an image width of 540px in the 1080px-wide design space).

2. A scale factor is calculated based on the actual container width:
   ```typescript
   const containerWidth = containerRef.current.getBoundingClientRect().width;
   const scaleFactor = containerWidth / 1080;
   ```

3. This scale factor is then applied to the element's dimensions:
   ```jsx
   style={{ width: element.width * scaleFactor + 'px' }}
   ```

This ensures that elements scale proportionally with the container while maintaining their relative size.

### Drag and Drop Implementation

The drag implementation works by:

1. Capturing mouse events (mousedown, mousemove, mouseup) on elements and the container.

2. When dragging starts, the element is selected and dragging state is activated.

3. During mousemove, the cursor position is converted back to the design space coordinates:
   ```typescript
   const rect = containerRef.current.getBoundingClientRect();
   const xPercent = ((e.clientX - rect.left) / rect.width);
   const yPercent = ((e.clientY - rect.top) / rect.height);
   
   const x = Math.round(xPercent * 1080);
   const y = Math.round(yPercent * 1920);
   ```

4. The element's position is updated in the store with these coordinates.

5. On mouseup, the dragging state is cleared.

This approach ensures smooth, consistent dragging behavior regardless of the actual rendered size of the editor.

### Benefits of This Approach

- **Responsive Design**: Elements maintain their relative positions and sizes across different screen sizes.
- **Predictable Layout**: Using a fixed design space makes positioning more intuitive and predictable.
- **Consistent Scaling**: Elements scale proportionally with the container size.
- **Device Independence**: The same coordinates work across different devices and screen resolutions.

## Sticker System Concepts

Hypernote stories support rich interactive components called "stickers" that can fetch and display different types of content. The system uses two key concepts to enable this functionality:

### Sticker Filter System

The filter system enables stickers to query content from the Nostr network:

1. **Nostr Protocol Integration**: Stickers use a filter object that follows the standard Nostr event filter format, allowing for consistent querying across Nostr clients.

2. **Filter Structure**: Each sticker has a `filter` property that defines what data to fetch:
   ```typescript
   filter: {
     kinds?: number[] // Event kinds to filter by (e.g., [0] for profiles, [1] for notes)
     authors?: string[] // Author public keys to filter by
     ids?: string[] // Event IDs to filter by
     '#e'?: string[] // Event references
     '#p'?: string[] // Profile references
     '#x'?: string[] // X-tag references (for Blossom file stickers)
     limit?: number // Number of results to return
   }
   ```

3. **Sticker Types**: Different sticker types use different filter configurations:
   - `mention` stickers fetch user profiles using kind 0 events
   - `note` stickers fetch text notes using kind 1 events
   - `blossom` stickers fetch file metadata using kind 1063 events
   - `product` stickers fetch product listings using kind 30402 events 
   - `prompt` stickers create interactive prompts for user input

4. **Accessors**: In addition to filters, stickers have an `accessors` array that specifies which fields to extract from the fetched events. This allows for more efficient data extraction.

### Sticker Methods System

The methods system enables stickers to perform actions:

1. **Event Templates**: Each method has an event template that defines how to create a new Nostr event:
   ```typescript
   methods: {
     [methodName]: {
       description?: string, // Description of what the method does
       eventTemplate: {
         kind: number, // Event kind
         tags?: string[][], // Tags to include
         content?: string, // Default content
         [key: string]: any // Additional fields
       }
     }
   }
   ```

2. **Placeholder Substitution**: Methods support placeholder values that get replaced at runtime:
   - `${eventId}` - The ID of the related event
   - `${pubkey}` - The user's public key
   - `${eventKind}` - The kind of the related event
   - `${content}` - User-provided content

3. **Interactive Example**: The `prompt` sticker type uses methods to enable user comments:
   ```typescript
   methods: {
     comment: {
       description: "Add a comment to this hypernote",
       eventTemplate: {
         kind: 1,
         tags: [
           ["e", "${eventId}", "", "root"],
           ["p", "${pubkey}"]
         ],
         content: "${content}"
       }
     }
   }
   ```

4. **Context Awareness**: Stickers can access a `HypernoteContext` to know about the current environment, enabling methods to create properly referenced events.

## Client Implementation Guidelines

For developers creating their own Hypernote clients, consider these key points:

1. **Sticker Rendering**: Each sticker type has a specific rendering approach that should maintain the visual identity of the type.

2. **Scaling Behavior**: Stickers should use the element scaling system to maintain consistent size across different viewport dimensions.

3. **Methods Execution**: When a method is activated, use the template to create a properly formatted Nostr event using the specified kind and tags.

4. **Event Referencing**: Maintain proper event referencing in methods to ensure replies and reactions are properly connected.

5. **Context Provider**: Implement a context provider that exposes necessary values like hypernoteId, hypernoteKind, and hypernotePubkey to stickers.

This project was created using `bun init` in bun v1.2.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
