"use client";

import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, User, AlertCircle } from "lucide-react";

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

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const dueDate = task.dueAt ? new Date(task.dueAt) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== "done";
  const isDueSoon = dueDate && (isToday(dueDate) || isTomorrow(dueDate)) && task.status !== "done";

  const typeColors: Record<string, string> = {
    cutting: "bg-purple-100 text-purple-700",
    sewing_coat: "bg-blue-100 text-blue-700",
    sewing_trouser: "bg-green-100 text-green-700",
    finishing: "bg-yellow-100 text-yellow-700",
    rework: "bg-red-100 text-red-700",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
        {isOverdue && (
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-1" />
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            typeColors[task.type] || "bg-gray-100 text-gray-700"
          }`}
        >
          {task.type.replace("_", " ")}
        </span>

        {task.workOrderId && (
          <span className="text-xs text-gray-500">
            WO-{task.workOrderId.slice(-6)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        {task.assignee ? (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{task.assignee.name || task.assignee.email}</span>
          </div>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        )}

        {dueDate && (
          <div
            className={`flex items-center gap-1 ${
              isOverdue
                ? "text-red-600 font-medium"
                : isDueSoon
                ? "text-orange-600 font-medium"
                : ""
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{format(dueDate, "MMM d")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
