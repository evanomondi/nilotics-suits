"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function QCPage() {
  const { data, error, isLoading } = useSWR(
    "/api/work-orders?stage=in_qc&limit=50",
    fetcher
  );

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Failed to load</div>;
  }

  const workOrders = data?.workOrders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quality Control</h1>
        <p className="text-sm text-gray-600 mt-1">
          Run inspections on work orders in QC stage
        </p>
      </div>

      {!workOrders.length ? (
        <EmptyState
          icon={CheckCircle}
          title="No orders in QC"
          description="Orders will appear here when they enter the QC stage."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workOrders.map((wo: any) => (
            <Card key={wo.id} className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">{wo.customer.name}</h3>
                  <p className="text-xs text-gray-500">{wo.customer.email}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge>In QC</Badge>
                  {wo.dueAt && (
                    <span className="text-xs text-gray-500">
                      Due {format(new Date(wo.dueAt), "MMM d")}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/qc/${wo.id}/inspect`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Run Inspection
                    </Button>
                  </Link>
                  <Link href={`/work-orders/${wo.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
