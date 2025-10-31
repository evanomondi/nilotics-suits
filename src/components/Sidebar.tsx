"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Package,
  Users,
  CheckCircle,
  Truck,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const allRoutes = [
  {
    label: "Work Orders",
    icon: Package,
    href: "/work-orders",
    color: "text-sky-500",
    roles: ["OWNER", "OPS"],
  },
  {
    label: "My Work",
    icon: Package,
    href: "/my-work",
    color: "text-sky-500",
    roles: ["EU_TAILOR"],
  },
  {
    label: "My Tasks",
    icon: Package,
    href: "/my-tasks",
    color: "text-purple-500",
    roles: ["KE_TAILOR"],
  },
  {
    label: "Tailors",
    icon: Users,
    href: "/tailors",
    color: "text-violet-500",
    roles: ["OWNER", "OPS"],
  },
  {
    label: "QC",
    icon: CheckCircle,
    href: "/qc",
    color: "text-pink-700",
    roles: ["OWNER", "OPS", "QC"],
  },
  {
    label: "Shipments",
    icon: Truck,
    href: "/shipments",
    color: "text-orange-700",
    roles: ["OWNER", "OPS"],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["OWNER", "OPS"],
  },
  {
    label: "Audit Logs",
    icon: FileText,
    href: "/audit",
    color: "text-gray-500",
    roles: ["OWNER", "OPS"],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "OPS";

  // Filter routes by role
  const routes = allRoutes.filter((route) =>
    route.roles.includes(userRole)
  );

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/work-orders" className="flex items-center pl-3 mb-14">
          <h1 className="text-2xl font-bold">Nilotic Suits</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
