"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const shipmentSchema = z.object({
  recipientName: z.string().min(1, "Name is required"),
  recipientAddress: z.string().min(1, "Address is required"),
  recipientCity: z.string().min(1, "City is required"),
  recipientCountry: z.string().min(1, "Country is required"),
  recipientPhone: z.string().min(1, "Phone is required"),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
  description: z.string().optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

interface CreateShipmentFormProps {
  workOrderId: string;
  defaultValues?: Partial<ShipmentFormData>;
  onSuccess?: () => void;
}

export function CreateShipmentForm({
  workOrderId,
  defaultValues,
  onSuccess,
}: CreateShipmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues,
  });

  const onSubmit = async (data: ShipmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create shipment");
      }

      const shipment = await res.json();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/work-orders/${workOrderId}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Recipient Name
        </label>
        <input
          {...register("recipientName")}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.recipientName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.recipientName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          {...register("recipientAddress")}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          disabled={isSubmitting}
        />
        {errors.recipientAddress && (
          <p className="text-red-500 text-sm mt-1">
            {errors.recipientAddress.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            {...register("recipientCity")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSubmitting}
          />
          {errors.recipientCity && (
            <p className="text-red-500 text-sm mt-1">
              {errors.recipientCity.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input
            {...register("recipientCountry")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSubmitting}
          />
          {errors.recipientCountry && (
            <p className="text-red-500 text-sm mt-1">
              {errors.recipientCountry.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          {...register("recipientPhone")}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.recipientPhone && (
          <p className="text-red-500 text-sm mt-1">
            {errors.recipientPhone.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Weight (kg)
        </label>
        <input
          type="number"
          step="0.1"
          {...register("weight")}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.weight && (
          <p className="text-red-500 text-sm mt-1">
            {errors.weight.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description (optional)
        </label>
        <input
          {...register("description")}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Shipment..." : "Create Shipment"}
        </button>
      </div>
    </form>
  );
}
