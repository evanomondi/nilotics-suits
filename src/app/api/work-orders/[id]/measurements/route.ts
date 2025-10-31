import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

// POST /api/work-orders/[id]/measurements
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = params;
    const body = await req.json();
    const user = session.user as any;

    // Verify work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // Create measurement
    const measurement = await prisma.measurement.create({
      data: {
        workOrderId: id,
        source: body.source || "native",
        payload: body.payload,
        photos: body.photos || [],
      },
    });

    // Update work order stage to measurement_submitted
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id },
      data: { currentStage: "measurement_submitted" },
      include: { customer: true },
    });

    await logAudit({
      actorId: user.id,
      action: "measurement_created",
      target: id,
      diff: { measurementId: measurement.id, source: measurement.source },
    });

    // Send email notification
    await sendEmail({
      to: "ops@niloticsuits.com",
      subject: "New Measurement Submitted",
      template: "measurementSubmitted",
      data: {
        workOrderId: id,
        customerName: updatedWorkOrder.customer.name,
        customerEmail: updatedWorkOrder.customer.email,
      },
    });

    return NextResponse.json(measurement);
  } catch (error) {
    console.error("Create measurement error:", error);
    return NextResponse.json(
      { error: "Failed to create measurement" },
      { status: 500 }
    );
  }
}
