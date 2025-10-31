import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const user = session.user as any;

    // Work order metrics
    const totalWorkOrders = await prisma.workOrder.count({
      where: { deletedAt: null },
    });

    const workOrdersByStage = await prisma.workOrder.groupBy({
      by: ["currentStage"],
      where: { deletedAt: null },
      _count: true,
    });

    const stageMetrics = workOrdersByStage.reduce((acc, item) => {
      acc[item.currentStage] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Task metrics (for current user if tailor)
    const taskWhere: any = {
      deletedAt: null,
      status: { in: ["todo", "in_progress"] },
    };

    if (user.role === "KE_TAILOR" || user.role === "EU_TAILOR") {
      taskWhere.assigneeId = user.id;
    }

    const pendingTasks = await prisma.task.findMany({
      where: taskWhere,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        workOrder: {
          select: {
            id: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { dueAt: "asc" },
      take: 10,
    });

    const overdueTasks = await prisma.task.count({
      where: {
        ...taskWhere,
        dueAt: { lt: new Date() },
      },
    });

    // Recent activity (audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "work_order_created",
            "work_order_updated",
            "task_created",
            "qc_result_created",
            "shipment_created",
          ],
        },
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // QC metrics
    const qcResults = await prisma.qCResult.groupBy({
      by: ["pass"],
      where: { deletedAt: null },
      _count: true,
    });

    const qcMetrics = {
      passed: qcResults.find((r) => r.pass)?.count || 0,
      failed: qcResults.find((r) => !r.pass)?._count || 0,
    };

    return NextResponse.json({
      workOrders: {
        total: totalWorkOrders,
        byStage: stageMetrics,
        inProduction: stageMetrics.in_production || 0,
        inQc: stageMetrics.in_qc || 0,
        readyToShip: stageMetrics.ready_to_ship || 0,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      qc: qcMetrics,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
