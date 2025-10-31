import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

// POST /api/webhooks/aramex-tracking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate webhook signature if Aramex provides one
    const signature = req.headers.get("x-aramex-signature");
    if (signature && !verifyAramexSignature(signature, body)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const { waybill, status, updateCode, updateDateTime, comments } = body;

    if (!waybill) {
      return NextResponse.json(
        { error: "Waybill is required" },
        { status: 400 }
      );
    }

    // Find shipment
    const shipment = await prisma.shipment.findFirst({
      where: { waybill },
      include: { workOrder: { include: { customer: true } } },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Map Aramex status codes to our statuses
    const mappedStatus = mapAramexStatus(updateCode, status);

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: mappedStatus,
        trackingHistory: {
          push: {
            timestamp: updateDateTime || new Date().toISOString(),
            status: status || updateCode,
            location: comments,
          },
        },
      },
    });

    // Update work order stage based on delivery status
    if (mappedStatus === "delivered") {
      await prisma.workOrder.update({
        where: { id: shipment.workOrderId },
        data: { currentStage: "delivered" },
      });

      // Send delivery confirmation email
      await sendEmail({
        to: shipment.workOrder.customer.email,
        subject: "Your Order Has Been Delivered",
        template: "orderDelivered",
        data: {
          customerName: shipment.workOrder.customer.name,
          workOrderId: shipment.workOrderId,
          waybill,
        },
      });
    }

    await logAudit({
      actorId: "system",
      action: "shipment_updated",
      target: shipment.id,
      diff: { status: mappedStatus, updateCode, comments },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Aramex webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function verifyAramexSignature(signature: string, body: any): boolean {
  // Implement signature verification based on Aramex documentation
  // This is a placeholder - replace with actual implementation
  const secret = process.env.ARAMEX_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if no secret configured
  
  // Add actual HMAC verification logic here
  return true;
}

function mapAramexStatus(updateCode: string, status: string): string {
  const statusMap: Record<string, string> = {
    SH001: "picked_up",
    SH002: "in_transit",
    SH003: "out_for_delivery",
    SH004: "delivered",
    SH005: "delivery_failed",
    SH006: "returned",
    SH007: "on_hold",
  };

  return statusMap[updateCode] || status?.toLowerCase() || "in_transit";
}
