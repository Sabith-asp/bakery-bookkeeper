import { useCallback, useRef, useState } from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Hoisted so these option objects keep a stable reference across renders. onDragOver calls
// updateContainers, which re-renders the component mid-drag; if these were object literals
// created inline in the hook body, useSensor/useSensors would see a "changed" options object
// on every one of those re-renders and re-instantiate the sensors while a drag is in flight,
// which can fire the drag's end handler (and its API calls) more than once for one gesture.
const MOUSE_SENSOR_OPTIONS = { activationConstraint: { distance: 4 } };
const TOUCH_SENSOR_OPTIONS = { activationConstraint: { delay: 150, tolerance: 6 } };
const KEYBOARD_SENSOR_OPTIONS = { coordinateGetter: sortableKeyboardCoordinates };

export type Containers = Record<string, string[]>;

export function buildContainers<T>(
  items: T[],
  containerKeys: string[],
  keyOf: (item: T) => string,
  idOf: (item: T) => string
): Containers {
  const map: Containers = {};
  containerKeys.forEach((k) => {
    map[k] = [];
  });
  items.forEach((item) => {
    const k = keyOf(item);
    if (!map[k]) map[k] = [];
    map[k].push(idOf(item));
  });
  return map;
}

function findContainer(id: string, containers: Containers): string | undefined {
  if (id in containers) return id;
  return Object.keys(containers).find((key) => containers[key].includes(id));
}

/**
 * Drag-and-drop across any number of named lists (date groups, status columns, …):
 * reorder within one list, or move an item to another list. Finalizing the move
 * (persisting it) is left to the caller via `onFinalize`, which only fires when
 * something actually changed — never on a drag that ends back where it started.
 */
