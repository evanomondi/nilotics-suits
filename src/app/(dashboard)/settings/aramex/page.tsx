"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import { Save, TestTube } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const aramexSettingsSchema = z.object({
  aramex_username: z.string().min(1, "Username is required"),
  aramex_password: z.string().min(1, "Password is required"),
  aramex_account_number: z.string().min(1, "Account number is required"),
  aramex_account_pin: z.string().min(1, "Account PIN is required"),
  aramex_account_entity: z.string().min(1, "Account entity is required"),
  aramex_account_country_code: z.string().length(2, "Must be 2-letter country code"),
});

type AramexSettingsForm = z.infer<typeof aramexSettingsSchema>;

export default function AramexSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const { data: settings, mutate } = useSWR(
    "/api/settings?keys=aramex_username,aramex_password,aramex_account_number,aramex_account_pin,aramex_account_entity,aramex_account_country_code",
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<AramexSettingsForm>({
    resolver: zodResolver(aramexSettingsSchema),
    values: settings || {},
  });

  const onSubmit = async (data: AramexSettingsForm) => {
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

  const testConnection = async () => {
    setIsTesting(true);
    setTestMessage(null);

    try {
      // TODO: Implement Aramex test connection endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTestMessage("Connection test successful");
    } catch (error: any) {
      setTestMessage("Connection test failed: " + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Aramex Configuration</h2>
        <p className="text-gray-500 text-sm">
          Configure Aramex shipping API credentials
        </p>
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

        {testMessage && (
          <div
            className={`p-3 rounded-md text-sm ${
              testMessage.includes("successful")
                ? "bg-green-50 text-green-600"
                : "bg-yellow-50 text-yellow-600"
            }`}
          >
            {testMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            {...register("aramex_username")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.aramex_username && (
            <p className="text-red-500 text-sm mt-1">
              {errors.aramex_username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register("aramex_password")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.aramex_password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.aramex_password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Account Number
          </label>
          <input
            {...register("aramex_account_number")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.aramex_account_number && (
            <p className="text-red-500 text-sm mt-1">
              {errors.aramex_account_number.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Account PIN</label>
          <input
            type="password"
            {...register("aramex_account_pin")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.aramex_account_pin && (
            <p className="text-red-500 text-sm mt-1">
              {errors.aramex_account_pin.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Account Entity
          </label>
          <input
            {...register("aramex_account_entity")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., AMM"
            disabled={isSaving}
          />
          {errors.aramex_account_entity && (
            <p className="text-red-500 text-sm mt-1">
              {errors.aramex_account_entity.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Country Code
          </label>
          <input
            {...register("aramex_account_country_code")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., KE"
            maxLength={2}
            disabled={isSaving}
          />
          <p className="text-xs text-gray-500 mt-1">2-letter ISO country code</p>
          {errors.aramex_account_country_code && (
            <p className="text-red-500 text-sm mt-1">
              {errors.aramex_account_country_code.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={testConnection}
            disabled={isTesting || isSaving}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            {isTesting ? "Testing..." : "Test Connection"}
          </button>
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
