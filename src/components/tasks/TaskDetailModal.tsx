"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Calendar, User, CheckSquare, Trash2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  type: string;
  dueAt?: Date | string | null;
  workOrderId?: string | null;
  checklist?: any;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  workOrder?: {
    id: string;
    customer: { name: string };
  } | null;
  createdAt: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (taskId: string, data: any) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  const handleStatusChange = (newStatus: string) => {
    if (onUpdate) {
      onUpdate(task.id, { status: newStatus });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(task.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const statusColors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    blocked: "bg-red-100 text-red-700",
    cancelled: "bg-gray-200 text-gray-600",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-2 flex-wrap">
              {["todo", "in_progress", "done", "blocked"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    task.status === status
                      ? statusColors[status]
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignee
              </label>
              <p className="text-gray-700">
                {task.assignee?.name || task.assignee?.email || "Unassigned"}
              </p>
            </div>

            {task.dueAt && (
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <p className="text-gray-700">
                  {format(new Date(task.dueAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <p className="text-gray-700 capitalize">
                {task.type.replace("_", " ")}
              </p>
            </div>

            {task.workOrder && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Work Order
                </label>
                <p className="text-gray-700">
                  {task.workOrder.customer.name} (
                  {task.workOrderId?.slice(-6)})
                </p>
              </div>
            )}
          </div>

          {/* Checklist */}
          {task.checklist && Array.isArray(task.checklist) && (
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Checklist
              </label>
              <div className="space-y-2">
                {task.checklist.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed || false}
                      onChange={() => {
                        // TODO: Implement checklist update
                      }}
                      className="rounded"
                    />
                    <span
                      className={
                        item.completed ? "line-through text-gray-400" : ""
                      }
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Created: {format(new Date(task.createdAt), "MMM d, yyyy")}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete Task"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
