"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { WorkOrderCard } from "@/components/WorkOrderCard";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import { useState, useMemo } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MyWorkPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const { data, error, isLoading } = useSWR(
    session?.user ? "/api/work-orders?limit=100" : null,
    fetcher
  );

  // Filter by assigned EU tailor (done in API, but additional client filter for search)
  const filtered = useMemo(() => {
    if (!data?.workOrders) return [];
    const orders = data.workOrders;
    
    if (!search) return orders;
    
    const q = search.toLowerCase();
    return orders.filter(
      (wo: any) =>
        wo.customer.name?.toLowerCase().includes(q) ||
        wo.customer.email?.toLowerCase().includes(q) ||
        wo.customer.phone?.toLowerCase().includes(q)
    );
  }, [data, search]);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Failed to load</div>;
  }

  // Group by stage
  const today = filtered.filter((wo: any) =>
    ["measurement_pending", "measurement_submitted"].includes(wo.currentStage)
  );
  const others = filtered.filter((wo: any) =>
    !["measurement_pending", "measurement_submitted"].includes(wo.currentStage)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Work Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Orders assigned to you
        </p>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by customer name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {!filtered.length ? (
        <EmptyState
          icon={Package}
          title="No work orders assigned"
          description="Orders will appear here when assigned to you."
        />
      ) : (
        <>
          {today.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium">Awaiting Action</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {today.map((wo: any) => (
                  <WorkOrderCard key={wo.id} workOrder={wo} />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium">Other Orders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map((wo: any) => (
                  <WorkOrderCard key={wo.id} workOrder={wo} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
