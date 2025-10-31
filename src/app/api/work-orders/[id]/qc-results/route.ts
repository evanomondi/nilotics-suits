import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

// POST /api/work-orders/[id]/qc-results
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requirePermission("qc:create");
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    const body = await req.json();
    const user = session.user as any;

    // Create QC result
    const qcResult = await prisma.qCResult.create({
      data: {
        workOrderId: id,
        qcFormId: body.qcFormId,
        inspectorId: user.id,
        results: body.results,
        pass: body.pass,
        photos: body.photos || [],
      },
      include: {
        inspector: { select: { id: true, name: true, email: true } },
        qcForm: { select: { id: true, name: true } },
      },
    });

    // If failed, create rework task and move back to production
    if (!body.pass) {
      await prisma.task.create({
        data: {
          workOrderId: id,
          type: "rework",
          status: "pending",
        },
      });

      await prisma.workOrder.update({
        where: { id },
        data: { currentStage: "in_production" },
      });

      // Create note explaining rework
      await prisma.note.create({
        data: {
          workOrderId: id,
          authorId: user.id,
          body: `QC Failed: ${qcResult.qcForm.name}. Rework task created.`,
          visibility: "internal",
        },
      });
    } else {
      // If passed, move to ready_to_ship
      await prisma.workOrder.update({
        where: { id },
        data: { currentStage: "ready_to_ship" },
      });
    }

    await logAudit({
      actorId: user.id,
      action: "qc_result_created",
      target: id,
      diff: { qcResultId: qcResult.id, pass: body.pass },
    });

    // Send email notification
    const emailTemplate = body.pass ? "qcPassed" : "qcFailed";
    await sendEmail({
      to: "ops@niloticsuits.com",
      subject: body.pass ? "QC Inspection Passed" : "QC Inspection Failed",
      template: emailTemplate,
      data: {
        workOrderId: id,
        inspectorName: qcResult.inspector.name,
      },
    });

    return NextResponse.json(qcResult);
  } catch (error) {
    console.error("Create QC result error:", error);
    return NextResponse.json(
      { error: "Failed to create QC result" },
      { status: 500 }
    );
  }
}
