"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data, error } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Failed to load dashboard. Please try again.
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your overview.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Orders"
          value={data.workOrders.total}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="In Production"
          value={data.workOrders.inProduction}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="In QC"
          value={data.workOrders.inQc}
          icon={CheckCircle}
          color="purple"
        />
        <MetricCard
          title="Ready to Ship"
          value={data.workOrders.readyToShip}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Distribution */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Work Orders by Stage</h3>
          <StageChart stages={data.workOrders.byStage} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/work-orders/new"
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">New Work Order</span>
            </Link>
            <Link
              href="/tasks"
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">View Tasks</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Package className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pending Tasks</h3>
            {data.tasks.overdue > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {data.tasks.overdue} overdue
              </span>
            )}
          </div>
          <div className="space-y-3">
            {data.tasks.pending.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending tasks</p>
            ) : (
              data.tasks.pending.slice(0, 5).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-md"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.workOrder && (
                      <p className="text-xs text-gray-500">
                        {task.workOrder.customer.name}
                      </p>
                    )}
                  </div>
                  {task.dueAt && (
                    <span
                      className={`text-xs ${
                        new Date(task.dueAt) < new Date()
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {formatDistanceToNow(new Date(task.dueAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              ))
            )}
            {data.tasks.pending.length > 5 && (
              <Link
                href="/tasks"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 pt-2"
              >
                View all tasks
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity</p>
            ) : (
              data.recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-medium">
                      {activity.actor?.name?.[0] || "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">
                      <span className="font-medium">
                        {activity.actor?.name || "System"}
                      </span>{" "}
                      {formatAction(activity.action)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${colors[color as keyof typeof colors]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function StageChart({ stages }: { stages: Record<string, number> }) {
  const stageLabels: Record<string, string> = {
    intake_pending: "Intake",
    measurement_pending: "Meas. Pending",
    measurement_submitted: "Meas. Submitted",
    measurement_approved: "Meas. Approved",
    in_production: "Production",
    in_qc: "QC",
    ready_to_ship: "Ready to Ship",
    in_transit_to_eu: "In Transit",
    at_eu_tailor: "At EU Tailor",
    ready_for_pickup: "Ready for Pickup",
    delivered: "Delivered",
    completed: "Completed",
  };

  const maxValue = Math.max(...Object.values(stages), 1);

  return (
    <div className="space-y-3">
      {Object.entries(stages)
        .sort(([, a], [, b]) => b - a)
        .map(([stage, count]) => (
          <div key={stage}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{stageLabels[stage] || stage}</span>
              <span className="font-medium">{count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(count / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}

function formatAction(action: string): string {
  const actions: Record<string, string> = {
    work_order_created: "created a work order",
    work_order_updated: "updated a work order",
    task_created: "created a task",
    qc_result_created: "completed QC inspection",
    shipment_created: "created a shipment",
  };

  return actions[action] || action.replace(/_/g, " ");
}
