import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface WorkOrderCardProps {
  workOrder: {
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
  };
}

const stageColors: Record<string, string> = {
  intake_pending: "bg-gray-500",
  measurement_pending: "bg-yellow-500",
  measurement_submitted: "bg-blue-500",
  measurement_approved: "bg-green-500",
  in_production: "bg-purple-500",
  in_qc: "bg-orange-500",
  ready_to_ship: "bg-cyan-500",
  in_transit_to_eu: "bg-indigo-500",
  at_eu_tailor: "bg-pink-500",
  eu_adjustment: "bg-amber-500",
  ready_for_pickup: "bg-lime-500",
  completed: "bg-emerald-500",
  blocked: "bg-red-500",
};

const stageLabels: Record<string, string> = {
  intake_pending: "Intake Pending",
  measurement_pending: "Awaiting Measurements",
  measurement_submitted: "Measurements Submitted",
  measurement_approved: "Measurements Approved",
  in_production: "In Production",
  in_qc: "Quality Control",
  ready_to_ship: "Ready to Ship",
  in_transit_to_eu: "In Transit",
  at_eu_tailor: "At EU Tailor",
  eu_adjustment: "EU Adjustment",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  blocked: "Blocked",
};

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const isOverdue =
    workOrder.dueAt && new Date(workOrder.dueAt) < new Date();
  const isDueSoon =
    workOrder.dueAt &&
    new Date(workOrder.dueAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Link href={`/work-orders/${workOrder.id}`}>
      <Card
        className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
          isOverdue
            ? "border-l-4 border-l-red-500"
            : isDueSoon
            ? "border-l-4 border-l-yellow-500"
            : ""
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              {workOrder.customer.name}
            </h3>
            <p className="text-xs text-gray-500">{workOrder.customer.email}</p>
          </div>
          {workOrder.priority > 0 && (
            <Badge variant="destructive" className="text-xs">
              P{workOrder.priority}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Badge
            className={`text-xs ${
              stageColors[workOrder.currentStage]
            } text-white`}
          >
            {stageLabels[workOrder.currentStage] || workOrder.currentStage}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          {workOrder.dueAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {format(new Date(workOrder.dueAt), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {workOrder.assignedEuTailor && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{workOrder.assignedEuTailor.name}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
