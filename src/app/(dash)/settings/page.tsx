"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import { Save } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const generalSettingsSchema = z.object({
  app_name: z.string().min(1, "App name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  date_format: z.string().min(1, "Date format is required"),
  default_work_order_priority: z.coerce.number().min(0).max(10),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;

export default function GeneralSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data: settings, mutate } = useSWR("/api/settings?keys=app_name,timezone,date_format,default_work_order_priority", fetcher);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    values: settings || {},
  });

  const onSubmit = async (data: GeneralSettingsForm) => {
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
        <h2 className="text-xl font-semibold">General Settings</h2>
        <p className="text-gray-500 text-sm">Configure general application settings</p>
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
          <label className="block text-sm font-medium mb-1">
            Application Name
          </label>
          <input
            {...register("app_name")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Nilotic Suits ERP"
            disabled={isSaving}
          />
          {errors.app_name && (
            <p className="text-red-500 text-sm mt-1">{errors.app_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <select
            {...register("timezone")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          >
            <option value="UTC">UTC</option>
            <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
          {errors.timezone && (
            <p className="text-red-500 text-sm mt-1">{errors.timezone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date Format</label>
          <select
            {...register("date_format")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
          {errors.date_format && (
            <p className="text-red-500 text-sm mt-1">{errors.date_format.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Default Work Order Priority
          </label>
          <input
            type="number"
            {...register("default_work_order_priority")}
            className="w-full px-3 py-2 border rounded-md"
            min="0"
            max="10"
            disabled={isSaving}
          />
          <p className="text-xs text-gray-500 mt-1">
            0 = Lowest priority, 10 = Highest priority
          </p>
          {errors.default_work_order_priority && (
            <p className="text-red-500 text-sm mt-1">
              {errors.default_work_order_priority.message}
            </p>
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
