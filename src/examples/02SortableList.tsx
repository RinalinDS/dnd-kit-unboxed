import { useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Item {
  id: string
  content: string
}

const initItems: Item[] = [
  { id: '1', content: 'Item 1' },
  { id: '2', content: 'Item 2' },
  { id: '3', content: 'Item 3' },
  { id: '4', content: 'Item 4' },
  { id: '5', content: 'Item 5' },
]

export default function SortableList() {
  const [items, setItems] = useState<Item[]>(initItems)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // distance: 10,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { over, active } = event
    if (!over) return
    if (over.id !== active.id) {
      const startIndex = items.findIndex((item) => item.id === active.id)
      const endIndex = items.findIndex((item) => item.id === over.id)
      setItems(arrayMove(items, startIndex, endIndex))
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)
  }
  const handleDragCancel = () => {
    setActiveId(null)
  }

  const getActiveItemContent = (id: UniqueIdentifier) => {
    return items.find((item) => item.id === id)?.content
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Sortable List</h2>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={items.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {items.map(({ id, content }) => (
              <SortableItem id={id} key={id} content={content} />
            ))}
          </ul>
        </SortableContext>
        <DragOverlay
          adjustScale
          dropAnimation={{
            duration: 150,
            easing: 'cubic-bezier(0.19, 0.67, 0.6, 1.22)',
          }}
        >
          <div className="cursor-grab touch-none rounded-md border bg-white p-3 active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400">⋮⋮</span>
              <span className="dark:text-gray-200">
                {activeId ? getActiveItemContent(activeId) : null}
              </span>
            </div>
          </div>
        </DragOverlay>
      </DndContext>
    </div>
  )
}

const SortableItem = ({
  id,
  content,
}: {
  id: UniqueIdentifier
  content: string
}) => {
  const {
    setNodeRef,
    isDragging,
    transition,
    transform,
    listeners,
    attributes,
  } = useSortable({
    id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <li
      className={`cursor-grab touch-none rounded-md border p-3 active:cursor-grabbing ${isDragging ? 'border-2 border-dashed border-gray-300 bg-gray-50 opacity-30 dark:border-gray-600 dark:bg-gray-800/30' : 'bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-500 dark:text-gray-400">⋮⋮</span>
        <span className="dark:text-gray-200">{content}</span>
      </div>
    </li>
  )
}
