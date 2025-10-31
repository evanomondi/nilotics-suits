import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET /api/cron/task-reminders
// Set up in AAPanel cron: curl -X GET https://yourdomain.com/api/cron/task-reminders?secret=YOUR_SECRET
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.nextUrl.searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within 24 hours
    const tasksDueSoon = await prisma.task.findMany({
      where: {
        status: { notIn: ["done", "cancelled"] },
        dueAt: {
          gte: now,
          lte: oneDayFromNow,
        },
        reminderSent: { not: true },
      },
      include: {
        assignee: true,
        workOrder: true,
      },
    });

    // Find overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["done", "cancelled"] },
        dueAt: { lt: now },
        overdueReminderSent: { not: true },
      },
      include: {
        assignee: true,
        workOrder: true,
      },
    });

    // Send reminders for tasks due soon
    for (const task of tasksDueSoon) {
      if (task.assignee?.email) {
        await sendEmail({
          to: task.assignee.email,
          subject: `Task due soon: ${task.title}`,
          template: "taskDueSoon",
          data: {
            assigneeName: task.assignee.name,
            taskTitle: task.title,
            dueAt: task.dueAt?.toISOString(),
            workOrderId: task.workOrderId,
          },
        });

        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSent: true },
        });
      }
    }

    // Send overdue reminders
    for (const task of overdueTasks) {
      if (task.assignee?.email) {
        await sendEmail({
          to: task.assignee.email,
          subject: `Overdue task: ${task.title}`,
          template: "taskOverdue",
          data: {
            assigneeName: task.assignee.name,
            taskTitle: task.title,
            dueAt: task.dueAt?.toISOString(),
            workOrderId: task.workOrderId,
          },
        });

        await prisma.task.update({
          where: { id: task.id },
          data: { overdueReminderSent: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      dueSoon: tasksDueSoon.length,
      overdue: overdueTasks.length,
    });
  } catch (error: any) {
    console.error("Task reminder cron error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process reminders" },
      { status: 500 }
    );
  }
}
