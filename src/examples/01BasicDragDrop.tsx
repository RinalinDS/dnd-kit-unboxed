import {
  DndContext,
  DragEndEvent, pointerWithin,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { ReactNode, useState } from 'react'

const Draggable = () => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'draggable',
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined
  return (
    <div
      style={style}
      className="h-24 w-24 cursor-grab touch-none rounded-md bg-blue-500 p-4 text-white active:cursor-grabbing dark:bg-blue-600"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      Drag me
    </div>
  )
}
type DroppableProps = {
  children: ReactNode
}
const Droppable = ({ children }: DroppableProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'droppable',
  })

  console.log(children)
  return (
    <div
      className={`border-gray-40 flex h-40 w-40 items-center justify-center rounded-md border-2 border-dashed ${isOver ? 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/30' : 'border-gray-400'}`}
      ref={setNodeRef}
    >
      {children || (
        <span className="text-gray-500 dark:text-gray-400">Drop here</span>
      )}
    </div>
  )
}

export const BasicDragDrop = () => {
  const [isDropped, setIsDropped] = useState(false)
  const handleDragEnd = (e: DragEndEvent) => {
    const { over,  } = e
    if (over && over.id) {
      setIsDropped(true)
    } else {
      setIsDropped(false)
    }
  }
  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
        {!isDropped && <Draggable />}

        <Droppable>{isDropped && <Draggable />}</Droppable>
      </div>
    </DndContext>
  )
}
