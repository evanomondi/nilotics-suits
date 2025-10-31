"use client";

import { use } from "react";
import useSWR, { mutate } from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: workOrder, error, isLoading } = useSWR(
    `/api/work-orders/${id}`,
    fetcher
  );
  const [noteBody, setNoteBody] = useState("");
  const [noteVisibility, setNoteVisibility] = useState("internal");
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleAddNote = async () => {
    if (!noteBody.trim()) return;
    
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/work-orders/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody, visibility: noteVisibility }),
      });

      if (!res.ok) throw new Error("Failed to add note");
      
      toast.success("Note added");
      setNoteBody("");
      mutate(`/api/work-orders/${id}`);
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStageTransition = async (newStage: string) => {
    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: newStage }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to update stage");
        return;
      }
      
      toast.success(`Moved to ${stageLabels[newStage]}`);
      mutate(`/api/work-orders/${id}`);
    } catch (error) {
      toast.error("Failed to update stage");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading work order...</p>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load work order</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Work Order {workOrder.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Created {format(new Date(workOrder.createdAt), "PPP")}
          </p>
        </div>
        <Badge className="text-sm">
          {stageLabels[workOrder.currentStage] || workOrder.currentStage}
        </Badge>
      </div>

      {/* Customer Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span>{workOrder.customer.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{workOrder.customer.email}</span>
          </div>
          {workOrder.customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{workOrder.customer.phone}</span>
            </div>
          )}
          {workOrder.customer.city && workOrder.customer.country && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{workOrder.customer.city}, {workOrder.customer.country}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Stage Transition */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Stage Management</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Move to:</span>
          <div className="flex gap-2 flex-wrap">
            {workOrder.currentStage !== "measurement_approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStageTransition("measurement_approved")}
              >
                <ArrowRight className="h-3 w-3 mr-1" /> Approve Measurements
              </Button>
            )}
            {workOrder.currentStage === "measurement_approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStageTransition("in_production")}
              >
                <ArrowRight className="h-3 w-3 mr-1" /> Start Production
              </Button>
            )}
            {workOrder.currentStage === "in_production" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStageTransition("in_qc")}
              >
                <ArrowRight className="h-3 w-3 mr-1" /> Move to QC
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">
            Tasks ({workOrder.tasks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="measurements">
            Measurements ({workOrder.measurements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="qc">
            QC Results ({workOrder.qcResults?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="shipments">
            Shipments ({workOrder.shipments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes ({workOrder.notes?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card className="p-6">
            {!workOrder.tasks?.length ? (
              <p className="text-sm text-gray-600">No tasks yet.</p>
            ) : (
              <div className="space-y-3">
                {workOrder.tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{task.type}</p>
                      <p className="text-xs text-gray-600">
                        {task.assigneeTailor?.name || "Unassigned"}
                      </p>
                    </div>
                    <Badge>{task.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="measurements">
          <Card className="p-6">
            {!workOrder.measurements?.length ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 mb-4">No measurements recorded yet.</p>
                <Link href={`/work-orders/${id}/measurements/new`}>
                  <Button size="sm">Record Measurements</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {workOrder.measurements.map((m: any) => (
                  <div key={m.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge>{m.source}</Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(m.createdAt), "PPP")}
                      </span>
                    </div>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(m.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="qc">
          <Card className="p-6">
            {!workOrder.qcResults?.length ? (
              <p className="text-sm text-gray-600">No QC results yet.</p>
            ) : (
              <div className="space-y-4">
                {workOrder.qcResults.map((qc: any) => (
                  <div key={qc.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {qc.pass ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">{qc.qcForm.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(qc.createdAt), "PPP")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Inspector: {qc.inspector.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="shipments">
          <Card className="p-6">
            {!workOrder.shipments?.length ? (
              <p className="text-sm text-gray-600">No shipments yet.</p>
            ) : (
              <div className="space-y-4">
                {workOrder.shipments.map((s: any) => (
                  <div key={s.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{s.courier}</p>
                          <p className="text-xs text-gray-600">{s.waybill}</p>
                        </div>
                      </div>
                      <Badge>{s.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="p-6 space-y-4">
            {/* Add Note Form */}
            <div className="space-y-3">
              <Textarea
                placeholder="Add a note..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-3">
                <Select value={noteVisibility} onValueChange={setNoteVisibility}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="customer">Customer Visible</SelectItem>
                    <SelectItem value="tailor">Tailor Visible</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddNote}
                  disabled={submittingNote || !noteBody.trim()}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {!workOrder.notes?.length ? (
                <p className="text-sm text-gray-600">No notes yet.</p>
              ) : (
                workOrder.notes.map((note: any) => (
                  <div key={note.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{note.author.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {note.visibility}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(note.createdAt), "PPp")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.body}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
