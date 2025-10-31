"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCountry: "",
    customerCity: "",
    priority: "0",
    dueAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerData: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
            country: formData.customerCountry,
            city: formData.customerCity,
          },
          priority: parseInt(formData.priority),
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create work order");
      }

      const workOrder = await res.json();
      toast.success("Work order created successfully");
      router.push(`/work-orders/${workOrder.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create work order");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/work-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create Work Order
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Enter customer details to create a new work order
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Customer Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCity">City</Label>
                <Input
                  id="customerCity"
                  value={formData.customerCity}
                  onChange={(e) => handleChange("customerCity", e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCountry">Country</Label>
                <Input
                  id="customerCountry"
                  value={formData.customerCountry}
                  onChange={(e) =>
                    handleChange("customerCountry", e.target.value)
                  }
                  placeholder="France"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-medium">Order Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm"
                >
                  <option value="0">Normal</option>
                  <option value="1">High</option>
                  <option value="2">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueAt">Due Date</Label>
                <Input
                  id="dueAt"
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) => handleChange("dueAt", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Work Order"}
            </Button>
            <Link href="/work-orders">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
