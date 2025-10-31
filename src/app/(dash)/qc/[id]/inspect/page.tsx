"use client";

import { use } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function QCInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: forms } = useSWR(`/api/qc-forms?active=true`, fetcher);

  const [qcFormId, setQcFormId] = useState<string>("");
  const [results, setResults] = useState<any>({});
  const [pass, setPass] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedForm = forms?.find((f: any) => f.id === qcFormId);

  const handleSubmit = async () => {
    if (!qcFormId) {
      toast.error("Select a QC form");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/work-orders/${id}/qc-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qcFormId, results, pass, photos: [] }),
      });
      if (!res.ok) throw new Error("Failed to submit QC");
      toast.success("QC result submitted");
      history.back();
    } catch (e) {
      toast.error("Failed to submit QC");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Run QC Inspection</h1>
        <p className="text-sm text-gray-600 mt-1">Fill out the QC form below</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Select QC Form</Label>
          <Select value={qcFormId} onValueChange={setQcFormId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a form" />
            </SelectTrigger>
            <SelectContent>
              {forms?.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedForm && (
          <div className="space-y-4">
            {selectedForm.steps.map((step: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">{step.name}</h3>
                <div className="space-y-2">
                  {(step.checkpoints || []).map((cp: string, cidx: number) => (
                    <div key={cidx} className="space-y-1">
                      <Label>{cp}</Label>
                      <Select
                        value={results?.[idx]?.[cp]?.status || "pass"}
                        onValueChange={(v) =>
                          setResults((prev: any) => ({
                            ...prev,
                            [idx]: {
                              ...(prev[idx] || {}),
                              [cp]: { status: v, notes: prev?.[idx]?.[cp]?.notes || "" },
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Notes"
                        value={results?.[idx]?.[cp]?.notes || ""}
                        onChange={(e) =>
                          setResults((prev: any) => ({
                            ...prev,
                            [idx]: {
                              ...(prev[idx] || {}),
                              [cp]: { status: prev?.[idx]?.[cp]?.status || "pass", notes: e.target.value },
                            },
                          }))
                        }
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <Label>Overall Result</Label>
              <Select value={pass ? "pass" : "fail"} onValueChange={(v) => setPass(v === "pass") }>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit QC"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