export function useMultiContainerDrag(
  onFinalize: (containerKey: string, orderedIds: string[], movedFrom: string | null, movedId: string) => void
) {
  const [containers, setContainersState] = useState<Containers>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const containersRef = useRef<Containers>({});
  // The container the dragged item actually started in — captured once, at drag start.
  // onDragOver live-relocates the item as you drag, so by drag-end it already sits in its
  // destination container; without this, drag-end can never tell it crossed containers.
  const sourceContainerRef = useRef<string | null>(null);
  // Full snapshot at drag start, so a drag that's cancelled (dropped on nothing, or Escape)
  // can be reverted exactly, instead of leaving whatever onDragOver last moved live.
  const snapshotRef = useRef<Containers>({});
  const onFinalizeRef = useRef(onFinalize);
  onFinalizeRef.current = onFinalize;
  // The last droppable we were definitely over. closestCorners (dnd-kit's default) measures
  // corner distance, which is unreliable once a candidate droppable is large/empty — exactly
  // a Kanban column with no cards — and on a fast pointer jump both pointerWithin and
  // rectIntersection can momentarily find nothing at all. Falling back to this remembered id
  // (dnd-kit's own "Multiple Containers" example does the same) keeps the drop on the
  // droppable the pointer was last confirmed over instead of silently cancelling the drop.
  const lastOverIdRef = useRef<string | null>(null);

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
    const overId = getFirstCollision(collisions, "id");
    if (overId != null) {
      lastOverIdRef.current = String(overId);
      return collisions;
    }
    return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
  }, []);

  const updateContainers = useCallback((updater: (prev: Containers) => Containers) => {
    setContainersState((prev) => {
      const next = updater(prev);
      containersRef.current = next;
      return next;
    });
  }, []);

  // Only resync from the server while no drag is in flight, so a live drag never gets clobbered.
  const setContainers = useCallback((next: Containers) => {
    if (draggingRef.current) return;
    containersRef.current = next;
    setContainersState(next);
  }, []);

  // MouseSensor + TouchSensor (not PointerSensor) so mouse and touch gestures are each
  // claimed by exactly one sensor — PointerSensor also receives touch-originated pointer
  // events, so pairing it with TouchSensor let both sensors start a drag for the same
  // touch, firing onDragEnd (and its API calls) twice per gesture.
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_SENSOR_OPTIONS),
    useSensor(TouchSensor, TOUCH_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS)
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    draggingRef.current = true;
    const id = String(e.active.id);
    setActiveId(id);
    snapshotRef.current = containersRef.current;
    sourceContainerRef.current = findContainer(id, containersRef.current) ?? null;
    lastOverIdRef.current = null;
  }, []);

  const handleDragOver = useCallback(
    (e: DragOverEvent) => {
      const { active, over } = e;
      if (!over) return;
      const activeItemId = String(active.id);
      const overItemId = String(over.id);

      updateContainers((prev) => {
        const activeContainer = findContainer(activeItemId, prev);
        const overContainer = findContainer(overItemId, prev);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return prev;

        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        const overIndex = overItems.indexOf(overItemId);
        const insertAt = overIndex >= 0 ? overIndex : overItems.length;

        return {
          ...prev,
          [activeContainer]: activeItems.filter((id) => id !== activeItemId),
          [overContainer]: [...overItems.slice(0, insertAt), activeItemId, ...overItems.slice(insertAt)],
        };
      });
    },
    [updateContainers]
  );

  const endDrag = useCallback(() => {
    draggingRef.current = false;
    setActiveId(null);
    sourceContainerRef.current = null;
  }, []);

  const handleDragCancel = useCallback(
    (_e: DragCancelEvent) => {
      // Guards against a second end/cancel event for the same gesture (e.g. two sensors
      // both claiming it) firing onFinalize's API calls twice — the first call already
      // settled this drag, so draggingRef is already false.
      if (!draggingRef.current) return;
      // Revert whatever onDragOver moved live — nothing to persist, nothing changed.
      const snapshot = snapshotRef.current;
      endDrag();
      updateContainers(() => snapshot);
    },
    [endDrag, updateContainers]
  );

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (!draggingRef.current) return;
      const { active, over } = e;
      const sourceContainer = sourceContainerRef.current;
      const snapshot = snapshotRef.current;
      endDrag();

      if (!over) {
        // Dropped outside any valid target — revert, same as a cancel.
        updateContainers(() => snapshot);
        return;
      }

      const activeItemId = String(active.id);
      const overItemId = String(over.id);
      // Read the live state directly instead of via a setState updater: calling
      // onFinalize (which calls mutate(), itself a setState elsewhere) from inside a
      // setState updater function retriggers React's update cycle re-entrantly — it
      // looped here, firing the same PATCH dozens of times until React gave up with
      // "Maximum update depth exceeded". containersRef mirrors state exactly (nothing
      // else can write it mid-drag), so reading it here is equivalent and side-effect-free.
      const prev = containersRef.current;

      // Where the item actually sits right now (onDragOver already moved it live if it
      // crossed containers) — this, not the stale "active" container, is the destination.
      const destContainer = findContainer(activeItemId, prev);
      if (!destContainer) {
        updateContainers(() => snapshot);
        return;
      }

      const items = prev[destContainer];
      const oldIndex = items.indexOf(activeItemId);
      const overContainer = findContainer(overItemId, prev);
      const newIndex = overContainer === destContainer ? items.indexOf(overItemId) : items.length - 1;

      const crossedContainer = sourceContainer !== null && sourceContainer !== destContainer;
      const reorderedWithinContainer = oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex;
      if (!crossedContainer && !reorderedWithinContainer) return; // nothing actually changed

      const reordered = reorderedWithinContainer ? arrayMove(items, oldIndex, newIndex) : items;
      const movedFrom = crossedContainer ? sourceContainer : null;
      const next = { ...prev, [destContainer]: reordered };
      updateContainers(() => next);
      onFinalizeRef.current(destContainer, reordered, movedFrom, activeItemId);
    },
    [endDrag, updateContainers]
  );

  return {
    containers,
    setContainers,
    activeId,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
