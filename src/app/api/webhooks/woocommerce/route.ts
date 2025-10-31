import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// POST /api/webhooks/woocommerce
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature
    const signature = req.headers.get("x-wc-webhook-signature");
    // TODO: Implement signature verification with WC_WEBHOOK_SECRET

    // Extract order data
    const {
      id,
      billing,
      line_items,
    } = body;

    // Create or update customer
    const customer = await prisma.customer.upsert({
      where: { email: billing.email },
      update: {
        name: `${billing.first_name} ${billing.last_name}`,
        phone: billing.phone,
        country: billing.country,
        city: billing.city,
      },
      create: {
        name: `${billing.first_name} ${billing.last_name}`,
        email: billing.email,
        phone: billing.phone,
        country: billing.country,
        city: billing.city,
      },
    });

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        externalOrderId: `WC-${id}`,
        customerId: customer.id,
        currentStage: "intake_pending",
        priority: 0,
      },
    });

    // Create tasks based on line items (garment types)
    const tasks = [];
    for (const item of line_items) {
      // Map product name to task types
      const productName = item.name.toLowerCase();
      
      // Basic mapping - customize based on your products
      if (productName.includes("suit") || productName.includes("jacket")) {
        tasks.push(
          { type: "cutting", title: "Cutting", workOrderId: workOrder.id },
          { type: "sewing_coat", title: "Sewing Coat", workOrderId: workOrder.id },
          { type: "finishing", title: "Finishing", workOrderId: workOrder.id }
        );
      }
      if (productName.includes("trouser") || productName.includes("pant")) {
        tasks.push({ type: "sewing_trouser", title: "Sewing Trouser", workOrderId: workOrder.id });
      }
    }

    if (tasks.length > 0) {
      await prisma.task.createMany({ data: tasks });
    }

    // Update stage to measurement_pending
    await prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { currentStage: "measurement_pending" },
    });

    await logAudit({
      action: "woocommerce_order_created",
      target: workOrder.id,
      diff: { externalOrderId: `WC-${id}`, customerId: customer.id },
    });

    return NextResponse.json({
      success: true,
      workOrderId: workOrder.id,
    });
  } catch (error) {
    console.error("WooCommerce webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
