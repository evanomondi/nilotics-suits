"use client";

import { TaskCard } from "./TaskCard";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  type: string;
  dueAt?: Date | string | null;
  workOrderId?: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const columns = [
  { id: "todo", label: "To Do", color: "bg-gray-100" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-100" },
  { id: "done", label: "Done", color: "bg-green-100" },
  { id: "blocked", label: "Blocked", color: "bg-red-100" },
];

export function KanbanBoard({ tasks, onTaskClick, onStatusChange }: KanbanBoardProps) {
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col bg-gray-50 rounded-lg p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm uppercase text-gray-600">
              {column.label}
            </h3>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
              {tasksByStatus[column.id]?.length || 0}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {tasksByStatus[column.id]?.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="cursor-move"
              >
                <TaskCard
                  task={task}
                  onClick={() => onTaskClick && onTaskClick(task)}
                />
              </div>
            ))}

            {(!tasksByStatus[column.id] || tasksByStatus[column.id].length === 0) && (
              <div className="text-center text-gray-400 text-sm py-8">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
