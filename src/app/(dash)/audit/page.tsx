"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search } from "lucide-react";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>("all");
  const [target, setTarget] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "50",
    ...(action !== "all" && { action }),
    ...(target && { target }),
  });

  const { data, error, isLoading } = useSWR(
    `/api/audit-logs?${queryParams}`,
    fetcher
  );

  const handleExport = () => {
    if (!data?.logs) return;

    const headers = ["Timestamp", "Actor", "Action", "Target", "Diff"];
    const rows = data.logs.map((log: any) => [
      format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
      log.actor?.name || "System",
      log.action,
      log.target,
      JSON.stringify(log.diff || {}),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">Failed to load</div>;
  }

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete audit trail of all system actions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!logs.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 w-full max-w-md">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by target ID"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="work_order_created">Work Order Created</SelectItem>
              <SelectItem value="work_order_updated">Work Order Updated</SelectItem>
              <SelectItem value="measurement_created">Measurement Created</SelectItem>
              <SelectItem value="task_updated">Task Updated</SelectItem>
              <SelectItem value="qc_result_created">QC Result Created</SelectItem>
              <SelectItem value="note_created">Note Created</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!logs.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <>
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.actor?.name || "System"}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {log.actor?.role || "SYSTEM"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.target.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedRow(expandedRow === log.id ? null : log.id)
                        }
                      >
                        {expandedRow === log.id ? "Hide" : "Show"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRow === log.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-gray-50">
                        <pre className="text-xs overflow-auto p-2">
                          {JSON.stringify(log.diff, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {data.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === data.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
