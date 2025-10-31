import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// PATCH /api/tasks/[taskId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { taskId } = await params;
    const body = await req.json();
    const user = session.user as any;

    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;

      // Set timestamps based on status
      if (body.status === "in_progress" && !body.startedAt) {
        updateData.startedAt = new Date();
      }
      if (body.status === "done" && !body.finishedAt) {
        updateData.finishedAt = new Date();
      }
    }

    if (body.assigneeId !== undefined) {
      updateData.assigneeId = body.assigneeId;
    }

    if (body.title) {
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.dueAt !== undefined) {
      updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    }

    if (body.checklist) {
      updateData.checklist = body.checklist;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
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

// DELETE /api/tasks/[taskId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { taskId } = await params;
    const user = session.user as any;

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: user.id,
      action: "task_deleted",
      target: taskId,
      diff: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
