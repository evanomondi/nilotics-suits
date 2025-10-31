"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { Plus, Filter, X } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TasksPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Build query string
  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.append("status", statusFilter);
  if (assigneeFilter) queryParams.append("assigneeId", assigneeFilter);

  const { data: tasks, mutate, error } = useSWR(
    `/api/tasks?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: users } = useSWR("/api/users", fetcher);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Find the work order ID for this task
      const task = tasks?.find((t: any) => t.id === taskId);
      if (!task) return;

      const endpoint = task.workOrderId
        ? `/api/work-orders/${task.workOrderId}/tasks/${taskId}`
        : `/api/tasks/${taskId}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Optimistically update the UI
        mutate();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleTaskCreated = () => {
    mutate();
  };

  const handleTaskUpdate = async (taskId: string, data: any) => {
    try {
      const task = tasks?.find((t: any) => t.id === taskId);
      if (!task) return;

      const endpoint = task.workOrderId
        ? `/api/work-orders/${task.workOrderId}/tasks/${taskId}`
        : `/api/tasks/${taskId}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        mutate();
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const task = tasks?.find((t: any) => t.id === taskId);
      if (!task) return;

      const endpoint = task.workOrderId
        ? `/api/work-orders/${task.workOrderId}/tasks/${taskId}`
        : `/api/tasks/${taskId}`;

      const res = await fetch(endpoint, { method: "DELETE" });

      if (res.ok) {
        mutate();
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setAssigneeFilter("");
  };

  const hasFilters = statusFilter || assigneeFilter;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Failed to load tasks. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Task Board</h1>
            <p className="text-gray-500 text-sm">
              {tasks ? `${tasks.length} tasks` : "Loading..."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2 ${
                hasFilters ? "bg-blue-50 border-blue-300" : ""
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[statusFilter, assigneeFilter].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Filters</h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All assignees</option>
                  <option value="unassigned">Unassigned</option>
                  {users?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-hidden">
        {!tasks ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTaskCreated}
        users={users || []}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}
