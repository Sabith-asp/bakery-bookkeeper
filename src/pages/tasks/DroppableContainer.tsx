import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export default function DroppableContainer({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && "outline-2 outline-dashed outline-primary/50 outline-offset-2 bg-primary/5 rounded-xl"
      )}
    >
      {children}
    </div>
  );
}
