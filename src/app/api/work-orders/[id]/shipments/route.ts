import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createAramexShipment } from "@/lib/aramex";
import { sendEmail } from "@/lib/email";

// POST /api/work-orders/[id]/shipments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const body = await req.json();
    const user = session.user as any;

    // Validate work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    if (workOrder.currentStage !== "ready_to_ship") {
      return NextResponse.json(
        { error: "Work order not ready to ship" },
        { status: 400 }
      );
    }

    // Create Aramex shipment
    const aramexResult = await createAramexShipment({
      recipientName: body.recipientName || workOrder.customer.name,
      recipientAddress: body.recipientAddress,
      recipientCity: body.recipientCity || workOrder.customer.city,
      recipientCountry: body.recipientCountry || workOrder.customer.country,
      recipientPhone: body.recipientPhone || workOrder.customer.phone,
      weight: body.weight,
      description: body.description || "Custom suit order",
    });

    // Create shipment record
    const shipment = await prisma.shipment.create({
      data: {
        workOrderId: id,
        courier: "Aramex",
        waybill: aramexResult.waybill,
        labelUrl: aramexResult.labelUrl,
        cost: aramexResult.cost,
        status: "label_created",
      },
    });

    // Update work order stage
    await prisma.workOrder.update({
      where: { id },
      data: { currentStage: "in_transit_to_eu" },
    });

    await logAudit({
      actorId: user.id,
      action: "shipment_created",
      target: id,
      diff: { shipmentId: shipment.id, waybill: aramexResult.waybill },
    });

    // Send email notification
    await sendEmail({
      to: workOrder.customer.email,
      subject: "Your Order Has Shipped",
      template: "shipmentCreated",
      data: {
        customerName: workOrder.customer.name,
        workOrderId: id,
        waybill: aramexResult.waybill,
        courier: "Aramex",
      },
    });

    return NextResponse.json(shipment);
  } catch (error: any) {
    console.error("Create shipment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create shipment" },
      { status: 500 }
    );
  }
}
