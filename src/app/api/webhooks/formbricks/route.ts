import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// POST /api/webhooks/formbricks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract measurement data from Formbricks response
    const {
      responseId,
      workOrderId,
      data,
      photos,
    } = body;

    if (!workOrderId) {
      return NextResponse.json(
        { error: "workOrderId is required" },
        { status: 400 }
      );
    }

    // Verify work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // Create measurement record
    const measurement = await prisma.measurement.create({
      data: {
        workOrderId,
        source: "formbricks",
        payload: data || {},
        photos: photos || [],
      },
    });

    // Update work order stage
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { currentStage: "measurement_submitted" },
    });

    await logAudit({
      action: "formbricks_measurement_imported",
      target: workOrderId,
      diff: { measurementId: measurement.id, responseId },
    });

    return NextResponse.json({
      success: true,
      measurementId: measurement.id,
    });
  } catch (error) {
    console.error("Formbricks webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
