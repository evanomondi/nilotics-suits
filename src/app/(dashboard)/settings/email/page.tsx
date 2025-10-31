"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import { Save } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const emailSettingsSchema = z.object({
  smtp_host: z.string().min(1, "SMTP host is required"),
  smtp_port: z.coerce.number().min(1, "SMTP port is required"),
  smtp_user: z.string().min(1, "SMTP user is required"),
  smtp_password: z.string().min(1, "SMTP password is required"),
  mail_from_name: z.string().min(1, "From name is required"),
  mail_from_email: z.string().email("Invalid email address"),
});

type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;

export default function EmailSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data: settings, mutate } = useSWR(
    "/api/settings?keys=smtp_host,smtp_port,smtp_user,smtp_password,mail_from_name,mail_from_email",
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    values: settings || {},
  });

  const onSubmit = async (data: EmailSettingsForm) => {
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
        <h2 className="text-xl font-semibold">Email Configuration</h2>
        <p className="text-gray-500 text-sm">Configure SMTP settings for sending emails</p>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SMTP Host</label>
            <input
              {...register("smtp_host")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="smtp-relay.brevo.com"
              disabled={isSaving}
            />
            {errors.smtp_host && (
              <p className="text-red-500 text-sm mt-1">{errors.smtp_host.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SMTP Port</label>
            <input
              type="number"
              {...register("smtp_port")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="587"
              disabled={isSaving}
            />
            {errors.smtp_port && (
              <p className="text-red-500 text-sm mt-1">{errors.smtp_port.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SMTP Username</label>
          <input
            {...register("smtp_user")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.smtp_user && (
            <p className="text-red-500 text-sm mt-1">{errors.smtp_user.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SMTP Password</label>
          <input
            type="password"
            {...register("smtp_password")}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          />
          {errors.smtp_password && (
            <p className="text-red-500 text-sm mt-1">{errors.smtp_password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">From Name</label>
          <input
            {...register("mail_from_name")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Nilotic Suits"
            disabled={isSaving}
          />
          {errors.mail_from_name && (
            <p className="text-red-500 text-sm mt-1">{errors.mail_from_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">From Email</label>
          <input
            type="email"
            {...register("mail_from_email")}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="noreply@niloticsuits.com"
            disabled={isSaving}
          />
          {errors.mail_from_email && (
            <p className="text-red-500 text-sm mt-1">{errors.mail_from_email.message}</p>
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
