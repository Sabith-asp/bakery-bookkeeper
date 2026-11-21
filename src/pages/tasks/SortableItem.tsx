import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SortableItem({
  id,
  fullCardDrag = false,
  children,
}: {
  id: string;
  /** When true, the whole card (not just the grip icon) is the drag source. */
  fullCardDrag?: boolean;
  children: (dragHandle: React.ReactNode, isDragging: boolean) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handle = (
    <button
      type="button"
      className="shrink-0 flex h-9 w-6 items-center justify-center text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
      aria-label="Drag to reorder"
      {...(fullCardDrag ? {} : attributes)}
      {...(fullCardDrag ? {} : listeners)}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "opacity-40",
        // Dragging from anywhere on the card (not just a handle) means the pointer-down
        // can land on plain text; without this the browser starts a native text-selection
        // drag instead of letting dnd-kit's pointer sensor take over, which silently breaks
        // the drag (nothing moves, or it only half-drags) once the pointer crosses into text.
        fullCardDrag && "cursor-grab active:cursor-grabbing select-none touch-none"
      )}
      {...(fullCardDrag ? attributes : {})}
      {...(fullCardDrag ? listeners : {})}
    >
      {children(handle, isDragging)}
    </div>
  );
}
