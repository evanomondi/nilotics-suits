import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET /api/qc-forms
export async function GET(req: NextRequest) {
  const session = await requirePermission("qc:read");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const where = activeOnly ? { active: true, deletedAt: null } : { deletedAt: null };

    const forms = await prisma.qCForm.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("Get QC forms error:", error);
    return NextResponse.json(
      { error: "Failed to fetch QC forms" },
      { status: 500 }
    );
  }
}

// POST /api/qc-forms
export async function POST(req: NextRequest) {
  const session = await requirePermission("qc:create");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();

    const form = await prisma.qCForm.create({
      data: {
        name: body.name,
        steps: body.steps,
        active: body.active !== undefined ? body.active : true,
      },
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error("Create QC form error:", error);
    return NextResponse.json(
      { error: "Failed to create QC form" },
      { status: 500 }
    );
  }
}
