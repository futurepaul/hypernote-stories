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

This project was created using `bun init` in bun v1.2.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
