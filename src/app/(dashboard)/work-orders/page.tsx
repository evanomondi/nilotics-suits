"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus, Search, Filter, Download, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WorkOrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    stage: "",
    priority: "",
    assignedTailor: "",
  });

  // Build query params
  const queryParams = new URLSearchParams();
  if (filters.stage) queryParams.append("stage", filters.stage);
  if (filters.priority) queryParams.append("priority", filters.priority);
  if (filters.assignedTailor) queryParams.append("assignedTailor", filters.assignedTailor);
  if (searchQuery) queryParams.append("search", searchQuery);

  const { data: workOrders, error, mutate } = useSWR(
    `/api/work-orders?${queryParams.toString()}`,
    fetcher
  );

  const { data: users } = useSWR("/api/users", fetcher);

  const clearFilters = () => {
    setFilters({ stage: "", priority: "", assignedTailor: "" });
    setSearchQuery("");
  };

  const hasFilters = filters.stage || filters.priority || filters.assignedTailor || searchQuery;

  const stageLabels: Record<string, string> = {
    intake_pending: "Intake Pending",
    measurement_pending: "Measurement Pending",
    measurement_submitted: "Measurement Submitted",
    measurement_approved: "Measurement Approved",
    in_production: "In Production",
    in_qc: "In QC",
    ready_to_ship: "Ready to Ship",
    in_transit_to_eu: "In Transit to EU",
    at_eu_tailor: "At EU Tailor",
    ready_for_pickup: "Ready for Pickup",
    delivered: "Delivered",
    completed: "Completed",
    blocked: "Blocked",
  };

  const stageColors: Record<string, string> = {
    intake_pending: "bg-gray-100 text-gray-700",
    measurement_pending: "bg-yellow-100 text-yellow-700",
    measurement_submitted: "bg-blue-100 text-blue-700",
    measurement_approved: "bg-green-100 text-green-700",
    in_production: "bg-purple-100 text-purple-700",
    in_qc: "bg-orange-100 text-orange-700",
    ready_to_ship: "bg-teal-100 text-teal-700",
    in_transit_to_eu: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-200 text-green-800",
    completed: "bg-gray-200 text-gray-800",
    blocked: "bg-red-100 text-red-700",
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Failed to load work orders. Please try again.
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
            <h1 className="text-2xl font-bold">Work Orders</h1>
            <p className="text-gray-500 text-sm">
              {workOrders ? `${workOrders.length} orders` : "Loading..."}
            </p>
          </div>
          <Link
            href="/work-orders/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Work Order
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
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
                {Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 bg-gray-50 p-4 rounded-md space-y-3">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Stage</label>
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All stages</option>
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All priorities</option>
                  <option value="0-3">Low (0-3)</option>
                  <option value="4-7">Medium (4-7)</option>
                  <option value="8-10">High (8-10)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assigned Tailor</label>
                <select
                  value={filters.assignedTailor}
                  onChange={(e) => setFilters({ ...filters, assignedTailor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All tailors</option>
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

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        {!workOrders ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No work orders found. Create your first one!
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workOrders.map((wo: any) => (
                  <tr
                    key={wo.id}
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-mono">
                      {wo.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{wo.customer.name}</p>
                        <p className="text-xs text-gray-500">{wo.customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          stageColors[wo.currentStage] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {stageLabels[wo.currentStage] || wo.currentStage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          wo.priority >= 8
                            ? "text-red-600"
                            : wo.priority >= 4
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {wo.dueAt ? format(new Date(wo.dueAt), "MMM d, yyyy") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(wo.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
