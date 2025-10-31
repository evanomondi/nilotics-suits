import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// PATCH /api/work-orders/[id]/tasks/[taskId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { taskId } = params;
    const body = await req.json();
    const user = session.user as any;

    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
      
      // Set timestamps based on status
      if (body.status === "in_progress" && !body.startedAt) {
        updateData.startedAt = new Date();
      }
      if (body.status === "completed" && !body.finishedAt) {
        updateData.finishedAt = new Date();
      }
    }

    if (body.assigneeTailorId !== undefined) {
      updateData.assigneeTailorId = body.assigneeTailorId;
    }

    if (body.checklist) {
      updateData.checklist = body.checklist;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assigneeTailor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "task_updated",
      target: taskId,
      diff: body,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
