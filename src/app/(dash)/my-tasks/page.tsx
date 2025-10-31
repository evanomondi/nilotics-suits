"use client";

import useSWR, { mutate } from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MyTasksPage() {
  const { data, error, isLoading } = useSWR("/api/work-orders?limit=100", fetcher);

  const handleTaskAction = async (workOrderId: string, taskId: string, action: "start" | "finish") => {
    try {
      const status = action === "start" ? "in_progress" : "completed";
      const res = await fetch(`/api/work-orders/${workOrderId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success(action === "start" ? "Task started" : "Task completed");
      mutate("/api/work-orders?limit=100");
    } catch (e) {
      toast.error("Failed to update task");
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Failed to load</div>;
  }

  // Extract all tasks assigned to current user
  const allTasks: any[] = [];
  data?.workOrders?.forEach((wo: any) => {
    wo.tasks?.forEach((task: any) => {
      if (task.status !== "completed") {
        allTasks.push({ ...task, workOrder: wo });
      }
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <p className="text-sm text-gray-600 mt-1">
          Production tasks assigned to you
        </p>
      </div>

      {!allTasks.length ? (
        <EmptyState
          icon={Wrench}
          title="No tasks assigned"
          description="Tasks will appear here when assigned to you."
        />
      ) : (
        <div className="space-y-3">
          {allTasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold">{task.type.replace("_", " ").toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">
                      Customer: {task.workOrder.customer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Work Order: {task.workOrder.id.slice(0, 8)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge>{task.status.replace("_", " ")}</Badge>
                    {task.startedAt && (
                      <span className="text-xs text-gray-500">
                        Started {format(new Date(task.startedAt), "MMM d, HH:mm")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {task.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleTaskAction(task.workOrder.id, task.id, "start")}
                    >
                      Start Task
                    </Button>
                  )}
                  {task.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleTaskAction(task.workOrder.id, task.id, "finish")}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
