import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET /api/tasks
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const user = session.user as any;
    const { searchParams } = req.nextUrl;

    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const workOrderId = searchParams.get("workOrderId");
    const type = searchParams.get("type");

    const where: any = {
      deletedAt: null,
    };

    // Role-based filtering
    if (user.role === "KE_TAILOR" || user.role === "EU_TAILOR") {
      where.assigneeId = user.id;
    }

    // Filters
    if (status) {
      where.status = status;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    if (type) {
      where.type = type;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        workOrder: {
          select: {
            id: true,
            customer: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: [
        { dueAt: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const user = session.user as any;

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        assigneeId: body.assigneeId,
        workOrderId: body.workOrderId || null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        workOrder: {
          select: { id: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "task_created",
      target: task.id,
      diff: { title: body.title, type: body.type },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
