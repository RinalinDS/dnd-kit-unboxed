import { ReactNode, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useDroppable,
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

interface Container {
  id: string
  title: string
  items: Item[]
}

type DroppableContainerProps = {
  id: string
  title: string
  items: Item[]
}

const SortableItem = ({ id, content }: Item) => {
  const {
    setNodeRef,
    listeners,
    attributes,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none rounded border bg-white p-3 active:cursor-grabbing dark:border-gray-700 dark:bg-gray-700 ${isDragging ? 'z-10 opacity-50 shadow-md' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-500 dark:text-gray-400">⋮</span>
        <span className="dark:text-gray-200">{content}</span>
      </div>
    </li>
  )
}

const DroppableContainer = ({ id, title, items }: DroppableContainerProps) => {
  const { setNodeRef } = useDroppable({
    id,
  })
  return (
    <div
      ref={setNodeRef}
      className="flex h-full min-h-40 flex-col rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">
        {title}
      </h3>
      <div className="flex-1">
        <ul className="flex flex-col gap-2">
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map(({ id, content }) => (
              <SortableItem key={id} id={id} content={content} />
            ))}
          </SortableContext>
        </ul>

        {items.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drop items here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const ItemOverlay = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={`cursor-grab touch-none rounded border bg-white p-3 shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-700`}
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-500 dark:text-gray-400">⋮</span>
        <span className="dark:text-gray-200">{children}</span>
      </div>
    </div>
  )
}

export default function MultipleContainers() {
  const [containers, setContainers] = useState<Container[]>([
    {
      id: 'todo',
      title: 'To Do',
      items: [
        { id: 'task-1', content: 'Research @dnd-kit' },
        { id: 'task-2', content: 'Create basic example' },
        { id: 'task-3', content: 'Write tutorial' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: [{ id: 'task-4', content: 'Record demo video' }],
    },
    {
      id: 'done',
      title: 'Done',
      items: [{ id: 'task-5', content: 'Setup project' }],
    },
  ])
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id)
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { over, active } = e
    if (!over) return
    const overId = over.id
    const activeId = active.id

    const activeContainerId = findContainerId(activeId)
    const overContainerId = findContainerId(overId)
    // если нет контейнеров
    if (!overContainerId || !activeContainerId) return
    // если мы в пределах одного контейнера
    if (overContainerId === activeContainerId) return
    // если мы в пределах одного контейнера и все таки что-то меняется местами, то есть происходит сортировка -
    // тоже ретурн, потому что это обработается в handleDragEnd
    if (overContainerId === activeContainerId && overId !== activeId) return

    setContainers((prev) => {
      const activeContainer = prev.find(
        (container) => container.id === activeContainerId,
      )
      if (!activeContainer) {
        return prev
      }

      const activeItem = activeContainer.items.find(
        (item) => item.id === activeId,
      )
      if (!activeItem) return prev

      const newContainers = prev.map((container) => {
        if (container.id === activeContainerId) {
          return {
            ...container,
            items: container.items.filter((item) => activeItem.id !== item.id),
          }
        }
        if (container.id === overContainerId) {
          if (overId === overContainerId) {
            return {
              ...container,
              items: [...container.items, activeItem],
            }
          }

          const overItemIndex = container.items.findIndex(
            (item) => item.id === overId,
          )
          if (overItemIndex !== -1) {
            // это не сортировка по факту, тут просто оно куда-то засунет, а потом это подхватит сортировка в драгЕнд, главное тут не удалить элементы.
            return {
              ...container,
              items: [
                ...container.items.slice(0, overItemIndex + 1),
                activeItem,
                ...container.items.slice(overItemIndex + 1),
              ],
            }
          }
        }
        return container
      })
      return newContainers
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { over, active } = e
    if (!over) {
      setActiveId(null)
      return
    }

    const activeContainerId = findContainerId(active.id)
    const overContainerId = findContainerId(over.id)
    // если нет контейнеров
    if (!overContainerId || !activeContainerId) {
      setActiveId(null)
      return
    }
    if (overContainerId === activeContainerId && over.id !== active.id) {
      const containerIndex = containers.findIndex(
        (container) => container.id === overContainerId,
      )
      if (containerIndex === -1) {
        setActiveId(null)
        return
      }
      const container = containers[containerIndex]

      const activeIndex = container.items.findIndex(
        (item) => item.id === active.id,
      )
      const overIndex = container.items.findIndex((item) => item.id === over.id)

      if (activeIndex !== -1 && overIndex !== -1) {
        const newItems = arrayMove(container.items, activeIndex, overIndex)
        setContainers((prevContainers) => {
          return prevContainers.map((container, index) => {
            if (index === containerIndex) {
              return {
                ...container,
                items: newItems,
              }
            } else {
              return container
            }
          })
        })
      }
    }
    setActiveId(null)
  }

  function findContainerId(
    itemId: UniqueIdentifier,
  ): UniqueIdentifier | undefined {
    if (containers.some((item) => item.id === itemId)) {
      return itemId
    }

    return containers.find((container) =>
      container.items.some((task) => task.id === itemId),
    )?.id
  }

  const getActiveItem = () => {
    for (const container of containers) {
      const item = container.items.find((item) => item.id === activeId)
      if (item) return item
    }
    return null
  }

  return (
    <div className="mx-auto w-full">
      <h2 className="mb-4 text-xl font-bold dark:text-white">Kanban Board</h2>

      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        sensors={sensors}
        collisionDetection={closestCenter}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {containers.map(({ items, id, title }) => (
            <DroppableContainer key={id} id={id} title={title} items={items} />
          ))}
        </div>
        <DragOverlay
          dropAnimation={{
            duration: 150,
            easing: 'cubic-bezier(0.19, 0.67, 0.6, 1.22)',
          }}
        >
          {activeId ? (
            <ItemOverlay>{getActiveItem()?.content}</ItemOverlay>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
