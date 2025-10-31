"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Mail, Package, Building } from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Settings, href: "/settings" },
  { id: "aramex", label: "Aramex", icon: Package, href: "/settings/aramex" },
  { id: "email", label: "Email", icon: Mail, href: "/settings/email" },
  { id: "company", label: "Company", icon: Building, href: "/settings/company" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Manage application configuration</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
