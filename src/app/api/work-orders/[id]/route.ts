import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET /api/work-orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requirePermission("work-orders:read");
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    const user = session.user as any;

    // Build where clause based on role
    const where: any = { id, deletedAt: null };
    
    // EU Tailor can only see their assigned orders
    if (user.role === "EU_TAILOR") {
      where.assignedEuTailorId = user.id;
    }

    const workOrder = await prisma.workOrder.findFirst({
      where,
      include: {
        customer: true,
        assignedEuTailor: {
          select: { id: true, name: true, email: true, region: true },
        },
        measurements: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        qcResults: {
          where: { deletedAt: null },
          include: {
            inspector: { select: { id: true, name: true, email: true } },
            qcForm: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        shipments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        notes: {
          where: { deletedAt: null },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Get work order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work order" },
      { status: 500 }
    );
  }
}

// PATCH /api/work-orders/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requirePermission("work-orders:update");
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    const body = await req.json();
    const user = session.user as any;

    // Validate stage transitions
    if (body.currentStage) {
      const existing = await prisma.workOrder.findUnique({
        where: { id },
        include: { measurements: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Work order not found" },
          { status: 404 }
        );
      }

      // Validate transition rules
      if (body.currentStage === "in_production") {
        if (existing.currentStage !== "measurement_approved") {
          return NextResponse.json(
            { error: "Cannot move to production without approved measurements" },
            { status: 400 }
          );
        }
      }

      if (body.currentStage === "in_qc") {
        const incompleteTasks = await prisma.task.count({
          where: {
            workOrderId: id,
            status: { in: ["todo", "in_progress"] },
            type: { not: "rework" },
          },
        });

        if (incompleteTasks > 0) {
          return NextResponse.json(
            { error: "Cannot move to QC with incomplete tasks" },
            { status: 400 }
          );
        }
      }
    }

    // Update work order
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        ...(body.currentStage && { currentStage: body.currentStage }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueAt && { dueAt: new Date(body.dueAt) }),
        ...(body.assignedEuTailorId !== undefined && {
          assignedEuTailorId: body.assignedEuTailorId,
        }),
        ...(body.assignedKeTailorIds && {
          assignedKeTailorIds: body.assignedKeTailorIds,
        }),
      },
      include: {
        customer: true,
        assignedEuTailor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "work_order_updated",
      target: id,
      diff: body,
    });

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error("Update work order error:", error);
    return NextResponse.json(
      { error: "Failed to update work order" },
      { status: 500 }
    );
  }
}
