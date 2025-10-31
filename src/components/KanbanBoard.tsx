"use client";

import { WorkOrderCard } from "./WorkOrderCard";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface WorkOrder {
  id: string;
  currentStage: string;
  priority: number;
  dueAt: Date | null;
  customer: {
    name: string;
    email: string;
  };
  assignedEuTailor?: {
    name: string;
  } | null;
}

interface KanbanBoardProps {
  workOrders: WorkOrder[];
}

const STAGES = [
  { key: "measurement_pending", label: "Awaiting Measurements", color: "bg-yellow-100" },
  { key: "measurement_submitted", label: "Submitted", color: "bg-blue-100" },
  { key: "measurement_approved", label: "Approved", color: "bg-green-100" },
  { key: "in_production", label: "In Production", color: "bg-purple-100" },
  { key: "in_qc", label: "Quality Control", color: "bg-orange-100" },
  { key: "ready_to_ship", label: "Ready to Ship", color: "bg-cyan-100" },
  { key: "in_transit_to_eu", label: "In Transit", color: "bg-indigo-100" },
  { key: "at_eu_tailor", label: "At EU Tailor", color: "bg-pink-100" },
  { key: "completed", label: "Completed", color: "bg-emerald-100" },
];

export function KanbanBoard({ workOrders }: KanbanBoardProps) {
  const groupedOrders = STAGES.reduce((acc, stage) => {
    acc[stage.key] = workOrders.filter((wo) => wo.currentStage === stage.key);
    return acc;
  }, {} as Record<string, WorkOrder[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const orders = groupedOrders[stage.key] || [];
        return (
          <div key={stage.key} className="flex-shrink-0 w-80">
            <Card className={`p-3 ${stage.color} border-0`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {orders.length}
                </Badge>
              </div>
            </Card>
            
            <div className="mt-3 space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No orders
                </div>
              ) : (
                orders.map((order) => (
                  <WorkOrderCard key={order.id} workOrder={order} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
