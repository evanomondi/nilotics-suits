"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import { Save } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const companySettingsSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_address: z.string().min(1, "Address is required"),
  company_phone: z.string().min(1, "Phone is required"),
  company_email: z.string().email("Invalid email"),
  company_website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CompanySettingsForm = z.infer<typeof companySettingsSchema>;

export default function CompanySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data: settings, mutate } = useSWR(
    "/api/settings?keys=company_name,company_address,company_phone,company_email,company_website",
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanySettingsForm>({
    resolver: zodResolver(companySettingsSchema),
    values: settings || {},
  });

  const onSubmit = async (data: CompanySettingsForm) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setSaveMessage("Settings saved successfully");
      mutate();
    } catch (error: any) {
      setSaveMessage(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Company Information</h2>
        <p className="text-gray-500 text-sm">Configure company details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {saveMessage && (
          <div
            className={`p-3 rounded-md text-sm ${
              saveMessage.includes("success")
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {saveMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            {...register("company_name")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Nilotic Suits"
            disabled={isSaving}
          />
          {errors.company_name && (
            <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            {...register("company_address")}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            disabled={isSaving}
          />
          {errors.company_address && (
            <p className="text-red-500 text-sm mt-1">{errors.company_address.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register("company_phone")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.company_phone && (
            <p className="text-red-500 text-sm mt-1">{errors.company_phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("company_email")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.company_email && (
            <p className="text-red-500 text-sm mt-1">{errors.company_email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website (optional)</label>
          <input
            type="url"
            {...register("company_website")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://niloticsuits.com"
            disabled={isSaving}
          />
          {errors.company_website && (
            <p className="text-red-500 text-sm mt-1">{errors.company_website.message}</p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
