import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET /api/work-orders
export async function GET(req: NextRequest) {
  const session = await requirePermission("work-orders:read");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const priority = searchParams.get("priority");
    const assignedTailor = searchParams.get("assignedTailor");
    const search = searchParams.get("search");

    const where: any = { deletedAt: null };

    // Stage filter
    if (stage) where.currentStage = stage;

    // Priority filter (range)
    if (priority) {
      const [min, max] = priority.split("-").map(Number);
      where.priority = { gte: min, lte: max };
    }

    // Assigned tailor filter
    if (assignedTailor) where.assignedEuTailorId = assignedTailor;

    // Search filter (customer name, email, or ID)
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: true,
        assignedEuTailor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error("Get work orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders
export async function POST(req: NextRequest) {
  const session = await requirePermission("work-orders:create");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { customerData, priority, dueAt } = body;

    // Create or find customer
    let customer;
    if (customerData.id) {
      customer = await prisma.customer.findUnique({
        where: { id: customerData.id },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          country: customerData.country,
          city: customerData.city,
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        customerId: customer.id,
        currentStage: "measurement_pending",
        priority: priority || 0,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
      include: {
        customer: true,
      },
    });

    await logAudit({
      actorId: (session.user as any).id,
      action: "work_order_created",
      target: workOrder.id,
      diff: { customerId: customer.id },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Create work order error:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}
