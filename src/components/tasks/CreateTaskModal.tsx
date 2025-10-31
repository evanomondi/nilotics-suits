"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["cutting", "sewing_coat", "sewing_trouser", "finishing", "rework"]),
  assigneeId: z.string().optional(),
  workOrderId: z.string().optional(),
  dueAt: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (task: any) => void;
  workOrderId?: string;
  users?: Array<{ id: string; name: string | null; email: string }>;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  workOrderId,
  users = [],
}: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      workOrderId,
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint = data.workOrderId
        ? `/api/work-orders/${data.workOrderId}/tasks`
        : "/api/tasks";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dueAt: data.dueAt ? new Date(data.dueAt).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const task = await res.json();

      if (onSuccess) {
        onSuccess(task);
      }

      reset();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Create Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isSubmitting}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register("description")}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              disabled={isSubmitting}
              placeholder="Optional task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isSubmitting}
            >
              <option value="">Select type</option>
              <option value="cutting">Cutting</option>
              <option value="sewing_coat">Sewing Coat</option>
              <option value="sewing_trouser">Sewing Trouser</option>
              <option value="finishing">Finishing</option>
              <option value="rework">Rework</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            <select
              {...register("assigneeId")}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isSubmitting}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="datetime-local"
              {...register("dueAt")}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isSubmitting}
            />
          </div>

          {!workOrderId && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Work Order ID (optional)
              </label>
              <input
                {...register("workOrderId")}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isSubmitting}
                placeholder="Enter work order ID"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
