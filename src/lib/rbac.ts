import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/auth";

export const ROLE_PERMISSIONS = {
  OWNER: ["*"],
  OPS: [
    "work-orders:read",
    "work-orders:create",
    "work-orders:update",
    "customers:read",
    "customers:create",
    "tailors:read",
    "tasks:read",
    "qc:read",
    "shipments:read",
    "shipments:create",
  ],
  EU_TAILOR: [
    "work-orders:read-own",
    "measurements:create",
    "measurements:update",
    "notes:create",
  ],
  KE_TAILOR: ["tasks:read-own", "tasks:update-own", "notes:create"],
  QC: ["qc:read", "qc:create", "qc:update", "work-orders:read"],
};

export async function requireAuth(req?: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function hasPermission(
  role: keyof typeof ROLE_PERMISSIONS,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
