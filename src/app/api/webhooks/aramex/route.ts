import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// POST /api/webhooks/aramex
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { waybill, status, tracking } = body;

    if (!waybill) {
      return NextResponse.json({ error: "waybill required" }, { status: 400 });
    }

    // Find shipment by waybill
    const shipment = await prisma.shipment.findFirst({
      where: { waybill },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Update shipment status
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status, tracking: tracking || shipment.tracking },
    });

    // Update work order stage based on shipment status
    if (status === "delivered") {
      await prisma.workOrder.update({
        where: { id: shipment.workOrderId },
        data: { currentStage: "at_eu_tailor" },
      });
    }

    await logAudit({
      action: "aramex_tracking_update",
      target: shipment.id,
      diff: { waybill, status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Aramex webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
