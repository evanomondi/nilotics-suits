"use client";

import { useState, useMemo } from "react";
import { WorkOrderCard } from "@/components/WorkOrderCard";
import { KanbanBoard } from "@/components/KanbanBoard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Package } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WorkOrdersPage() {
  const [view, setView] = useState<"grid" | "kanban">("grid");
  const [stage, setStage] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const { data, error, isLoading } = useSWR(
    `/api/work-orders?page=1&limit=50${stage !== "all" ? `&stage=${stage}` : ""}`,
    fetcher
  );

  const filtered = useMemo(() => {
    if (!data?.workOrders) return [];
    if (!search) return data.workOrders;
    const q = search.toLowerCase();
    return data.workOrders.filter(
      (wo: any) =>
        wo.customer.name?.toLowerCase().includes(q) ||
        wo.customer.email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load work orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all custom suit orders from measurement to delivery
          </p>
        </div>
        <Link href="/work-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Work Order
          </Button>
        </Link>
      </div>

      <Card className="p-3 flex items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "kanban")}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2 w-full max-w-md">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by customer name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto w-[240px]">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger>
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              <SelectItem value="intake_pending">Intake Pending</SelectItem>
              <SelectItem value="measurement_pending">Awaiting Measurements</SelectItem>
              <SelectItem value="measurement_submitted">Measurements Submitted</SelectItem>
              <SelectItem value="measurement_approved">Measurements Approved</SelectItem>
              <SelectItem value="in_production">In Production</SelectItem>
              <SelectItem value="in_qc">Quality Control</SelectItem>
              <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
              <SelectItem value="in_transit_to_eu">In Transit</SelectItem>
              <SelectItem value="at_eu_tailor">At EU Tailor</SelectItem>
              <SelectItem value="eu_adjustment">EU Adjustment</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading work orders...</p>
        </div>
      ) : !filtered?.length ? (
        <EmptyState
          icon={Package}
          title="No work orders found"
          description="Try adjusting filters or create a new work order."
          action={
            <Link href="/work-orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create Work Order
              </Button>
            </Link>
          }
        />
      ) : view === "kanban" ? (
        <KanbanBoard workOrders={filtered} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((wo: any) => (
            <WorkOrderCard key={wo.id} workOrder={wo} />
          ))}
        </div>
      )}

      {data?.workOrders && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filtered.length} of {data.total} work orders
        </div>
      )}
    </div>
  );
}
